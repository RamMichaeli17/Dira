// server.js

const express = require("express");
const path = require("path");
require("dotenv").config();

// Import services and routes
const conversionRoutes = require("./routes/conversion-routes");
const redisService = require("./services/redis-service");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", conversionRoutes);

/**
 * Handle graceful shutdown
 */
process.on("SIGINT", async () => {
  console.log("\nInitiating graceful shutdown...");
  await redisService.close();
  console.log("Server shutdown complete");
  process.exit(0);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", async (error) => {
  console.error("Uncaught Exception:", error);
  await redisService.close();
  process.exit(1);
});

/**
 * Initialize server
 */
(async () => {
  try {
    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
})();
