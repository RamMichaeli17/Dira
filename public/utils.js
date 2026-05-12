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

    if (!requestState.getCurrentRequestId()) {
      loadingDiv.style.display = "none";
      return;
    }

    if (queueLength > 0 && !isFirstInQueue) {
      loadingDiv.style.display = "none";
      queueStatusDiv.innerHTML = `
        <div class="queue-message">${languageUtils.getText("requestInQueue")}</div>
        <div class="queue-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      `;
      queueStatusDiv.style.display = "flex";
    } else {
      loadingDiv.style.display = "block";
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
          <p>${languageUtils.getText("errorMessages.processingError")}</p>
        </div>
      `;
      console.error("Failed to load map iframe");
    };

    iframe.src = src;
    mapSection.style.display = "flex";
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

      let lat = null;
      let lng = null;

      const coordRegex = /(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/;

      if (data.googleMapsUrl) {
        const match = data.googleMapsUrl.match(coordRegex);
        if (match) {
          lat = match[1];
          lng = match[2];
        }
      }

      if ((!lat || !lng) && data.googleMapsIframeUrl) {
        const match = data.googleMapsIframeUrl.match(coordRegex);
        if (match) {
          lat = match[1];
          lng = match[2];
        }
      }

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
  /**
   * Local in-memory cache to store AI results per project.
   * Persists only until the page is reloaded.
   * Key includes both project input and language to prevent cross-language caching bugs.
   * @type {Object.<string, Object>}
   */
  insightsCache: {},

  /**
   * Fetches the neighborhood insights from the backend AI service or local memory.
   * @param {string} projectInput - The original project ID/URL entered by the user.
   * @param {string} lat - Latitude of the project.
   * @param {string} lng - Longitude of the project.
   */
  async fetchAIInsights(projectInput, lat, lng) {
    const modal = document.getElementById("aiModal");
    const loader = document.getElementById("aiLoader");
    const resultsContainer = document.getElementById("aiResults");
    const currentLang = languageUtils.getCurrentLanguage();

    modal.style.display = "flex";

    const cacheKey = `${projectInput}_${currentLang}`;

    if (this.insightsCache[cacheKey]) {
      console.log(`[AI Cache] Hit for project: ${cacheKey}`);
      loader.style.display = "none";
      this.renderAIResults(this.insightsCache[cacheKey]);
      return;
    }

    loader.style.display = "block";
    resultsContainer.style.display = "none";
    resultsContainer.innerHTML = "";

    try {
      const response = await fetch("/api/ai/neighborhood", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationDetails: projectInput,
          lat,
          lng,
          language: currentLang,
        }),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        throw new Error("aiError");
      }

      if (!response.ok) {
        throw new Error(responseData.error || "aiError");
      }

      this.insightsCache[cacheKey] = responseData;

      loader.style.display = "none";
      this.renderAIResults(responseData);
    } catch (error) {
      console.error("Error fetching AI data:", error);
      loader.style.display = "none";

      const errorKey = error.message || "aiError";
      resultsContainer.innerHTML = `<div class="error-message">${languageUtils.getText(`errorMessages.${errorKey}`)}</div>`;
      resultsContainer.style.display = "block";
    }
  },

  /**
   * Renders the structured AI response into the modal.
   * Uses translations for section headers to support i18n.
   * @param {Object} data - The JSON object returned by the AI service.
   */
  renderAIResults(data) {
    const resultsContainer = document.getElementById("aiResults");

    const sections = [
      {
        title: languageUtils.getText("aiSections.summary"),
        content: data.summary,
      },
      {
        title: languageUtils.getText("aiSections.education"),
        content: data.education,
      },
      {
        title: languageUtils.getText("aiSections.transportation"),
        content: data.transportation,
      },
      {
        title: languageUtils.getText("aiSections.future"),
        content: data.futureDevelopment,
      },
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

    if (data.neighborhoodName) {
      const isHebrew = languageUtils.getCurrentLanguage() === "he";
      const btnText = isHebrew
        ? `🔍 חפש מידע נוסף על ${data.neighborhoodName} בגוגל`
        : `🔍 Search Google for ${data.neighborhoodName}`;

      const searchSuffix = isHebrew ? " שכונה" : " neighborhood";
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(data.neighborhoodName + searchSuffix)}`;

      htmlContent += `
        <div style="margin-top: 20px; text-align: center;">
          <a href="${searchUrl}" target="_blank" class="google-search-btn" style="background: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500; transition: background 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            ${btnText}
          </a>
        </div>
      `;
    }

    resultsContainer.innerHTML = htmlContent;
    resultsContainer.style.display = "block";
  },

  /**
   * Closes the AI Modal popup.
   */
  closeModal() {
    document.getElementById("aiModal").style.display = "none";
  },
};
