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
   * Update queue status display
   * @param {number} queueLength - Current queue length
   * @param {boolean} isQueueEmpty - Whether queue was initially empty
   */
  updateQueueDisplay: (queueLength, isQueueEmpty) => {
    const queueStatusDiv = document.getElementById("queueStatus");
    if (queueLength > 0) {
      queueStatusDiv.innerHTML = `Queue length: <span>${queueLength}</span> requests in queue.`;
      queueStatusDiv.style.display = "block";
    } else if (isQueueEmpty) {
      queueStatusDiv.style.display = "none";
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
      // Display URLs
      outputDiv.innerHTML = `
        <p><strong>Updated URL:</strong></p>
        <a href="${data.updatedUrl}" target="_blank">${data.updatedUrl}</a>
        <p><strong>Google Maps URL:</strong></p>
        <a href="${data.googleMapsUrl}" target="_blank">${data.googleMapsUrl}</a>
      `;

      // Update map previews
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
