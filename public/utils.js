// public/utils.js

import { languageUtils } from "./languageUtils.js";
import { requestState } from "./stateUtils.js";
import { translations } from "./translations.js";

/**
 * UI utility functions
 */
export const uiUtils = {
  /**
   * Show loading state
   */
  showLoading: () => {
    document.getElementById("loading").style.display = "block";
    document.getElementById("queueStatus").style.display = "none";
    document.getElementById("output").innerHTML = "";
    document.getElementById("mapPreview").style.display = "none";
    document.getElementById("googleMapPreview").style.display = "none";
  },

  /**
   * Hide loading state
   */
  hideLoading: () => {
    document.getElementById("loading").style.display = "none";
  },

  /**
   * Show error message with animation
   * @param {string} messageKey Key for the error message in translations
   */
  showError: (messageKey) => {
    const outputDiv = document.getElementById("output");
    const currentLang = languageUtils.getCurrentLanguage();

    // Get translated error message
    let errorMessage = messageKey;
    if (translations[currentLang]?.errorMessages?.[messageKey]) {
      errorMessage = translations[currentLang].errorMessages[messageKey];
    }

    // Remove any existing error first
    const existingError = outputDiv.querySelector(".error-container");
    if (existingError) {
      existingError.querySelector(".error-message").classList.add("slide-out");
      setTimeout(() => existingError.remove(), 300);
    }

    // Create new error message
    const errorContainer = document.createElement("div");
    errorContainer.className = "error-container";
    errorContainer.innerHTML = `<div class="error-message">${errorMessage}</div>`;

    outputDiv.innerHTML = "";
    outputDiv.appendChild(errorContainer);
    outputDiv.style.display = "block";

    // Hide other elements
    document.getElementById("mapPreview").style.display = "none";
    document.getElementById("googleMapPreview").style.display = "none";
    document.getElementById("queueStatus").style.display = "none";

    // Auto-hide error after 5 seconds
    setTimeout(() => {
      const currentError = outputDiv.querySelector(".error-message");
      if (currentError) {
        currentError.classList.add("slide-out");
        setTimeout(() => {
          const container = outputDiv.querySelector(".error-container");
          if (container) {
            container.remove();
          }
        }, 300);
      }
    }, 5000);
  },

  /**
   * Hide error message with animation
   */
  hideError: () => {
    const outputDiv = document.getElementById("output");
    const errorContainer = outputDiv.querySelector(".error-container");

    if (errorContainer) {
      const errorMessage = errorContainer.querySelector(".error-message");
      errorMessage.classList.add("slide-out");
      setTimeout(() => {
        errorContainer.remove();
      }, 300);
    }
  },

  /**
   * Update queue display
   */
  updateQueueDisplay: (queueLength, isFirstInQueue) => {
    const queueStatusDiv = document.getElementById("queueStatus");
    const loadingDiv = document.getElementById("loading");

    // Hide both initially
    queueStatusDiv.style.display = "none";
    loadingDiv.style.display = "none";

    // Only show status if we have a valid queue length and the request wasn't canceled
    if (queueLength > 0 && requestState.getCurrentRequestId()) {
      if (isFirstInQueue) {
        // Show processing for first in queue
        loadingDiv.style.display = "block";
      } else {
        // Show queue status for others
        queueStatusDiv.innerHTML = `
          <div class="queue-message">Your request is in queue</div>
          <div class="queue-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        `;
        queueStatusDiv.style.display = "block";
      }
    }
  },

  /**
   * Display results
   */
  displayResults: (data) => {
    document.getElementById("loading").style.display = "none";
    document.getElementById("queueStatus").style.display = "none";

    const outputDiv = document.getElementById("output");
    const govMapPreviewDiv = document.getElementById("mapPreview");
    const googleMapPreviewDiv = document.getElementById("googleMapPreview");
    const govMapFrame = document.getElementById("govMapFrame");
    const googleMapFrame = document.getElementById("googleMapFrame");

    // Reset all map displays
    govMapPreviewDiv.style.display = "none";
    googleMapPreviewDiv.style.display = "none";

    const currentLang = languageUtils.getCurrentLanguage();
    const labels = translations[currentLang].mapLabels;
    const errorMessages = translations[currentLang].errorMessages;

    if (data.error) {
      outputDiv.innerHTML = `<div class="error-message">${errorMessages.processingError}</div>`;
      return;
    }

    if (data.googleMapsUrl && data.updatedUrl) {
      // Update Google Maps URL with correct language parameter
      const langParam = currentLang === "he" ? "iw" : "en";
      const googleMapsUrl = `${data.googleMapsUrl}&hl=${langParam}`;

      outputDiv.innerHTML = `
        <p dir="${currentLang === "he" ? "rtl" : "ltr"}">
          <strong>${labels.updatedUrl}</strong>
          <br>
          <a href="${data.updatedUrl}" target="_blank">${data.updatedUrl}</a>
        </p>
        <p dir="${currentLang === "he" ? "rtl" : "ltr"}">
          <strong>${labels.googleMaps}</strong>
          <br>
          <a href="${googleMapsUrl}" target="_blank">${googleMapsUrl}</a>
        </p>
      `;

      // Handle GovMap iframe
      if (data.govMapIframeUrl) {
        govMapFrame.onerror = () => {
          console.error("Failed to load GovMap iframe");
          govMapPreviewDiv.style.display = "none";
        };
        govMapFrame.onload = () => {
          govMapPreviewDiv.style.display = "block";
        };
        govMapFrame.src = data.govMapIframeUrl;
      }

      // Handle Google Maps iframe
      if (data.googleMapsIframeUrl) {
        const googleMapsIframeUrl = `${data.googleMapsIframeUrl}&hl=${langParam}&zoom=15&output=embed`;
        googleMapFrame.onerror = () => {
          console.error("Failed to load Google Maps iframe");
          googleMapPreviewDiv.style.display = "none";
        };
        googleMapFrame.onload = () => {
          googleMapPreviewDiv.style.display = "block";
        };
        googleMapFrame.src = googleMapsIframeUrl;
      }
    } else {
      outputDiv.innerHTML = `<div class="error-message">${errorMessages.processingError}</div>`;
    }
  },
};

