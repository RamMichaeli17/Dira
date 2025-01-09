// config/puppeteer-config.js

const puppeteer = require("puppeteer");

/**
 * Puppeteer configuration object
 * Contains all the necessary settings for browser initialization
 * headless mode is controlled by environment variable HEADLESS_ON
 */
const puppeteerConfig = {
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-gpu",
    "--start-maximized",
  ],
  headless: process.env.HEADLESS_ON === "true",
  executablePath:
    process.env.NODE_ENV === "production"
      ? process.env.PUPPETEER_EXECUTABLE_PATH
      : puppeteer.executablePath(),
};

module.exports = { puppeteerConfig };