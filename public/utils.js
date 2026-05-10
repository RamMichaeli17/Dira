// public/utils.js

import { languageUtils } from "./languageUtils.js";
import { requestState } from "./stateUtils.js";

/**
 * UI utility functions for managing DOM elements, states, and dynamic content.
 */
export const uiUtils = {
  /**
   * Displays the loading spinner and hides all other main UI elements.
   */
  showLoading: () => {
    document.getElementById("loading").style.display = "block";
    document.getElementById("queueStatus").style.display = "none";
    document.getElementById("output").innerHTML = "";
    document.getElementById("mapPreview").style.display = "none";
    document.getElementById("googleMapPreview").style.display = "none";
    document.getElementById("aiInsightBtn").style.display = "none";
  },

  /**
   * Hides the loading spinner.
   */
  hideLoading: () => {
    document.getElementById("loading").style.display = "none";
  },

  /**
   * Displays an error message inside the output container.
   * @param {string} messageKey - The key corresponding to the translation dictionary (e.g., 'invalidInput').
   */
  showError: (messageKey) => {
    const outputDiv = document.getElementById("output");
    const errorMessage = languageUtils.getText(`errorMessages.${messageKey}`);

    const existingError = outputDiv.querySelector(".error-container");
    if (existingError) {
      existingError.remove();
    }

    const errorContainer = document.createElement("div");
    errorContainer.className = "error-container";
    errorContainer.innerHTML = `<div class="error-message">${errorMessage}</div>`;

    outputDiv.innerHTML = "";
    outputDiv.appendChild(errorContainer);
    outputDiv.style.display = "block";

    document.getElementById("mapPreview").style.display = "none";
    document.getElementById("googleMapPreview").style.display = "none";
    document.getElementById("queueStatus").style.display = "none";
  },

  /**
   * Removes any active error messages from the DOM.
   */
  hideError: () => {
    const outputDiv = document.getElementById("output");
    const errorContainer = outputDiv.querySelector(".error-container");

    if (errorContainer) {
      errorContainer.remove();
    }
  },

  /**
   * Updates the queue status UI based on the user's position in the queue.
   * @param {number} queueLength - The current total number of items in the queue.
   * @param {boolean} isFirstInQueue - True if the user's request is currently being processed.
   */
  updateQueueDisplay: (queueLength, isFirstInQueue) => {
    const queueStatusDiv = document.getElementById("queueStatus");
    const loadingDiv = document.getElementById("loading");

    queueStatusDiv.style.display = "none";
    loadingDiv.style.display = "none";

    if (queueLength > 0 && requestState.getCurrentRequestId()) {
      if (isFirstInQueue) {
        loadingDiv.style.display = "block";
      } else {
        queueStatusDiv.innerHTML = `
          <div class="queue-message">${languageUtils.getText("requestInQueue")}</div>
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
   * Appends a loading overlay to a map container until the iframe finishes loading.
   * @param {HTMLElement} mapSection - The wrapper section for the specific map.
   * @param {HTMLIFrameElement} iframe - The iframe element that loads the map.
   * @param {string} src - The URL source to load into the iframe.
   */
  addIframeLoadingPlaceholder: (mapSection, iframe, src) => {
    const loadingOverlay = document.createElement("div");
    loadingOverlay.className = "iframe-loading-overlay";
    loadingOverlay.innerHTML = `
      <div class="iframe-spinner">
        <div class="spinner"></div>
        <p>${languageUtils.getText("loadingMap")}</p>
      </div>
    `;

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

    const mapContainer = mapSection.querySelector(".map-container");
    mapContainer.style.position = "relative";
    mapContainer.appendChild(loadingOverlay);

    iframe.src = "";
    iframe.style.opacity = "0";

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

    iframe.src = src;
    mapSection.style.display = "block";
  },

  /**
   * Renders the final successful response data and populates map iframes.
   * @param {Object} data - The conversion data returned from the server.
   */
  displayResults: (data) => {
    document.getElementById("loading").style.display = "none";
    document.getElementById("queueStatus").style.display = "none";

    const outputDiv = document.getElementById("output");
    const govMapSection = document.getElementById("mapPreview");
    const googleMapSection = document.getElementById("googleMapPreview");
    const currentLang = languageUtils.getCurrentLanguage();

    outputDiv.innerHTML = "";
    govMapSection.style.display = "none";
    googleMapSection.style.display = "none";

    if (data.error) {
      outputDiv.innerHTML = `<div class="error-message">${languageUtils.getText("errorMessages.processingError")}</div>`;
      return;
    }

    if (data.googleMapsUrl && data.updatedUrl) {
      const langParam = currentLang === "he" ? "iw" : "en";
      const googleMapsUrl = `${data.googleMapsUrl}&hl=${langParam}`;

      govMapSection.querySelector("strong").textContent = languageUtils.getText(
        "mapLabels.updatedUrl",
      );
      const govMapLink = govMapSection.querySelector(".map-link");
      govMapLink.href = data.updatedUrl;
      govMapLink.textContent = data.updatedUrl;

      const govMapFrame = document.getElementById("govMapFrame");
      const googleMapFrame = document.getElementById("googleMapFrame");

      if (data.govMapIframeUrl) {
        uiUtils.addIframeLoadingPlaceholder(
          govMapSection,
          govMapFrame,
          data.govMapIframeUrl,
        );
      }

      googleMapSection.querySelector("strong").textContent =
        languageUtils.getText("mapLabels.googleMaps");
      const googleMapLink = googleMapSection.querySelector(".map-link");
      googleMapLink.href = googleMapsUrl;
      googleMapLink.textContent = googleMapsUrl;

      if (data.googleMapsIframeUrl) {
        const googleMapsIframeUrl = `${data.googleMapsIframeUrl}&hl=${langParam}&zoom=15&output=embed`;
        uiUtils.addIframeLoadingPlaceholder(
          googleMapSection,
          googleMapFrame,
          googleMapsIframeUrl,
        );
      }

      const direction = currentLang === "he" ? "rtl" : "ltr";
      govMapSection.querySelector(".map-heading").dir = direction;
      googleMapSection.querySelector(".map-heading").dir = direction;

      // === Bulletproof Coordinate Extraction ===
      let lat = null;
      let lng = null;

      // Regex to find two decimal numbers separated by a comma (standard GPS format)
      const coordRegex = /(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/;

      // 1. Try to extract from the main Google Maps URL
      if (data.googleMapsUrl) {
        const match = data.googleMapsUrl.match(coordRegex);
        if (match) {
          lat = match[1];
          lng = match[2];
        }
      }

      // 2. Fallback: Try to extract from the iframe URL if the first one failed
      if ((!lat || !lng) && data.googleMapsIframeUrl) {
        const match = data.googleMapsIframeUrl.match(coordRegex);
        if (match) {
          lat = match[1];
          lng = match[2];
        }
      }

      // Debugging log so we can see exactly what is happening in the console
      console.log("Extraction Results:", { lat, lng, rawData: data });

      const aiBtn = document.getElementById("aiInsightBtn");

      if (lat && lng) {
        aiBtn.dataset.lat = lat;
        aiBtn.dataset.lng = lng;
        aiBtn.style.display = "inline-flex";
      } else {
        console.warn("Missing coordinates. AI button hidden.");
        aiBtn.style.display = "none";
      }
    } else {
      outputDiv.innerHTML = `<div class="error-message">${languageUtils.getText("errorMessages.processingError")}</div>`;
    }
  },
};

/**
 * Utility functions for handling interactive buttons and user input restrictions.
 */
export const buttonUtils = {
  /**
   * Toggles the disabled state of the submit button and visibility of the cancel button.
   * @param {boolean} isConverting - True if the application is currently processing a request.
   */
  updateButtonStates: (isConverting) => {
    const convertButton = document.getElementById("convertButton");
    const cancelButton = document.getElementById("cancelButton");

    convertButton.disabled = isConverting;
    cancelButton.style.display = isConverting ? "inline-block" : "none";
  },

  /**
   * Initializes a UI cooldown animation to prevent spamming requests.
   */
  startCooldown: () => {
    const convertButton = document.getElementById("convertButton");
    const cooldownDuration = 5000;

    let progressBar = document.querySelector(".cooldown-progress");
    if (!progressBar) {
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

    convertButton.disabled = true;
    convertButton.classList.add("cooldown-active");

    progressBar.style.animation = "none";
    progressBar.offsetHeight;
    progressBar.style.animation = `cooldown ${cooldownDuration}ms linear`;

    setTimeout(() => {
      convertButton.disabled = false;
      convertButton.classList.remove("cooldown-active");
      progressBar.style.animation = "none";
    }, cooldownDuration);
  },
};

/**
 * Utility functions for handling the AI Neighborhood Insights feature.
 */
export const aiUtils = {
  async fetchAIInsights(projectInput, lat, lng) {
    const modal = document.getElementById("aiModal");
    const loader = document.getElementById("aiLoader");
    const resultsContainer = document.getElementById("aiResults");

    modal.style.display = "flex";
    loader.style.display = "block";
    resultsContainer.style.display = "none";
    resultsContainer.innerHTML = "";

    try {
      const response = await fetch("/api/ai/neighborhood", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locationDetails: projectInput, lat, lng }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch AI insights");
      }

      const aiData = await response.json();

      loader.style.display = "none";
      this.renderAIResults(aiData);
    } catch (error) {
      console.error("Error fetching AI data:", error);
      loader.style.display = "none";
      resultsContainer.innerHTML = `<div class="error-message">אירעה שגיאה בטעינת הנתונים. אנא נסה שוב מאוחר יותר.</div>`;
      resultsContainer.style.display = "block";
    }
  },

  renderAIResults(data) {
    const resultsContainer = document.getElementById("aiResults");

    const sections = [
      { title: "📌 תקציר", content: data.summary },
      { title: "🎓 חינוך", content: data.education },
      { title: "🚆 תחבורה", content: data.transportation },
      { title: "🏗️ פיתוח עתידי", content: data.futureDevelopment },
    ];

    let htmlContent = "";

    sections.forEach((section) => {
      if (section.content) {
        htmlContent += `
          <div class="ai-section">
            <h4>${section.title}</h4>
            <p>${section.content}</p>
          </div>
        `;
      }
    });

    resultsContainer.innerHTML = htmlContent;
    resultsContainer.style.display = "block";
  },

  closeModal() {
    document.getElementById("aiModal").style.display = "none";
  },
};
