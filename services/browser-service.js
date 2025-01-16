// services/browser-service.js

const puppeteer = require("puppeteer");
const { puppeteerConfig } = require("../config/puppeteer-config");

/**
 * Service for managing Puppeteer browser instance
 * Handles browser initialization, page creation, and cleanup
 */
class BrowserService {
  constructor() {
    this.browser = null;
    this.mainPage = null;
  }

  /**
   * Initialize browser and main page
   * Sets up viewport and navigates to initial URL
   */
  async initialize() {
    try {
      this.browser = await puppeteer.launch(puppeteerConfig);
      this.mainPage = await this.browser.newPage();
      await this.mainPage.setViewport({ width: 1920, height: 1080 });
      console.log("Browser initialized successfully");

      await this.resetMainPage();
      console.log("Main page loaded successfully");
    } catch (error) {
      console.error("Browser initialization failed:", error);
      throw error;
    }
  }

  /**
   * Create a new browser page
   * @returns {Promise<Page>} New Puppeteer page instance
   */
  async createNewPage() {
    try {
      return await this.browser.newPage();
    } catch (error) {
      console.error("Failed to create new page:", error);
      throw error;
    }
  }

  /**
   * Reset main page to initial URL
   */

  async resetMainPage() {
    try {
      await this.mainPage.goto("https://www.dira.moch.gov.il/ProjectsList", {
        waitUntil: "networkidle2",
        timeout: 90000,
      });
    } catch (error) {
      console.error("Failed to reset main page:", error);
      throw error;
    }
  }

  /**
   * Close browser instance and cleanup
   */
  async close() {
    if (this.browser) {
      try {
        await this.browser.close();
        console.log("Browser closed successfully");
      } catch (error) {
        console.error("Failed to close browser:", error);
      }
    }
  }
}

// Export single instance
module.exports = new BrowserService();
