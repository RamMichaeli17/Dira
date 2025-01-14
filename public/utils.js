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

    if (queueLength === 0 || isFirstInQueue) {
      queueStatusDiv.style.display = "none";
      return;
    }

    const position = queueLength;
    const waitTimeMinutes = Math.ceil((position - 1) * 0.5);

    document.querySelector(".position-number").textContent = position;
    document.querySelector(".requests-number").textContent = queueLength;
    document.querySelector(
      ".queue-time"
    ).textContent = `Estimated wait time: ${waitTimeMinutes} minute${
      waitTimeMinutes > 1 ? "s" : ""
    }`;

    const progress = Math.max(5, Math.min(100, (1 / position) * 100));
    const progressFill = document.querySelector(".progress-fill");
    progressFill.style.width = `${progress}%`;

    if (!progressFill.classList.contains("animate")) {
      progressFill.classList.add("animate");
    }

    queueStatusDiv.style.display = "block";
  },

  /**
   * Display results
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
