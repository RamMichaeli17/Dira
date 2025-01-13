// public/script.js

import { uiUtils, buttonUtils } from "./utils.js";

// Global AbortController for managing request cancellation
let abortController = null;
let currentRequestId = null;

/**
 * Start the conversion process
 */
const startConversion = async () => {
  const projectInput = document.getElementById("projectInput").value.trim();

  if (!projectInput) {
    alert("Please enter a valid URL or project number.");
    return;
  }

  // Update UI states
  buttonUtils.updateButtonStates(true);
  uiUtils.showLoading();

  // Setup abort controller
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();
  const signal = abortController.signal;

  // Generate unique request ID
  currentRequestId = Date.now().toString();

  try {
    // Send conversion request
    const response = await fetch("/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": currentRequestId,
      },
      body: JSON.stringify({ projectInput }),
      signal,
    });

    const data = await response.json();

    if (data.requestId === currentRequestId) {
      uiUtils.displayResults(data);
    }
  } catch (error) {
    const outputDiv = document.getElementById("output");
    outputDiv.innerHTML = signal.aborted
      ? "<p>Request canceled.</p>"
      : "<p>An error occurred.</p>";
    console.error("Error:", error);
  } finally {
    uiUtils.hideLoading();
    buttonUtils.updateButtonStates(false);
    abortController = null;
  }
};

/**
 * Cancel ongoing conversion
 */
const cancelConversion = async () => {
  if (abortController) {
    abortController.abort();
    try {
      await fetch("/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": currentRequestId,
        },
      });
      console.log("Request canceled successfully");
    } catch (error) {
      console.error("Error canceling request:", error);
    }
  }
};

/**
 * Update queue status periodically
 */
const updateQueueStatus = async () => {
  try {
    const response = await fetch("/queue-status", {
      headers: {
        "X-Request-ID": currentRequestId,
      },
    });
    const data = await response.json();

    // Check if this request is currently being processed
    const isFirstInQueue = data.currentRequestId === currentRequestId;

    uiUtils.updateQueueDisplay(data.queueLength, isFirstInQueue);

    if (data.queueLength > 0) {
      setTimeout(updateQueueStatus, 2000);
    }
  } catch (error) {
    console.error("Error fetching queue status:", error);
  }
};

// Start queue status updates when conversion begins
const startQueueUpdates = () => {
  updateQueueStatus();
};

// Event Listeners
document.getElementById("convertButton").addEventListener("click", () => {
  startConversion();
  startQueueUpdates();
});

document
  .getElementById("cancelButton")
  .addEventListener("click", cancelConversion);

document.getElementById("projectInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startConversion();
    startQueueUpdates();
  }
});
