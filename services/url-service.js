// services/url-service.js

/**
 * Service for handling URL operations and conversions
 */
class UrlService {
  /**
   * Generate iframe URLs for both map services
   * @param {string} projectNumber
   * @param {Object} coordinates
   * @returns {Object} Object containing iframe URLs
   */
  generateIframeUrls(projectNumber, coordinates) {
    const { latitude, longitude } = coordinates;

    return {
      govMapIframeUrl: `https://www.govmap.gov.il/map.html?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham|ACTIVEPROJECTID~${projectNumber}`,
      googleMapsIframeUrl: `https://www.google.com/maps?q=${latitude},${longitude}&hl=iw&output=embed`,
    };
  }

  /**
   * Extract project number from URL or input
   * @param {string} input
   * @returns {string} Extracted project number
   */
  extractProjectNumber(input) {
    // If input is a 5-digit number (project number)
    if (/^\d{5}$/.test(input)) {
      return input;
    }

    // If input is a 4-digit number (lottery number), we don't handle it here
    if (/^\d{4}$/.test(input)) {
      return null;
    }

    // Try to extract number from URL
    const urlMatch = input.match(/\d+/);
    if (urlMatch) {
      return urlMatch[0];
    }

    throw new Error("Could not extract project number from input");
  }
}

module.exports = new UrlService();
