// services/url-service.js

/**
 * Service for handling URL operations and generating iframe sources.
 */
class UrlService {
  /**
   * Generates iframe-compatible URLs for displaying the maps directly in the application.
   * @param {string} projectNumber - The project identifier.
   * @param {{latitude: number, longitude: number}} coordinates - WGS84 coordinates.
   * @returns {{govMapIframeUrl: string, googleMapsIframeUrl: string}} Object containing iframe URLs.
   */
  generateIframeUrls(projectNumber, coordinates) {
    const { latitude, longitude } = coordinates;

    return {
      // Encoded the '|' character to '%7C' to ensure iframe compatibility across all browsers
      govMapIframeUrl: `https://www.govmap.gov.il/map.html?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~${projectNumber}`,
      googleMapsIframeUrl: `https://maps.google.com/maps?q=${latitude},${longitude}`,
    };
  }
}

module.exports = new UrlService();
