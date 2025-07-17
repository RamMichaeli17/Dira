// services/conversion-service.js

const browserService = require("./browser-service");
const coordinatesService = require("./coordinates-service");
const govmapService = require("./govmap-service");
const projectDetailsService = require("./project-details-service");
const urlService = require("./url-service");
const redisService = require("./redis-service");

class ConversionService {
  /**
   * Handle conversion request - check cache first, then return cache status
   * @param {string} projectInput - Project input to process
   * @returns {Promise<{data: Object|null, fromCache: boolean}>} Cache result
   */
  async checkCacheForRequest(projectInput) {
    try {
      // Check cache first
      const cachedData = await redisService.getProjectData(projectInput);
      if (cachedData) {
        console.log(
          `Cache hit for project ${projectInput} - returning immediately`
        );
        return {
          data: cachedData,
          fromCache: true,
        };
      }

      // If not in cache, return indication to process
      console.log(`Cache miss for project ${projectInput} - needs processing`);
      return {
        data: null,
        fromCache: false,
      };
    } catch (error) {
      console.error("Error in checkCacheForRequest:", error);
      throw error;
    }
  }

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

      // Create browser page for processing
      newPage = await browserService.createNewPage();

      if (signal?.aborted) {
        await this.cleanup(newPage);
        throw new Error("Request canceled");
      }

      const coordinates = await govmapService.getCoordinates(
        projectNumber,
        newPage,
        signal
      );

      if (signal?.aborted) {
        await this.cleanup(newPage);
        throw new Error("Request canceled");
      }

      // Generate URLs from coordinates
      const urls = coordinatesService.generateUrls(projectNumber, coordinates);

      // Cache the results
      await redisService.setProjectData(projectInput, urls);
      console.log(`Cached data for project ${projectInput}`);

      // Cleanup
      await this.cleanup(newPage);

      const endTime = Date.now();
      console.log(`Conversion completed in ${endTime - startTime} ms.`);

      return urls;
    } catch (error) {
      console.error("Error in processProjectInput:", error);
      await this.cleanup(newPage);
      if (signal?.aborted) {
        throw new Error("Request canceled");
      }
      throw error;
    }
  }

  async cleanup(page) {
    if (page && !page.isClosed()) {
      await page.close();
      if (page._browserInstance) {
        await page._browserInstance.close();
      }
    }
  }
}

module.exports = new ConversionService();
