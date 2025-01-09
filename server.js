// server.js

const express = require("express");
const path = require("path");
require("dotenv").config();

// Import services and routes
const browserService = require("./services/browser-service");
const conversionRoutes = require("./routes/conversion-routes");

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
  await browserService.close();
  console.log("Server shutdown complete");
  process.exit(0);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  browserService.close()
    .then(() => process.exit(1))
    .catch(() => process.exit(1));
});

/**
 * Initialize server and browser service
 */
(async () => {
  try {
    // Initialize browser service first
    await browserService.initialize();
    console.log("Browser service initialized successfully");

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
})();