// server.js

const express = require("express");
const path = require("path");
require("dotenv").config();

const browserService = require("./services/browser-service");
const conversionRoutes = require("./routes/conversion-routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", conversionRoutes);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Closing Puppeteer browser...");
  await browserService.close();
  process.exit();
});

// Initialize server
(async () => {
  try {
    await browserService.initialize();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
})();