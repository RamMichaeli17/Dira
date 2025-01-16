// services/conversion-service.js

const browserService = require("./browser-service");
const coordinatesService = require("./coordinates-service");
const govmapService = require("./govmap-service");
const projectDetailsService = require("./project-details-service");
const urlService = require("./url-service");
const redisService = require("./redis-service");

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

      // Get project details
      const details = await projectDetailsService.extractProjectDetails(
        projectInput
      );
      const projectNumber = details.projectNumber;

      console.log(`Processing project number: ${projectNumber}`);

      // Check cache first
      const cachedData = await redisService.getProjectData(projectNumber);
      if (cachedData) {
        console.log(`Cache hit for project ${projectNumber}`);
        return cachedData;
      }

      console.log(`Cache miss for project ${projectNumber}, fetching data...`);

      // If not in cache, proceed with browser automation
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

      // Cache the results
      await redisService.setProjectData(projectNumber, urls);
      console.log(`Cached data for project ${projectNumber}`);

      // Cleanup
      if (newPage && !newPage.isClosed()) {
        await newPage.close();
      }
      await browserService.resetMainPage();

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`Conversion completed in ${duration} ms.`);

      return urls;
    } catch (error) {
      console.error("Error in processProjectInput:", error);

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
