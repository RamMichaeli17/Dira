// routes/conversion-routes.js
const express = require("express");
const router = express.Router();
const queueService = require("../services/queue-service");
const conversionService = require("../services/conversion-service");

/**
 * Process queued requests sequentially
 */
async function processQueue() {
  // Only process if there are items in queue and not already processing
  if (queueService.getLength() > 0 && !queueService.isCurrentlyProcessing()) {
    queueService.setProcessingStatus(true);
    const currentRequest = queueService.peek();

    try {
      const { req, res, abortController } = currentRequest;
      const { projectInput } = req.body;

      const result = await conversionService.processProjectInput(
        projectInput,
        abortController.signal
      );

      // Check if request was canceled before sending response
      if (!abortController.signal.aborted) {
        res.json({
          ...result,
          requestId: currentRequest.id,
        });
      } else {
        console.log("Request was canceled, response not sent");
      }
    } catch (error) {
      const { res, abortController } = currentRequest;
      if (!abortController.signal.aborted) {
        console.error("Error processing request:", error);
        res.status(500).json({
          error:
            error.message || "An unexpected error occurred during processing",
          requestId: currentRequest.id,
        });
      } else {
        console.log("Request was canceled, error response not sent");
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
 * Route to convert project input to coordinates
 * POST /convert
 */
router.post("/convert", async (req, res) => {
  const startTime = Date.now();
  const { projectInput } = req.body;

  // Validate input
  if (!projectInput) {
    console.error("Missing project input");
    return res.status(400).json({
      error: "Invalid input. Project input is required.",
      requestId: req.headers["x-request-id"],
    });
  }

  console.log("Received project input:", projectInput);

  // Create abort controller for this request
  const abortController = new AbortController();

  // Add request to queue with abort controller
  queueService.add({ req, res, abortController });
  console.log(
    `Request added to queue. Processing time: ${Date.now() - startTime}ms`
  );

  // Start processing if this is the only request
  if (queueService.getLength() === 1) {
    processQueue();
  }
});

/**
 * Route to cancel current request
 * POST /cancel
 */
router.post("/cancel", (req, res) => {
  const currentRequest = queueService.peek();
  if (currentRequest?.abortController) {
    // Only cancel if the request ID matches
    if (currentRequest.id === req.headers["x-request-id"]) {
      currentRequest.abortController.abort();
      res.json({ message: "Request canceled successfully" });
    } else {
      res.status(403).json({ error: "Not authorized to cancel this request" });
    }
  } else {
    res.status(404).json({ error: "No active request to cancel" });
  }
});

/**
 * Route to get current queue status
 * GET /queue-status
 */
router.get("/queue-status", (req, res) => {
  const requestId = req.headers["x-request-id"];
  res.json({
    queueLength: queueService.getLength(),
    isProcessing: queueService.isCurrentlyProcessing(),
    currentRequestId: queueService.getCurrentRequestId(),
    requestId: requestId,
  });
});

module.exports = router;
