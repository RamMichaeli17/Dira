// public/script.js

import { uiUtils, buttonUtils, aiUtils } from "./utils.js";
import { requestState } from "./stateUtils.js";
import { languageUtils } from "./languageUtils.js";

let abortController = null;

/**
 * Handles the language switching logic and triggers a page reload with animation.
 * @param {string} lang - The language code to switch to (e.g., 'he' or 'en').
 */
const handleLanguageChange = (lang) => {
  const currentLang = languageUtils.getCurrentLanguage();

  if (lang === currentLang) {
    const select = document.querySelector(".custom-select");
    select.classList.remove("open");
    return;
  }

  // Prevent multiple page reloads/animations
  if (document.body.classList.contains("language-changing")) return;

  document.body.classList.add("language-changing");

  const loadingOverlay = document.createElement("div");
  loadingOverlay.className = "page-reload";
  loadingOverlay.innerHTML = '<div class="reload-spinner"></div>';
  document.body.appendChild(loadingOverlay);

  // Trigger animation
  setTimeout(() => {
    loadingOverlay.classList.add("active");
  }, 0);

  // Set language and update UI immediately
  languageUtils.setLanguage(lang);
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";

  // Close dropdown
  const select = document.querySelector(".custom-select");
  select.classList.remove("open");

  // Reload page after animation
  setTimeout(() => {
    location.reload();
  }, 400);
};

/**
 * Validates the user's project input.
 * Accepts either a 3-5 digit project number or a valid dira.moch.gov.il URL.
 * @param {string} input - The raw user input string.
 * @returns {boolean} - True if the input is valid, false otherwise.
 */
const validateInput = (input) => {
  const trimmedInput = input.trim();

  // Check for 3-5 digit numbers
  const isValidNumber = /^\d{3,5}$/.test(trimmedInput);

  // Check for valid URL (made 'www.' optional)
  const isValidUrl = /^https?:\/\/(www\.)?dira\.moch\.gov\.il/.test(
    trimmedInput,
  );

  return isValidNumber || isValidUrl;
};

/**
 * Initiates the conversion process, handles the API request to the backend,
 * and manages UI states (loading, errors, results).
 */
const startConversion = async () => {
  const projectInput = document.getElementById("projectInput").value.trim();

  if (!projectInput) {
    uiUtils.showError("projectRequired");
    return;
  }

  if (!validateInput(projectInput)) {
    uiUtils.showError("invalidInput");
    return;
  }

  buttonUtils.updateButtonStates(true);
  uiUtils.showLoading();
  uiUtils.hideError();

  if (abortController) {
    await cancelConversion();
  }
  abortController = new AbortController();
  requestState.setCurrentRequestId(Date.now().toString());

  try {
    const response = await fetch("/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestState.getCurrentRequestId(),
      },
      body: JSON.stringify({ projectInput }),
      signal: abortController.signal,
    });

    const data = await response.json();

    if (data.error) {
      uiUtils.showError(data.error);
    } else if (data.requestId === requestState.getCurrentRequestId()) {
      uiUtils.displayResults(data);
    }
  } catch (error) {
    if (!abortController.signal.aborted) {
      console.error(error);
      uiUtils.showError("processingError");
    }
  } finally {
    if (abortController.signal.aborted) {
      uiUtils.showError("requestCanceled");
    }
    uiUtils.hideLoading();
    buttonUtils.updateButtonStates(false);
    abortController = null;
  }
};

/**
 * Polls the server periodically to update the user's current position in the queue.
 */
const updateQueueStatus = async () => {
  if (!requestState.getCurrentRequestId()) {
    return;
  }

  try {
    const response = await fetch("/queue-status", {
      headers: { "X-Request-ID": requestState.getCurrentRequestId() },
    });

    const data = await response.json();

    if (requestState.getCurrentRequestId()) {
      const isFirstInQueue =
        data.currentRequestId === requestState.getCurrentRequestId();

      uiUtils.updateQueueDisplay(data.queueLength, isFirstInQueue);

      if (!isFirstInQueue && data.queueLength > 0) {
        setTimeout(updateQueueStatus, 1000);
      }
    }
  } catch (error) {
    console.error("Queue status error:", error);
  }
};

