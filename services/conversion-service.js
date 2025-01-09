// services/conversion-service.js

const proj4 = require("proj4");
const { ITM, WGS84 } = require("../config/coordinates-config");
const browserService = require("./browser-service");

/**
 * Service for handling coordinate conversions and project information extraction
 */
class ConversionService {
  /**
   * Process project input and return converted coordinates
   * @param {string} projectInput Project number, URL or lottery number
   * @returns {Promise<Object>} Converted URLs and coordinates
   */
  async processProjectInput(projectInput) {
    let newPage = null;
    
    try {
      // Extract project and lottery numbers
      const { projectNumber, lotteryNumber } = await this.extractProjectDetails(projectInput);
      
      // Get coordinates from GovMap
      newPage = await browserService.createNewPage();
      const coordinates = await this.getCoordinates(projectNumber, newPage);
      
      // Generate final URLs
      const urls = this.generateUrls(projectNumber, coordinates);
      
      // Cleanup
      await newPage.close();
      await browserService.resetMainPage();
      
      return urls;
    } catch (error) {
      // Ensure cleanup on error
      if (newPage) await newPage.close();
      await browserService.resetMainPage();
      throw error;
    }
  }

  /**
   * Extract project details from input
   * @param {string} projectInput Project input string
   * @returns {Promise<Object>} Project and lottery numbers
   */
  async extractProjectDetails(projectInput) {
    if (/^\d{4}$/.test(projectInput)) {
      // Handle 4-digit lottery number
      const projectData = await this.findProjectByLottery(projectInput);
      return projectData;
    }
    
    if (/^\d{5}$/.test(projectInput)) {
      // Handle 5-digit project number
      return { projectNumber: projectInput, lotteryNumber: null };
    }
    
    if (/https?:\/\//.test(projectInput)) {
      // Handle URL input
      return this.extractFromUrl(projectInput);
    }
    
    throw new Error("Invalid input format. Expected project number, lottery number, or URL.");
  }

  /**
   * Find project number by lottery number
   * @param {string} lotteryNumber 4-digit lottery number
   * @returns {Promise<Object>} Project and lottery numbers
   */
  async findProjectByLottery(lotteryNumber) {
    const links = await browserService.mainPage.evaluate((lottery) => {
      const anchors = Array.from(document.querySelectorAll("a.details-button"));
      return anchors
        .map(anchor => anchor.href)
        .filter(href => {
          const regex = new RegExp(`https://www\\.dira\\.moch\\.gov\\.il/\\d{5}/${lottery}/ProjectInfo`);
          return regex.test(href);
        });
    }, lotteryNumber);

    if (!links.length) {
      throw new Error(`No project found for lottery number: ${lotteryNumber}`);
    }

    const matches = links[0].match(/\/(\d{5})\/(\d{4})\/ProjectInfo/);
    if (!matches) {
      throw new Error("Failed to extract project number from link");
    }

    return {
      projectNumber: matches[1],
      lotteryNumber: matches[2]
    };
  }

  /**
   * Extract project details from URL
   * @param {string} url Project URL
   * @returns {Object} Project and lottery numbers
   */
  extractFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname
        .split("/")
        .filter(segment => /^\d+$/.test(segment));

      if (pathSegments.length < 2) {
        throw new Error("Invalid URL format");
      }

      return {
        projectNumber: pathSegments[0],
        lotteryNumber: pathSegments[1]
      };
    } catch (error) {
      throw new Error(`Invalid URL format: ${error.message}`);
    }
  }

  /**
   * Get coordinates from GovMap
   * @param {string} projectNumber Project number
   * @param {Page} page Puppeteer page instance
   * @returns {Promise<Object>} Coordinates
   */
  async getCoordinates(projectNumber, page) {
    const baseUrl = `https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~${projectNumber}`;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        await page.goto(baseUrl, { waitUntil: "networkidle2", timeout: 60000 });
        const finalUrl = page.url();

        if (finalUrl.includes("C")) {
          const coords = finalUrl.split("C")[1]?.split(",");
          if (coords?.length === 2) {
            const [x, y] = coords.map(parseFloat);
            if (!isNaN(x) && !isNaN(y)) {
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

  /**
   * Generate final URLs using coordinates
   * @param {string} projectNumber Project number
   * @param {Object} coordinates ITM coordinates
   * @returns {Object} Generated URLs
   */
  generateUrls(projectNumber, coordinates) {
    const [longitude, latitude] = proj4(ITM, WGS84, [coordinates.x, coordinates.y]);
    
    return {
      googleMapsUrl: `https://www.google.com/maps/place/${latitude},${longitude}`,
      iframeUrl: `https://www.govmap.gov.il/map.html?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham|ACTIVEPROJECTID~${projectNumber}`,
      updatedUrl: `https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~${projectNumber}`
    };
  }
}

// Export single instance
module.exports = new ConversionService();