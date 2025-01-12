// services/conversion-service.js
const browserService = require("./browser-service");
const coordinatesService = require("./coordinates-service");
const govmapService = require("./govmap-service");
const projectDetailsService = require("./project-details-service");
const urlService = require("./url-service");

class ConversionService {
  /**
   * Process project input and return all necessary data
   * @param {string} projectInput
   * @returns {Promise<Object>} Processing result
   */
  async processProjectInput(projectInput) {
    let newPage = null;
    const startTime = Date.now();

    try {
      console.log("Processing input:", projectInput);

      // First try to get project details
      const { projectNumber, lotteryNumber } =
        await projectDetailsService.extractProjectDetails(projectInput);

      // Only if that fails, try to extract project number directly
      const finalProjectNumber =
        projectNumber || urlService.extractProjectNumber(projectInput);

      if (!finalProjectNumber) {
        throw new Error("Could not determine project number");
      }

      // Get coordinates and generate URLs
      newPage = await browserService.createNewPage();
      const coordinates = await govmapService.getCoordinates(
        finalProjectNumber,
        newPage
      );
      const urls = coordinatesService.generateUrls(
        finalProjectNumber,
        coordinates
      );

      // Cleanup
      await newPage.close();
      await browserService.resetMainPage();

      console.log(`Conversion completed in ${Date.now() - startTime} ms.`);
      return urls;
    } catch (error) {
      if (newPage) await newPage.close();
      await browserService.resetMainPage();
      throw new Error(`Conversion failed: ${error.message}`);
    }
  }
}

module.exports = new ConversionService();
