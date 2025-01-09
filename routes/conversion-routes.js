// routes/conversion.routes.js

const express = require("express");
const router = express.Router();
const queueService = require("../services/queue-service");
const conversionService = require("../services/conversion-service");

/**
 * מטפל בתור הבקשות
 */
async function processQueue() {
  if (!queueService.isEmpty()) {
    const { req, res } = queueService.peek();
    try {
      const result = await conversionService.processProjectInput(req.body.projectInput);
      res.json(result);
    } catch (error) {
      console.error("Error during conversion:", error);
      res.status(500).json({
        error: error.message || "An unexpected error occurred during processing. Please try again later.",
      });
    } finally {
      queueService.remove();
      if (!queueService.isEmpty()) {
        processQueue();
      }
    }
  }
}

// נתיב להמרת נתונים
router.post("/convert", async (req, res) => {
  const startTime = Date.now();
  const { projectInput } = req.body;
  console.log("Received project input:", projectInput);

  if (!projectInput) {
    console.error("No input provided.");
    return res.status(400).json({ error: "Invalid input. Project input is required." });
  }

  queueService.add({ req, res });

  if (queueService.getLength() === 1) {
    processQueue();
  }
});

// נתיב לבדיקת סטטוס התור
router.get("/queue-status", (req, res) => {
  res.json({ queueLength: queueService.getLength() });
});

module.exports = router;