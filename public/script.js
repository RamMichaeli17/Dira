// public/script.js

import { uiUtils, buttonUtils } from "./utils.js";
import { requestState } from "./stateUtils.js";
import { languageUtils } from "./languageUtils.js";
import { translations } from "./translations.js";

window.handleLanguageChange = function (lang) {
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

function updateLanguageButtons() {
  const currentLang = languageUtils.getCurrentLanguage();
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });
}

let abortController = null;

/**
 * Validate project input
 * @param {string} input - User input to validate
 * @returns {boolean} - Whether input is valid
 */
const validateInput = (input) => {
  const trimmedInput = input.trim();

  // Check for 3-5 digit numbers
  const isValidNumber = /^\d{3,5}$/.test(trimmedInput);

  // Check for valid URL
  const isValidUrl = /^https?:\/\/www\.dira\.moch\.gov\.il/.test(trimmedInput);

  return isValidNumber || isValidUrl;
};

/**
 * Start conversion process
 */
const startConversion = async () => {
  const projectInput = document.getElementById("projectInput").value.trim();

  // Input validation
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
  uiUtils.hideError(); // Hide any previous error messages

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
      console.log(error);
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

// Enhance the updateQueueStatus function
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

const cancelConversion = async () => {
  if (abortController) {
    abortController.abort();
    document.getElementById("loading").style.display = "none";
    document.getElementById("queueStatus").style.display = "none";

    try {
      // Wait for the cancel request to complete
      const response = await fetch("/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestState.getCurrentRequestId(),
        },
      });

      if (response.ok) {
        const currentLang = languageUtils.getCurrentLanguage();
        // Only clear request ID after successful cancellation
        requestState.clearCurrentRequestId();
        document.getElementById(
          "output"
        ).innerHTML = `<p>${translations[currentLang].errorMessages["requestCanceled"]}</p>`;

        // Start cooldown after successful cancellation
        buttonUtils.startCooldown();
      }
    } catch (error) {
      console.error("Cancel error:", error);
    }
  }
};

// Event listeners
document.getElementById("convertButton").addEventListener("click", () => {
  startConversion();
  updateQueueStatus();
});

document.getElementById("cancelButton").addEventListener("click", async () => {
  // Wait for cancellation to complete
  await cancelConversion();
});

document.getElementById("projectInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const convertButton = document.getElementById("convertButton");
    if (!convertButton.disabled) {
      startConversion();
      updateQueueStatus();
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // Add loaded class to body to show content
  document.body.classList.add("loaded");

  // Only create and remove loading overlay once
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
    (opt) => opt.dataset.value === savedLang
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
