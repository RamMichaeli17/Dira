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
        await newPage?.close();
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

      await newPage?.close();
      await browserService.resetMainPage();

      return urls;
    } catch (error) {
      await newPage?.close();
      await browserService.resetMainPage();

      if (signal?.aborted) {
        throw new Error("Request canceled");
      }
      throw error;
    }
  }
}

// Export a new instance of the service
module.exports = new ConversionService();
