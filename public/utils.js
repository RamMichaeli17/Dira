// public/utils.js

/**
 * UI utility functions for handling views and displays
 */
export const uiUtils = {
  /**
   * Show loading state and hide other elements
   */
  showLoading: () => {
    document.getElementById("loading").style.display = "block";
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
   * Update queue status display with visual progress indicator
   * @param {number} queueLength - Current queue length
   * @param {boolean} isFirstInQueue - Whether request is first in queue
   */
  updateQueueDisplay: (queueLength, isFirstInQueue) => {
    const queueStatusDiv = document.getElementById("queueStatus");
    const positionNumber = document.querySelector(".position-number");
    const queueTime = document.querySelector(".queue-time");
    const requestsNumber = document.querySelector(".requests-number");
    const progressFill = document.querySelector(".progress-fill");

    // If no queue or request is being processed (first in queue)
    if (queueLength === 0 || isFirstInQueue) {
      queueStatusDiv.style.display = "none";
      return;
    }

    // Show queue status for waiting users
    if (queueLength > 0) {
      const position = queueLength;
      const waitTimeMinutes = Math.ceil((position - 1) * 0.5); // Rough estimate: 30 seconds per request

      // Update position and queue information
      positionNumber.textContent = position;
      requestsNumber.textContent = queueLength;
      queueTime.textContent = `Estimated wait time: ${waitTimeMinutes} minute${
        waitTimeMinutes > 1 ? "s" : ""
      }`;

      // Update progress bar
      const progress = Math.max(5, Math.min(100, (1 / position) * 100));
      progressFill.style.width = `${progress}%`;

      if (!progressFill.classList.contains("animate")) {
        progressFill.classList.add("animate");
      }

      queueStatusDiv.style.display = "block";
    }
  },

  /**
   * Display map previews and URLs
   * @param {Object} data - Response data containing URLs
   */
  displayResults: (data) => {
    const outputDiv = document.getElementById("output");
    const govMapPreviewDiv = document.getElementById("mapPreview");
    const googleMapPreviewDiv = document.getElementById("googleMapPreview");
    const govMapFrame = document.getElementById("govMapFrame");
    const googleMapFrame = document.getElementById("googleMapFrame");

    if (data.googleMapsUrl && data.updatedUrl) {
      outputDiv.innerHTML = `
        <p><strong>Updated URL:</strong></p>
        <a href="${data.updatedUrl}" target="_blank">${data.updatedUrl}</a>
        <p><strong>Google Maps URL:</strong></p>
        <a href="${data.googleMapsUrl}" target="_blank">${data.googleMapsUrl}</a>
      `;

      govMapFrame.src = data.govMapIframeUrl;
      googleMapFrame.src = data.googleMapsIframeUrl;

      govMapPreviewDiv.style.display = "block";
      googleMapPreviewDiv.style.display = "block";
    } else {
      outputDiv.innerHTML = `<p>Error: ${data.error}</p>`;
    }
  },
};

/**
 * Button state management functions
 */
export const buttonUtils = {
  /**
   * Update button states
   * @param {boolean} isConverting - Whether conversion is in progress
   */
  updateButtonStates: (isConverting) => {
    const convertButton = document.getElementById("convertButton");
    const cancelButton = document.getElementById("cancelButton");

    convertButton.disabled = isConverting;
    cancelButton.style.display = isConverting ? "inline-block" : "none";
  },
};
