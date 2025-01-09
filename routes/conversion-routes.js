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
    
    try {
      const { req, res } = queueService.peek();
      const { projectInput } = req.body;
      
      const result = await conversionService.processProjectInput(projectInput);
      res.json(result);
    } catch (error) {
      const { res } = queueService.peek();
      console.error("Error processing request:", error);
      res.status(500).json({
        error: "An unexpected error occurred during processing. Please try again later."
      });
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
      error: "Invalid input. Project input is required." 
    });
  }

  console.log("Received project input:", projectInput);

  // Add request to queue
  queueService.add({ req, res });
  console.log(`Request added to queue. Processing time: ${Date.now() - startTime}ms`);

  // Start processing if this is the only request
  if (queueService.getLength() === 1) {
    processQueue();
  }
});

/**
 * Route to get current queue status
 * GET /queue-status
 */
router.get("/queue-status", (req, res) => {
  res.json({ 
    queueLength: queueService.getLength(),
    isProcessing: queueService.isCurrentlyProcessing()
  });
});

module.exports = router;