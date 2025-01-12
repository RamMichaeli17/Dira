// services/govmap-service.js
const queueService = require("./queue-service");

class GovMapService {
  async getCoordinates(projectNumber, page, signal) {
    const baseUrl = `https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~${projectNumber}`;
    console.log("Generated GovMap URL:", baseUrl);
    console.log("Navigating to GovMap URL...");

    let attempts = 0;
    const maxAttempts = 3;

    // Set up abort handler
    signal?.addEventListener("abort", async () => {
      console.log("Navigation aborted");
      try {
        if (!page.isClosed()) {
          await page.close();
        }
      } catch (error) {
        console.error("Error closing page:", error);
      }
    });

    while (attempts < maxAttempts) {
      try {
        // Check if cancelled before navigation
        if (signal?.aborted) {
          throw new Error("Request was canceled");
        }

        await page.goto(baseUrl, {
          waitUntil: "networkidle2",
          timeout: 60000,
        });

        // Check if cancelled after navigation
        if (signal?.aborted) {
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
        if (error.message === "Request was canceled" || signal?.aborted) {
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
