// public/script.js

import { uiUtils, buttonUtils } from "./utils.js";
import { requestState } from "./stateUtils.js";

let abortController = null;

/**
 * Validate project input
 * @param {string} input - User input to validate
 * @returns {boolean} - Whether input is valid
 */
const validateInput = (input) => {
  const trimmedInput = input.trim();

  // Check for 3-5 digit numbers
  const isValidNumber = /^\d{3,5}$/.test(trimmedInput);

  // Check for valid URL
  const isValidUrl = /^https?:\/\/www\.dira\.moch\.gov\.il/.test(trimmedInput);

  return isValidNumber || isValidUrl;
};

/**
 * Start conversion process
 */
const startConversion = async () => {
  const projectInput = document.getElementById("projectInput").value.trim();

  // Input validation
  if (!projectInput) {
    uiUtils.showError("Please enter a project URL or number");
    return;
  }

  if (!validateInput(projectInput)) {
    uiUtils.showError(
      "Invalid input. Please enter a 3-5 digit number or a valid dira.moch.gov.il URL."
    );
    return;
  }

  buttonUtils.updateButtonStates(true);
  uiUtils.showLoading();
  uiUtils.hideError(); // Hide any previous error messages

  if (abortController) {
    await cancelConversion();
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

    if (data.error) {
      uiUtils.showError(data.error);
    } else if (data.requestId === requestState.getCurrentRequestId()) {
      uiUtils.displayResults(data);
    }
  } catch (error) {
    if (!abortController.signal.aborted) {
      uiUtils.showError("An error occurred while processing your request");
    }
  } finally {
    if (abortController.signal.aborted) {
      uiUtils.showError("Request canceled");
    }
    uiUtils.hideLoading();
    buttonUtils.updateButtonStates(false);
    abortController = null;
  }
};

// Enhance the updateQueueStatus function
const updateQueueStatus = async () => {
  if (!requestState.getCurrentRequestId()) {
    return;
  }

  try {
    const response = await fetch("/queue-status", {
      headers: { "X-Request-ID": requestState.getCurrentRequestId() },
    });
    const data = await response.json();

    if (requestState.getCurrentRequestId()) {
      const isFirstInQueue =
        data.currentRequestId === requestState.getCurrentRequestId();
      uiUtils.updateQueueDisplay(data.queueLength, isFirstInQueue);

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

    try {
      // Wait for the cancel request to complete
      const response = await fetch("/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestState.getCurrentRequestId(),
        },
      });

      if (response.ok) {
        // Only clear request ID after successful cancellation
        requestState.clearCurrentRequestId();
        document.getElementById("output").innerHTML = "<p>Request canceled</p>";

        // Start cooldown after successful cancellation
        buttonUtils.startCooldown();
      }
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

document.getElementById("cancelButton").addEventListener("click", async () => {
  // Wait for cancellation to complete
  await cancelConversion();
});

document.getElementById("projectInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startConversion();
    updateQueueStatus();
  }
});
