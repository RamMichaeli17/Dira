// services/conversion-service.js

const browserService = require("./browser-service");
const coordinatesService = require("./coordinates-service");
const govmapService = require("./govmap-service");
const projectDetailsService = require("./project-details-service");
const urlService = require("./url-service");

class ConversionService {
  /**
   * Process project input and return all necessary data
   * @param {string} projectInput - Project input to process
   * @param {AbortSignal} signal - Signal for request cancellation
   * @returns {Promise<Object>} Processing result
   */
  async processProjectInput(projectInput, signal) {
    const startTime = Date.now();
    let newPage = null;

    try {
      if (signal?.aborted) {
        throw new Error("Request canceled");
      }

      // Get project number
      let projectNumber = null;

      try {
        // First try to get via project details
        const details = await projectDetailsService.extractProjectDetails(
          projectInput
        );
        projectNumber = details.projectNumber;
      } catch (error) {
        // If that fails, try direct extraction
        projectNumber = urlService.extractProjectNumber(projectInput);
      }

      if (!projectNumber) {
        throw new Error("Could not determine project number");
      }

      // Create new page and get coordinates
      newPage = await browserService.createNewPage();

      if (signal?.aborted) {
        if (newPage && !newPage.isClosed()) {
          await newPage.close();
        }
        throw new Error("Request canceled");
      }

      const coordinates = await govmapService.getCoordinates(
        projectNumber,
        newPage,
        signal
      );

      if (signal?.aborted) {
        throw new Error("Request canceled");
      }

      // Generate URLs from coordinates
      const urls = coordinatesService.generateUrls(projectNumber, coordinates);

      // Only close the page if it hasn't been closed already
      if (newPage && !newPage.isClosed()) {
        await newPage.close();
      }
      await browserService.resetMainPage();

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`Conversion completed in ${duration} ms.`);

      return urls;
    } catch (error) {
      // Only try to close the page if it exists and hasn't been closed
      if (newPage && !newPage.isClosed()) {
        await newPage.close();
      }
      await browserService.resetMainPage();

      if (signal?.aborted) {
        throw new Error("Request canceled");
      }
      throw error;
    }
  }
}

module.exports = new ConversionService();
