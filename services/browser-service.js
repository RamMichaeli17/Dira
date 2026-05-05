// services/browser-service.js

const puppeteer = require("puppeteer");
const { puppeteerConfig } = require("../config/puppeteer-config");

/**
 * Service for managing Puppeteer browser sessions.
 * Supports switching between proxied and non-proxied connections to optimize costs.
 */
class BrowserService {
  constructor() {
    /** @type {import('puppeteer').Browser | null} */
    this.browser = null;
    this.isExplicitlyClosing = false;
    this.isCurrentlyUsingProxy = false; // Tracks current proxy state
  }

  /**
   * Returns the existing browser or creates a new one.
   * If proxy requirement changes, it automatically reconnects.
   * @param {boolean} useProxy - Whether to use the residential proxy
   * @private
   */
  async _getBrowser(useProxy = true) {
    // If browser exists but proxy state differs, close it to switch modes
    if (this.browser && this.browser.isConnected()) {
      if (this.isCurrentlyUsingProxy === useProxy) {
        return this.browser;
      } else {
        console.log(
          `Switching proxy mode (Proxy needed: ${useProxy}). Reconnecting...`,
        );
        await this.close();
      }
    }

    console.log("Establishing new browser connection...");
    this.isExplicitlyClosing = false;
    this.isCurrentlyUsingProxy = useProxy;

    try {
      if (process.env.USE_BROWSERLESS === "true") {
        // Use proxy only when explicitly requested
        const wsUrl = useProxy
          ? `wss://production-sfo.browserless.io?token=${process.env.BROWSERLESS_TOKEN}&proxy=residential&proxyCountry=il&proxyPreset=px_gov01`
          : `wss://production-sfo.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`;

        console.log(
          `Connecting to Browserless ${useProxy ? "WITH Israeli Proxy..." : "(NO Proxy)..."}`,
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
            "Browser disconnected unexpectedly. Resetting instance...",
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
   * Creates a new Puppeteer page.
   * @param {boolean} useProxy - Default is true (for GovMap). Set to false for MOCH to save costs.
   */
  async createNewPage(useProxy = true) {
    try {
      const browser = await this._getBrowser(useProxy);
      const page = await browser.newPage();
      return page;
    } catch (error) {
      console.error("Failed to create new page:", error);
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
