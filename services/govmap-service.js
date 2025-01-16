// services/govmap-service.js
const queueService = require("./queue-service");

class GovMapService {
  async getCoordinates(projectNumber, page, signal) {
    const baseUrl = `https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~${projectNumber}`;
    console.log("Generated GovMap URL:", baseUrl);
    console.log("Navigating to GovMap URL...");

    let attempts = 0;
    const maxAttempts = 3;
    let pageAlreadyClosed = false;
    let abortHandlerCalled = false;

    // Enhanced abort handler with guard
    const abortHandler = async () => {
      if (abortHandlerCalled) return;
      abortHandlerCalled = true;

      console.log("Navigation aborted");
      try {
        if (!pageAlreadyClosed && !page.isClosed()) {
          // Force stop the page loading
          await page.evaluate(() => window.stop());
          await page.close();
          pageAlreadyClosed = true;
          console.log("Page closed successfully during abort");
        }
      } catch (error) {
        console.error("Non-critical error during abort cleanup:", error);
      }
    };

    // Set up abort handler
    if (signal) {
      signal.addEventListener("abort", abortHandler, { once: true });
    }

    while (attempts < maxAttempts) {
      try {
        // Check if cancelled before navigation
        if (signal?.aborted) {
          await abortHandler();
          throw new Error("Request was canceled");
        }

        // Set a shorter timeout for navigation
        const navigationPromise = page.goto(baseUrl, {
          waitUntil: "networkidle2",
          timeout: 30000, // Reduced timeout
        });

        // Race between navigation and abort signal
        await Promise.race([
          navigationPromise,
          new Promise((_, reject) => {
            if (signal) {
              signal.addEventListener(
                "abort",
                () => {
                  reject(new Error("Request was canceled during navigation"));
                },
                { once: true }
              );
            }
          }),
        ]);

        // Check if cancelled after navigation
        if (signal?.aborted) {
          await abortHandler();
          throw new Error("Request was canceled");
        }

        const finalUrl = page.url();
        console.log("GovMap redirected URL:", finalUrl);

        if (finalUrl.includes("C")) {
          const coords = finalUrl.split("C")[1]?.split(",");
          if (coords?.length === 2) {
            const [x, y] = coords.map(parseFloat);
            if (!isNaN(x) && !isNaN(y)) {
              console.log("Extracted coordinates:", { itmX: x, itmY: y });
              return { x, y };
            }
          }
        }
        attempts++;
      } catch (error) {
        if (error.message.includes("Request was canceled") || signal?.aborted) {
          if (!abortHandlerCalled) {
            await abortHandler();
          }
          throw new Error("Request was canceled");
        }
        attempts++;
        if (attempts === maxAttempts) throw error;
      }
    }

    throw new Error("Failed to get coordinates after multiple attempts");
  }
}

module.exports = new GovMapService();
