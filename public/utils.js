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
   * @param {boolean} isQueueEmpty - Whether queue was initially empty
   */
  updateQueueDisplay: (queueLength, isFirstInQueue) => {
    const queueStatusDiv = document.getElementById("queueStatus");

    // If no queue or request is being processed (first in queue)
    if (queueLength === 0 || isFirstInQueue) {
      queueStatusDiv.style.display = "none";
      return;
    }

    // Show queue for waiting users
    if (queueLength > 0) {
      const steps = queueStatusDiv.querySelectorAll(".step");
      const connectors = queueStatusDiv.querySelectorAll(".step-connector");
      const queueMessage = queueStatusDiv.querySelector(".queue-message");
      const queueTime = queueStatusDiv.querySelector(".queue-time");

      // Reset all steps and connectors
      steps.forEach((step) => {
        step.className = "step";
      });
      connectors.forEach((connector) => {
        connector.className = "step-connector";
      });

      // Calculate user's position in queue (subtract 1 because first position is being processed)
      const position = Math.min(queueLength, 3);
      const userPosition = position - 1;
      const waitTimeMinutes = Math.ceil(userPosition * 0.5); // Rough estimate: 30 seconds per request

      // Update steps based on position
      for (let i = 0; i < userPosition; i++) {
        steps[i].classList.add("completed");
        if (i < 2) {
          // Only update connectors if not last step
          connectors[i].classList.add("active");
        }
      }
      // Highlight current position
      if (userPosition < 3) {
        steps[userPosition].classList.add("active");
      }

      // Update message and wait time based on position
      queueMessage.textContent =
        userPosition === 0
          ? "You're next in line!"
          : `Your position in queue: ${getOrdinalNumber(userPosition + 1)}`;

      queueTime.textContent = `Estimated wait time: ${waitTimeMinutes} minute${
        waitTimeMinutes > 1 ? "s" : ""
      }`;

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
 * Get ordinal number (1st, 2nd, 3rd, etc.)
 * @param {number} n - Number to convert
 * @returns {string} Number with ordinal suffix
 */
function getOrdinalNumber(n) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

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
