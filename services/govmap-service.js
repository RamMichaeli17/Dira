// services/govmap-service.js
class GovMapService {
  async getCoordinates(projectNumber, page) {
    const baseUrl = `https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~${projectNumber}`;
    console.log("Generated GovMap URL:", baseUrl);
    console.log("Navigating to GovMap URL...");

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        await page.goto(baseUrl, { waitUntil: "networkidle2", timeout: 60000 });
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
        attempts++;
        if (attempts === maxAttempts) throw error;
      }
    }

    throw new Error("Failed to get coordinates after multiple attempts");
  }
}

module.exports = new GovMapService();
