// services/conversion-service.js

const coordinatesService = require("./coordinates-service");
const govmapService = require("./govmap-service");
const projectDetailsService = require("./project-details-service");
const redisService = require("./redis-service");
const browserService = require("./browser-service");

/**
 * Service responsible for orchestrating the entire conversion flow.
 * Handles caching, scraping project details, extracting coordinates, and generating URLs.
 */
class ConversionService {
  /**
   * Checks the Redis cache for existing project data to prevent redundant processing.
   * @param {string} projectInput - The project number or URL provided by the user.
   * @returns {Promise<{data: Object|null, fromCache: boolean}>} The cached data if found.
   */
  async checkCacheForRequest(projectInput) {
    try {
      const cachedData = await redisService.getProjectData(projectInput);
      if (cachedData) {
        console.log(
          `Cache hit for project ${projectInput} - returning immediately.`,
        );
        return { data: cachedData, fromCache: true };
      }
      return { data: null, fromCache: false };
    } catch (error) {
      console.error("Error in checkCacheForRequest:", error);
      throw error;
    }
  }

  /**
   * Processes the project input through the complete conversion pipeline.
   * @param {string} projectInput - The project number or URL to process.
   * @param {AbortSignal} signal - Signal to handle request cancellation.
   * @returns {Promise<Object>} The generated map URLs.
   */
  async processProjectInput(projectInput, signal) {
    const startTime = Date.now();

    try {
      if (signal?.aborted) throw new Error("Request canceled");

      // 1. Extract standard project details (handles both URLs and raw numbers)
      const details =
        await projectDetailsService.extractProjectDetails(projectInput);
      const projectNumber = details.projectNumber;
      console.log(`Processing project number: ${projectNumber}`);

      // --- RESET THE CLOCK FIX ---
      // We explicitly close the browser connection here.
      // This ensures GovMapService gets a fresh 60-second connection window from Browserless!
      await browserService.close();

      if (signal?.aborted) throw new Error("Request canceled");

      // 2. Extract ITM coordinates from GovMap (creates and manages its own browser tabs)
      const coordinates = await govmapService.getCoordinates(
        projectNumber,
        signal,
      );

      if (signal?.aborted) throw new Error("Request canceled");

      // 3. Convert coordinates and generate final URLs (GovMap and Google Maps)
      const urls = coordinatesService.generateUrls(projectNumber, coordinates);

      // Cache the successful results to save resources on future requests
      await redisService.setProjectData(projectInput, urls);
      console.log(`Cached data for project ${projectInput}`);

      // --- BROWSERLESS TIMEOUT FIX ---
      // Reset the connection to guarantee a fresh 60s timeout window for the next user in the queue
      await browserService.close();

      const endTime = Date.now();
      console.log(`Conversion completed in ${endTime - startTime} ms.`);
      return urls;
    } catch (error) {
      console.error("Error in processProjectInput:", error);

      // Ensure the browser connection is reset even if an error occurs to prevent deadlocks
      await browserService.close();

      if (signal?.aborted) throw new Error("Request canceled");
      throw error;
    }
  }
}

module.exports = new ConversionService();
