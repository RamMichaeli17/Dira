// services/govmap-service.js
const browserService = require("./browser-service");

/**
 * Service for interacting with GovMap to extract project coordinates.
 */
class GovMapService {
  constructor() {
    this.MAX_ATTEMPTS = 3;
    this.NAVIGATION_TIMEOUT = 45000;
    this.REDIRECT_TIMEOUT = 30000;
  }

  /**
   * Attempts to navigate to GovMap and extract coordinates.
   * Manages retries, page creation, and request cancellation.
   * @param {string} projectNumber - The project number to search for.
   * @param {AbortSignal} signal - Signal to handle request cancellation.
   * @returns {Promise<{x: number, y: number}>} Extracted ITM coordinates.
   */
  async getCoordinates(projectNumber, signal) {
    const baseUrl = `https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~${projectNumber}`;
    console.log("Generated GovMap URL:", baseUrl);
    console.log("Navigating to GovMap URL...");

    let attempts = 0;
    let abortHandlerCalled = false;
    let currentPage = null; // Track the active page so the abort handler can close it

    const abortHandler = async () => {
      if (abortHandlerCalled) return;
      abortHandlerCalled = true;

      console.log("Navigation aborted");
      try {
        if (currentPage && !currentPage.isClosed()) {
          await currentPage.evaluate(() => window.stop());
          await currentPage.close();
          console.log("Page closed successfully during abort");
        }
      } catch (error) {
        console.error("Non-critical error during abort cleanup:", error);
      }
    };

    if (signal) {
      signal.addEventListener("abort", abortHandler, { once: true });
    }

    while (attempts < this.MAX_ATTEMPTS) {
      try {
        if (signal?.aborted) {
          await abortHandler();
          throw new Error("Request was canceled");
        }

        // Create a fresh page for each attempt to ensure a clean state
        currentPage = await browserService.createNewPage();

        const result = await this._attemptNavigation(
          currentPage,
          baseUrl,
          signal,
          abortHandler,
        );

        // Clean up the page upon success
        if (currentPage && !currentPage.isClosed()) {
          await currentPage.close();
        }

        return result;
      } catch (error) {
        // Clean up the failed page before retrying
        if (currentPage && !currentPage.isClosed()) {
          try {
            await currentPage.close();
          } catch (e) {
            /* ignore */
          }
        }

        if (error.message.includes("Request was canceled") || signal?.aborted) {
          if (!abortHandlerCalled) await abortHandler();
          throw new Error("Request was canceled");
        }

        attempts++;
        console.warn(
          `GovMap navigation attempt ${attempts} failed. Retrying...`,
        );

        if (attempts === this.MAX_ATTEMPTS) {
          throw error;
        }
      }
    }

    throw new Error("Failed to get coordinates after multiple attempts");
  }

  /**
   * Handles a single navigation attempt and waits for the GovMap redirect.
   * @param {import('puppeteer').Page} page - Puppeteer page instance.
   * @param {string} baseUrl - The initial URL to navigate to.
   * @param {AbortSignal} signal - Signal to handle request cancellation.
   * @param {Function} abortHandler - Cleanup function for aborted requests.
   * @returns {Promise<{x: number, y: number}>} Extracted ITM coordinates.
   * @private
   */
  async _attemptNavigation(page, baseUrl, signal, abortHandler) {
    if (signal?.aborted) {
      await abortHandler();
      throw new Error("Request was canceled");
    }

    const navigationPromise = page.goto(baseUrl, {
      waitUntil: "domcontentloaded",
      timeout: this.NAVIGATION_TIMEOUT,
    });

    // Race between navigation and the abort signal
    await Promise.race([
      navigationPromise,
      new Promise((_, reject) => {
        if (signal) {
          signal.addEventListener(
            "abort",
            () => reject(new Error("Request was canceled during navigation")),
            { once: true },
          );
        }
      }),
    ]);

    if (signal?.aborted) {
      await abortHandler();
      throw new Error("Request was canceled");
    }

    // Wait for GovMap to process and inject the 'c' parameter into the URL
    console.log(
      "Page structure loaded, waiting for GovMap to inject coordinates into URL...",
    );

    await page.waitForFunction(() => window.location.href.includes("c="), {
      timeout: this.REDIRECT_TIMEOUT,
    });

    const finalUrl = page.url();
    console.log("GovMap redirected URL:", finalUrl);

    return this._extractCoordinatesFromUrl(finalUrl);
  }

  /**
   * Extracts ITM coordinates from the 'c' parameter in the GovMap URL.
   * @param {string} finalUrl - The URL after GovMap redirect.
   * @returns {{x: number, y: number}} Extracted coordinates.
   * @throws {Error} If coordinates cannot be found or parsed correctly.
   * @private
   */
  _extractCoordinatesFromUrl(finalUrl) {
    if (finalUrl.includes("c")) {
      const url = new URL(finalUrl);
      const cParam = url.searchParams.get("c");

      if (cParam) {
        const coords = cParam.split(",");
        if (coords.length === 2) {
          const [x, y] = coords.map(parseFloat);
          if (!isNaN(x) && !isNaN(y)) {
            console.log("Extracted coordinates:", { itmX: x, itmY: y });
            return { x, y };
          }
        }
      }
    }
    throw new Error("Could not extract valid coordinates from the GovMap URL");
  }
}

module.exports = new GovMapService();
