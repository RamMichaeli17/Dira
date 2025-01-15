// services/govmap-service.js
const queueService = require("./queue-service");

class GovMapService {
  async getCoordinates(projectNumber, page, signal) {
    const baseUrl = `https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~${projectNumber}`;
    console.log("Generated GovMap URL:", baseUrl);
    console.log("Navigating to GovMap URL...");

    let attempts = 0;
    const maxAttempts = 3;

    // Enhanced abort handler
    const abortHandler = async () => {
      console.log("Navigation aborted");
      try {
        // Force stop the page loading
        await page.evaluate(() => window.stop());
        if (!page.isClosed()) {
          await page.close();
        }
        console.log("Conversion canceled");
      } catch (error) {
        console.error("Error during abort cleanup:", error);
      }
    };

    // Set up abort handler
    signal?.addEventListener("abort", abortHandler);

    while (attempts < maxAttempts) {
      try {
        // Check if cancelled before navigation
        if (signal?.aborted) {
          console.log("Request was canceled before navigation");
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
            signal?.addEventListener("abort", () => {
              reject(new Error("Request was canceled during navigation"));
            });
          }),
        ]);

        // Check if cancelled after navigation
        if (signal?.aborted) {
          console.log("Request was canceled after navigation");
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
          console.log("Request was canceled, error response not sent");
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
