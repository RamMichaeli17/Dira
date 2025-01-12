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
   * @param {AbortSignal} signal - AbortController signal for cancellation
   * @returns {Promise<Object>} Processing result
   */
  async processProjectInput(projectInput, signal) {
    let newPage = null;
    const startTime = Date.now();

    try {
      // Check if already cancelled
      if (signal?.aborted) {
        throw new Error("Request was canceled");
      }

      console.log("Processing input:", projectInput);

      // First try to get project details
      const { projectNumber, lotteryNumber } =
        await projectDetailsService.extractProjectDetails(projectInput);

      // Check if cancelled after project details
      if (signal?.aborted) {
        throw new Error("Request was canceled");
      }

      // Only if that fails, try to extract project number directly
      const finalProjectNumber =
        projectNumber || urlService.extractProjectNumber(projectInput);

      if (!finalProjectNumber) {
        throw new Error("Could not determine project number");
      }

      // Get coordinates and generate URLs
      newPage = await browserService.createNewPage();

      // Check if cancelled after page creation
      if (signal?.aborted) {
        if (newPage && !newPage.isClosed()) {
          await newPage.close();
        }
        throw new Error("Request was canceled");
      }

      const coordinates = await govmapService.getCoordinates(
        finalProjectNumber,
        newPage,
        signal
      );

      // Final cancellation check
      if (signal?.aborted) {
        throw new Error("Request was canceled");
      }

      const urls = coordinatesService.generateUrls(
        finalProjectNumber,
        coordinates
      );

      // Cleanup
      if (newPage && !newPage.isClosed()) {
        await newPage.close();
      }
      await browserService.resetMainPage();

      console.log(`Conversion completed in ${Date.now() - startTime} ms.`);
      return urls;
    } catch (error) {
      if (newPage && !newPage.isClosed()) {
        await newPage.close();
      }
      await browserService.resetMainPage();

      if (error.message === "Request was canceled" || signal?.aborted) {
        console.log("Conversion canceled");
        throw new Error("Request was canceled");
      }
      throw new Error(`Conversion failed: ${error.message}`);
    }
  }
}

module.exports = new ConversionService();
