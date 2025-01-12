// public/script.js

import { uiUtils, buttonUtils } from "./utils.js";

// Global AbortController for managing request cancellation
let abortController = null;

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

  // Check queue status
  let isQueueEmpty = false;
  try {
    const queueResponse = await fetch("/queue-status");
    const queueData = await queueResponse.json();
    isQueueEmpty = queueData.queueLength === 0;
    uiUtils.updateQueueDisplay(queueData.queueLength, isQueueEmpty);
  } catch (error) {
    console.error("Error fetching queue status:", error);
  }

  try {
    // Send conversion request
    const response = await fetch("/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectInput }),
      signal,
    });

    const data = await response.json();
    uiUtils.displayResults(data);
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

    // Update queue status if queue wasn't empty
    if (!isQueueEmpty) {
      updateQueueStatus();
    }
  }
};

/**
 * Cancel ongoing conversion
 */
const cancelConversion = () => {
  if (abortController) {
    abortController.abort();
  }
};

/**
 * Update queue status periodically
 */
const updateQueueStatus = async () => {
  try {
    const response = await fetch("/queue-status");
    const data = await response.json();

    uiUtils.updateQueueDisplay(data.queueLength, false);

    if (data.queueLength > 0) {
      setTimeout(updateQueueStatus, 2000);
    }
  } catch (error) {
    console.error("Error fetching queue status:", error);
  }
};

// Event Listeners
document
  .getElementById("convertButton")
  .addEventListener("click", startConversion);
document
  .getElementById("cancelButton")
  .addEventListener("click", cancelConversion);
document.getElementById("projectInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startConversion();
  }
});
