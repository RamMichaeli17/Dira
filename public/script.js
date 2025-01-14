// public/script.js

import { uiUtils, buttonUtils } from "./utils.js";

let abortController = null;
let currentRequestId = null;

/**
 * Start conversion process
 */
const startConversion = async () => {
  const projectInput = document.getElementById("projectInput").value.trim();
  if (!projectInput) {
    alert("Please enter a project URL or number");
    return;
  }

  buttonUtils.updateButtonStates(true);
  uiUtils.showLoading();

  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();
  currentRequestId = Date.now().toString();

  try {
    const response = await fetch("/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": currentRequestId,
      },
      body: JSON.stringify({ projectInput }),
      signal: abortController.signal,
    });

    const data = await response.json();
    if (data.requestId === currentRequestId) {
      uiUtils.displayResults(data);
    }
  } catch (error) {
    document.getElementById("output").innerHTML = abortController.signal.aborted
      ? "<p>Request canceled</p>"
      : "<p>Error occurred</p>";
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
    } catch (error) {
      console.error("Cancel error:", error);
    }
  }
};

/**
 * Update queue status
 */
const updateQueueStatus = async () => {
  try {
    const response = await fetch("/queue-status", {
      headers: { "X-Request-ID": currentRequestId },
    });
    const data = await response.json();

    const isFirstInQueue = data.currentRequestId === currentRequestId;
    uiUtils.updateQueueDisplay(data.queueLength, isFirstInQueue);

    if (!isFirstInQueue) {
      setTimeout(updateQueueStatus, 1000);
    }
  } catch (error) {
    console.error("Queue status error:", error);
  }
};

// Event listeners
document.getElementById("convertButton").addEventListener("click", () => {
  startConversion();
  updateQueueStatus();
});

document
  .getElementById("cancelButton")
  .addEventListener("click", cancelConversion);

document.getElementById("projectInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startConversion();
    updateQueueStatus();
  }
});