/**
 * Button utility functions
 */
export const buttonUtils = {
  /**
   * Update button states
   */
  updateButtonStates: (isConverting) => {
    const convertButton = document.getElementById("convertButton");
    const cancelButton = document.getElementById("cancelButton");

    convertButton.disabled = isConverting;
    cancelButton.style.display = isConverting ? "inline-block" : "none";
  },

  startCooldown: () => {
    const convertButton = document.getElementById("convertButton");
    const cooldownDuration = 5000; // 5 seconds

    // Create or get cooldown progress bar
    let progressBar = document.querySelector(".cooldown-progress");
    if (!progressBar) {
      // Wrap button in container if not already wrapped
      let container = document.querySelector(".button-container");
      if (!container) {
        container = document.createElement("div");
        container.className = "button-container";
        convertButton.parentNode.insertBefore(container, convertButton);
        container.appendChild(convertButton);
      }

      progressBar = document.createElement("div");
      progressBar.className = "cooldown-progress";
      container.appendChild(progressBar);
    }

    // Add cooldown state
    convertButton.disabled = true;
    convertButton.classList.add("cooldown-active");

    // Reset and start animation
    progressBar.style.animation = "none";
    progressBar.offsetHeight; // Trigger reflow
    progressBar.style.animation = `cooldown ${cooldownDuration}ms linear`;

    // Remove cooldown after duration
    setTimeout(() => {
      convertButton.disabled = false;
      convertButton.classList.remove("cooldown-active");
      progressBar.style.animation = "none";
    }, cooldownDuration);
  },
};
