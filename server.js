// server.js

require("dotenv").config();
const express = require("express");
const path = require("path");

// Services and Routes
const conversionRoutes = require("./routes/conversion-routes");
const redisService = require("./services/redis-service");
const browserService = require("./services/browser-service");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", conversionRoutes);

/**
 * Handles graceful shutdown of the server.
 * Ensures all external connections (Redis, Browserless) are safely closed.
 * @param {string} signal - The signal that triggered the shutdown
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n[${signal}] Initiating graceful shutdown...`);
  try {
    await redisService.close();
    await browserService.close();
    console.log("Server shutdown complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

// Listen for termination signals (SIGINT for local Ctrl+C, SIGTERM for Render deployment)
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

/**
 * Global Error Handlers
 * Catch unexpected errors to prevent silent failures and ensure clean teardown.
 */
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", async (error) => {
  console.error("Uncaught Exception:", error);
  // Ensure resources are closed even on fatal crashes
  await gracefulShutdown("UNCAUGHT_EXCEPTION");
});

/**
 * Initialize Server
 */
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
