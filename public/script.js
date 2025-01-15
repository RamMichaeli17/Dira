// public/script.js

import { uiUtils, buttonUtils } from "./utils.js";
import { requestState } from "./stateUtils.js";

let abortController = null;

/**
 * Start conversion process
 */
const startConversion = async () => {
  const projectInput = document.getElementById("projectInput").value.trim();
  if (!projectInput) {
    alert("Please enter a project URL or number");
    uiUtils.hideLoading();
    document.getElementById("queueStatus").style.display = "none";
    return;
  }

  buttonUtils.updateButtonStates(true);
  uiUtils.showLoading();

  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();
  requestState.setCurrentRequestId(Date.now().toString());

  try {
    const response = await fetch("/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestState.getCurrentRequestId(),
      },
      body: JSON.stringify({ projectInput }),
      signal: abortController.signal,
    });

    const data = await response.json();
    if (data.requestId === requestState.getCurrentRequestId()) {
      uiUtils.displayResults(data);
    }
  } catch (error) {
    if (!abortController.signal.aborted) {
      document.getElementById("output").innerHTML = "<p>Error occurred</p>";
    }
  } finally {
    if (abortController.signal.aborted) {
      document.getElementById("output").innerHTML = "<p>Request canceled</p>";
    }
    uiUtils.hideLoading();
    buttonUtils.updateButtonStates(false);
    abortController = null;
  }
};

// Enhance the updateQueueStatus function
const updateQueueStatus = async () => {
  // Only proceed if we have a valid currentRequestId
  if (!requestState.getCurrentRequestId()) {
    return;
  }

  try {
    const response = await fetch("/queue-status", {
      headers: { "X-Request-ID": requestState.getCurrentRequestId() },
    });
    const data = await response.json();

    // Only update UI if this request is still valid (not canceled)
    if (requestState.getCurrentRequestId()) {
      const isFirstInQueue =
        data.currentRequestId === requestState.getCurrentRequestId();
      uiUtils.updateQueueDisplay(data.queueLength, isFirstInQueue);

      // Continue polling only if we're still in queue and request wasn't canceled
      if (!isFirstInQueue && data.queueLength > 0) {
        setTimeout(updateQueueStatus, 1000);
      }
    }
  } catch (error) {
    console.error("Queue status error:", error);
  }
};

const cancelConversion = async () => {
  if (abortController) {
    abortController.abort();
    document.getElementById("loading").style.display = "none";
    document.getElementById("queueStatus").style.display = "none";
    requestState.clearCurrentRequestId();

    try {
      await fetch("/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestState.getCurrentRequestId(),
        },
      });
    } catch (error) {
      console.error("Cancel error:", error);
    }
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
