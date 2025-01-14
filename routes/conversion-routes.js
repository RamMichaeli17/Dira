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
      console.error("Error processing request:", error);
      const { res, abortController } = currentRequest;

      if (!abortController.signal.aborted) {
        res.status(500).json({
          error: error.message || "An error occurred during processing",
          requestId: currentRequest.id,
          success: false,
        });
      }
    } finally {
      queueService.remove();
      queueService.setProcessingStatus(false);

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
  console.log("Received project input:", req.body.projectInput);

  if (!req.body.projectInput) {
    return res.status(400).json({
      error: "Project input is required",
      requestId: req.headers["x-request-id"],
      success: false,
    });
  }

  const abortController = new AbortController();
  queueService.add({ req, res, abortController });

  console.log(
    "Request added to queue. Queue length:",
    queueService.getLength()
  );

  if (queueService.getLength() === 1) {
    processQueue();
  }
});

/**
 * Cancel request route
 * POST /cancel
 */
router.post("/cancel", (req, res) => {
  const currentRequest = queueService.peek();
  if (currentRequest?.id === req.headers["x-request-id"]) {
    currentRequest.abortController.abort();
    res.json({
      message: "Request canceled",
      success: true,
    });
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
  res.json({
    queueLength: queueService.getLength(),
    isProcessing: queueService.isCurrentlyProcessing(),
    currentRequestId: queueService.getCurrentRequestId(),
    requestId: req.headers["x-request-id"],
    success: true,
  });
});

module.exports = router;
