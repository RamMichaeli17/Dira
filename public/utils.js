// public/utils.js

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
   * Update queue display
   */
  updateQueueDisplay: (queueLength, isFirstInQueue) => {
    const queueStatusDiv = document.getElementById("queueStatus");
    const loadingDiv = document.getElementById("loading");

    // Hide both initially
    queueStatusDiv.style.display = "none";
    loadingDiv.style.display = "none";

    if (queueLength === 0) {
      return;
    }

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
};