/**
 * Cancels the ongoing conversion request both on the client and server sides.
 */
const cancelConversion = async () => {
  if (abortController) {
    abortController.abort();
    document.getElementById("loading").style.display = "none";
    document.getElementById("queueStatus").style.display = "none";

    try {
      const response = await fetch("/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestState.getCurrentRequestId(),
        },
      });

      if (response.ok) {
        requestState.clearCurrentRequestId();
        uiUtils.showError("requestCanceled");
        buttonUtils.startCooldown();
      }
    } catch (error) {
      console.error("Cancel error:", error);
    }
  }
};

// --- Event Listeners ---

document.getElementById("convertButton").addEventListener("click", () => {
  startConversion();
  setTimeout(updateQueueStatus, 300);
});

document.getElementById("cancelButton").addEventListener("click", async () => {
  await cancelConversion();
});

document.getElementById("projectInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const convertButton = document.getElementById("convertButton");
    if (!convertButton.disabled) {
      startConversion();
      setTimeout(updateQueueStatus, 300);
    }
  }
});

// AI Modal Event Listeners
document.getElementById("aiInsightBtn").addEventListener("click", (event) => {
  const projectInput = document.getElementById("projectInput").value.trim();

  const clickedBtn = event.currentTarget;
  const lat = clickedBtn.dataset.lat;
  const lng = clickedBtn.dataset.lng;

  if (
    projectInput &&
    lat &&
    lng &&
    lat !== "undefined" &&
    lng !== "undefined"
  ) {
    aiUtils.fetchAIInsights(projectInput, lat, lng);
  } else {
    console.warn("Coordinate data missing from cached instance.");
    // Localized alert replacing the hardcoded English one
    alert(languageUtils.getText("errorMessages.geoServiceError"));
  }
});

document.querySelector(".close-ai-btn").addEventListener("click", () => {
  aiUtils.closeModal();
});

// Close modal when clicking outside of it
window.addEventListener("click", (event) => {
  const modal = document.getElementById("aiModal");
  if (event.target === modal) {
    aiUtils.closeModal();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("loaded");

  const initialLoadOverlay = document.createElement("div");
  initialLoadOverlay.className = "page-reload initial-load active";
  initialLoadOverlay.innerHTML = '<div class="reload-spinner"></div>';
  document.body.appendChild(initialLoadOverlay);

  setTimeout(() => {
    initialLoadOverlay.classList.remove("active");
    setTimeout(() => {
      initialLoadOverlay.remove();
    }, 300);
  }, 500);

  const select = document.querySelector(".custom-select");
  const trigger = select.querySelector(".select-trigger");
  const options = select.querySelectorAll(".select-option");
  const selectedText = select.querySelector(".selected-text");
  const triggerFlag = trigger.querySelector(".flag-icon");
  const languageSwitcher = document.querySelector(".language-switcher");

  // Set initial language and direction
  const savedLang = localStorage.getItem("preferredLanguage") || "he";
  document.documentElement.dir = savedLang === "he" ? "rtl" : "ltr";

  // Initialize language
  languageUtils.setLanguage(savedLang);

  // Set correct position before showing
  setTimeout(() => {
    languageSwitcher.classList.add("loaded");
  }, 0);

  // Set initial selection
  const initialOption = Array.from(options).find(
    (opt) => opt.dataset.value === savedLang,
  );

  if (initialOption) {
    selectedText.textContent = initialOption.querySelector("span").textContent;
    triggerFlag.src = initialOption.querySelector(".flag-icon").src;
    triggerFlag.alt = initialOption.querySelector(".flag-icon").alt;
  }

  // Toggle dropdown
  trigger.addEventListener("click", () => {
    select.classList.toggle("open");
  });

  // Handle option selection
  options.forEach((option) => {
    option.addEventListener("click", () => {
      const value = option.dataset.value;
      handleLanguageChange(value);
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!select.contains(e.target)) {
      select.classList.remove("open");
    }
  });

  // Update texts immediately
  languageUtils.updateTexts();
});
