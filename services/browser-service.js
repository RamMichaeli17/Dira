// services/browser-service.js

const puppeteer = require("puppeteer");
const { puppeteerConfig } = require("../config/puppeteer-config");

/**
 * Service for managing Puppeteer browser sessions.
 * Each request opens its own browser session.
 */
class BrowserService {
  /**
   * Create a new Puppeteer page with its own browser session.
   * @returns {Promise<Page>} New Puppeteer page instance
   */
  async createNewPage() {
    let browser;
    try {
      if (process.env.USE_BROWSERLESS === "true") {
        browser = await puppeteer.connect({
          browserWSEndpoint: `wss://production-sfo.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`,
        });
      } else {
        browser = await puppeteer.launch(puppeteerConfig);
      }
      const page = await browser.newPage();
      page._browserInstance = browser;
      return page;
    } catch (error) {
      console.error("Failed to create new page:", error);
      throw error;
    }
  }

  async close() {
    // No global browser to close anymore
  }
}

module.exports = new BrowserService();
