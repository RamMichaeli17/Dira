// server.js

require("dotenv").config();
const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");

// Services and Routes
const conversionRoutes = require("./routes/conversion-routes");
const aiRoutes = require("./routes/ai-routes");
const redisService = require("./services/redis-service");
const browserService = require("./services/browser-service");
const conversionService = require("./services/conversion-service");

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy is REQUIRED when running behind a reverse proxy like Render's load balancers.
// Without this, the rate limiter will block everyone based on the server's internal IP.
app.set("trust proxy", 1);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- Rate Limiting (Anti-Bot Protection) ---

/**
 * Rate limiter configuration to prevent API abuse.
 * Limits each IP address to 50 non-cached requests per 15-minute window.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 15, // Limit each IP to 50 requests per windowMs
  message: { error: "tooManyRequests", success: false },
  skip: async (req, res) => {
    // Using originalUrl because app.use("/convert") strips the base path from req.path
    if (
      req.originalUrl.includes("/convert") &&
      req.body &&
      req.body.projectInput
    ) {
      try {
        const cacheResult = await conversionService.checkCacheForRequest(
          req.body.projectInput,
        );

        // If it's a Cache HIT, we skip counting this request!
        if (cacheResult.fromCache) {
          req.preFetchedCache = cacheResult;
          console.log(
            `[Rate Limit] Skipped counting for cached project: ${req.body.projectInput}`,
          );
          return true; // Bypass the rate limiter
        }
      } catch (error) {
        console.error("Cache check failed in rate limiter:", error);
      }
    }
    return false; // Not in cache, count the request normally
  },
});

// Apply the rate limiting middleware strictly to resource-intensive routes
app.use("/convert", apiLimiter);
app.use("/api/ai", apiLimiter);

// Routes
app.use("/", conversionRoutes);
app.use("/api/ai", aiRoutes);

/**
 * Handles graceful shutdown of the server.
 * Ensures all external connections (Redis, Browserless) are safely closed before exiting.
 * @param {string} signal - The system signal that triggered the shutdown
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

// Listen for termination signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

/**
 * Global Error Handlers
 * Catch unexpected and unhandled errors to prevent silent failures.
 */
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", async (error) => {
  console.error("Uncaught Exception:", error);
  // Ensure critical resources are safely closed even during a fatal crash
  await gracefulShutdown("UNCAUGHT_EXCEPTION");
});

/**
 * Initialize Server
 */
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
