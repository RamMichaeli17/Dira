// routes/conversion-routes.js
const express = require("express");
const router = express.Router();
const queueService = require("../services/queue-service");
const conversionService = require("../services/conversion-service");

/**
 * Process queue items sequentially
 */
async function processQueue() {
  if (queueService.getLength() > 0 && !queueService.isCurrentlyProcessing()) {
    queueService.setProcessingStatus(true);
    const currentRequest = queueService.peek();

    try {
      const { req, res, abortController } = currentRequest;

      if (!req.body.projectInput) {
        throw new Error("Project input is required");
      }

      if (abortController.signal.aborted) {
        // Silent exit for aborted requests
        queueService.remove();
        queueService.setProcessingStatus(false);
        return;
      }

      const result = await conversionService.processProjectInput(
        req.body.projectInput,
        abortController.signal
      );

      if (!abortController.signal.aborted) {
        res.json({
          ...result,
          requestId: currentRequest.id,
          success: true,
        });
      }
    } catch (error) {
      const { res, abortController } = currentRequest;

      // Only log and respond with error if request wasn't canceled
      if (!abortController.signal.aborted) {
        console.error("Error processing request:", error);
        res.status(500).json({
          error: error.message || "An error occurred during processing",
          requestId: currentRequest.id,
          success: false,
        });
      }
    } finally {
      queueService.remove();
      queueService.setProcessingStatus(false);

      // Process next request if available
      if (queueService.getLength() > 0) {
        processQueue();
      }
    }
  }
}

/**
 * Convert project input route
 * POST /convert
 */
router.post("/convert", (req, res) => {
  const requestId = req.headers["x-request-id"];
  console.log("Received project input:", req.body.projectInput);

  if (!req.body.projectInput) {
    return res.status(400).json({
      error: "Project input is required",
      requestId: requestId,
      success: false,
    });
  }

  const abortController = new AbortController();
  queueService.add({ req, res, abortController });

  if (queueService.getLength() === 1) {
    processQueue();
  }
});

/**
 * Cancel request route
 * POST /cancel
 */
router.post("/cancel", (req, res) => {
  const requestId = req.headers["x-request-id"];

  // Try to remove the request from queue
  const request = queueService.removeById(requestId);

  if (request) {
    // Abort the request if it exists
    request.abortController.abort();

    res.json({
      message: "Request canceled successfully",
      success: true,
    });

    // If there are remaining requests and nothing is processing,
    // start processing the next request
    if (queueService.getLength() > 0 && !queueService.isCurrentlyProcessing()) {
      processQueue();
    }
  } else {
    res.status(404).json({
      error: "No matching request found",
      success: false,
    });
  }
});

/**
 * Get queue status route
 * GET /queue-status
 */
router.get("/queue-status", (req, res) => {
  const requestId = req.headers["x-request-id"];

  // Check if request still exists in queue
  const isInQueue = queueService.hasRequest(requestId);

  if (!isInQueue) {
    return res.json({
      queueLength: 0,
      isProcessing: false,
      currentRequestId: null,
      requestId: requestId,
      success: true,
    });
  }

  res.json({
    queueLength: queueService.getLength(),
    isProcessing: queueService.isCurrentlyProcessing(),
    currentRequestId: queueService.getCurrentRequestId(),
    requestId: requestId,
    success: true,
  });
});

module.exports = router;
