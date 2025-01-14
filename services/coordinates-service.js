// services/coordinates-service.js
const proj4 = require("proj4");
const { ITM, WGS84 } = require("../config/coordinates-config");
const urlService = require("./url-service");

class CoordinatesService {
  /**
   * Convert ITM coordinates to WGS84
   * @param {Object} coordinates ITM coordinates
   * @returns {Object} WGS84 coordinates
   */
  convertCoordinates(coordinates) {
    const [longitude, latitude] = proj4(ITM, WGS84, [
      coordinates.x,
      coordinates.y,
    ]);
    console.log("Converted coordinates:", { longitude, latitude });
    return { longitude, latitude };
  }

  /**
   * Generate all required URLs for the client
   * @param {string} projectNumber
   * @param {Object} coordinates
   * @returns {Object} Object containing all necessary URLs
   */
  generateUrls(projectNumber, coordinates) {
    const { longitude, latitude } = this.convertCoordinates(coordinates);
    const iframeUrls = urlService.generateIframeUrls(projectNumber, {
      latitude,
      longitude,
    });

    return {
      googleMapsUrl: `https://www.google.com/maps/place/${latitude},${longitude}?hl=iw`,
      updatedUrl: `https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~${projectNumber}`,
      ...iframeUrls,
    };
  }
}

module.exports = new CoordinatesService();
