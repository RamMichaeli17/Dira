// services/browser-service.js

const puppeteer = require("puppeteer");
const { puppeteerConfig } = require("../config/puppeteer-config");

/**
 * Service for managing Puppeteer browser sessions.
 * Uses a Singleton pattern with auto-recovery for remote connections (Browserless).
 */
class BrowserService {
  constructor() {
    /** @type {import('puppeteer').Browser | null} */
    this.browser = null;
    this.isExplicitlyClosing = false;
  }

  /**
   * Returns the existing browser instance or creates a new one if needed.
   * @returns {Promise<import('puppeteer').Browser>} Puppeteer browser instance
   * @private
   */
  async _getBrowser() {
    // Check if browser exists and is actively connected
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    console.log("Establishing new browser connection...");
    this.isExplicitlyClosing = false; // Reset flag on new connection

    try {
      if (process.env.USE_BROWSERLESS === "true") {
        // Build the connection URL with Residential Proxy parameters for Israel and Government sites
        const wsUrl = `wss://production-sfo.browserless.io?token=${process.env.BROWSERLESS_TOKEN}&proxy=residential&proxyCountry=il&proxyPreset=px_gov01`;

        console.log(
          "Connecting to Browserless with Israeli Residential Proxy...",
        );
        this.browser = await puppeteer.connect({
          browserWSEndpoint: wsUrl,
        });
      } else {
        this.browser = await puppeteer.launch(puppeteerConfig);
      }

      // Listen for unexpected disconnections (e.g., 1-minute idle timeout by Browserless)
      this.browser.on("disconnected", () => {
        if (!this.isExplicitlyClosing) {
          console.warn(
            "Browser disconnected unexpectedly. Resetting instance for next request...",
          );
        }
        this.browser = null;
      });

      return this.browser;
    } catch (error) {
      console.error("Failed to connect to browser:", error);
      throw error;
    }
  }

  /**
   * Creates a new Puppeteer page (tab) using the single browser instance.
   * @returns {Promise<import('puppeteer').Page>} New Puppeteer page instance
   */
  async createNewPage() {
    try {
      const browser = await this._getBrowser();
      const page = await browser.newPage();
      return page;
    } catch (error) {
      console.error("Failed to create new page:", error);
      // Auto-recovery mechanism: if page creation fails, force a reset for the next try
      this.browser = null;
      throw error;
    }
  }

  /**
   * Gracefully closes the global browser instance.
   * Should be called during server shutdown.
   */
  async close() {
    if (this.browser) {
      this.isExplicitlyClosing = true; // Prevent the "disconnected" warning
      await this.browser.close();
      this.browser = null;
      console.log("Browser connection gracefully closed.");
    }
  }
}

module.exports = new BrowserService();
