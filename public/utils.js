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

    // Remove any existing error immediately without animation
    const existingError = outputDiv.querySelector(".error-container");
    if (existingError) {
      existingError.remove();
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
  },

  /**
   * Hide error message without animation
   */
  hideError: () => {
    const outputDiv = document.getElementById("output");
    const errorContainer = outputDiv.querySelector(".error-container");

    if (errorContainer) {
      errorContainer.remove();
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
   * Add loading placeholder for iframes
   * @param {HTMLElement} mapSection
   * @param {HTMLIFrameElement} iframe
   * @param {string} src
   */
  addIframeLoadingPlaceholder: (mapSection, iframe, src) => {
    const currentLang = languageUtils.getCurrentLanguage();
    // Create loading overlay
    const loadingOverlay = document.createElement("div");
    loadingOverlay.className = "iframe-loading-overlay";
    loadingOverlay.innerHTML = `
      <div class="iframe-spinner">
        <div class="spinner"></div>
        <p>${translations[currentLang].loadingMap}</p>
      </div>
    `;

    // Style the overlay
    loadingOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10;
    `;

    // Insert loading overlay
    const mapContainer = mapSection.querySelector(".map-container");
    mapContainer.style.position = "relative";
    mapContainer.appendChild(loadingOverlay);

    // Reset iframe
    iframe.src = "";
    iframe.style.opacity = "0";

    // Load iframe with events
    iframe.onload = () => {
      iframe.style.opacity = "1";
      loadingOverlay.remove();
    };
    iframe.onerror = () => {
      loadingOverlay.innerHTML = `
        <div class="iframe-error">
          <p>Failed to load map</p>
        </div>
      `;
      console.error("Failed to load map iframe");
    };

    // Set source after setting up event handlers
    iframe.src = src;
    mapSection.style.display = "block";
  },

  /**
   * Display results
   */
  displayResults: (data) => {
    document.getElementById("loading").style.display = "none";
    document.getElementById("queueStatus").style.display = "none";

    const outputDiv = document.getElementById("output");
    const govMapSection = document.getElementById("mapPreview");
    const googleMapSection = document.getElementById("googleMapPreview");
    const currentLang = languageUtils.getCurrentLanguage();
    const labels = translations[currentLang].mapLabels;
    const errorMessages = translations[currentLang].errorMessages;

    // Reset all sections
    outputDiv.innerHTML = "";
    govMapSection.style.display = "none";
    googleMapSection.style.display = "none";

    if (data.error) {
      outputDiv.innerHTML = `<div class="error-message">${errorMessages.processingError}</div>`;
      return;
    }

    if (data.googleMapsUrl && data.updatedUrl) {
      // Update Google Maps URL with correct language parameter
      const langParam = currentLang === "he" ? "iw" : "en";
      const googleMapsUrl = `${data.googleMapsUrl}&hl=${langParam}`;

      // Update GovMap section
      govMapSection.querySelector("strong").textContent = labels.updatedUrl;
      const govMapLink = govMapSection.querySelector(".map-link");
      govMapLink.href = data.updatedUrl;
      govMapLink.textContent = data.updatedUrl;

      const govMapFrame = document.getElementById("govMapFrame");
      const googleMapFrame = document.getElementById("googleMapFrame");

      // Add loading placeholder for GovMap
      if (data.govMapIframeUrl) {
        uiUtils.addIframeLoadingPlaceholder(
          govMapSection,
          govMapFrame,
          data.govMapIframeUrl
        );
      }

      // Add loading placeholder for Google Maps
      googleMapSection.querySelector("strong").textContent = labels.googleMaps;
      const googleMapLink = googleMapSection.querySelector(".map-link");
      googleMapLink.href = googleMapsUrl;
      googleMapLink.textContent = googleMapsUrl;

      if (data.googleMapsIframeUrl) {
        const googleMapsIframeUrl = `${data.googleMapsIframeUrl}&hl=${langParam}&zoom=15&output=embed`;
        uiUtils.addIframeLoadingPlaceholder(
          googleMapSection,
          googleMapFrame,
          googleMapsIframeUrl
        );
      }

      // Set RTL/LTR direction
      const direction = currentLang === "he" ? "rtl" : "ltr";
      govMapSection.querySelector(".map-heading").dir = direction;
      googleMapSection.querySelector(".map-heading").dir = direction;
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
