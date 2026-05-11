// services/coordinates-service.js
const proj4 = require("proj4");
const { ITM, WGS84 } = require("../config/coordinates-config");
const urlService = require("./url-service");

/**
 * Service for handling coordinate conversions and URL generation.
 */
class CoordinatesService {
  /**
   * Convert ITM (Israeli Transverse Mercator) coordinates to WGS84 (GPS standard).
   * @param {{x: number, y: number}} coordinates - ITM coordinates
   * @returns {{longitude: number, latitude: number}} WGS84 coordinates
   */
  convertCoordinates(coordinates) {
    // Validate input before conversion to prevent proj4 crashes
    if (
      !coordinates ||
      typeof coordinates.x !== "number" ||
      typeof coordinates.y !== "number"
    ) {
      throw new Error("Invalid coordinates provided for conversion");
    }

    const [longitude, latitude] = proj4(ITM, WGS84, [
      coordinates.x,
      coordinates.y,
    ]);

    console.log("Converted coordinates:", { longitude, latitude });
    return { longitude, latitude };
  }

  /**
   * Generate all required URLs for the client interface.
   * @param {string} projectNumber - The project identifier.
   * @param {{x: number, y: number}} coordinates - Raw ITM coordinates.
   * @returns {Object} Object containing all necessary URLs for maps and iframes.
   */
  generateUrls(projectNumber, coordinates) {
    const { longitude, latitude } = this.convertCoordinates(coordinates);

    const iframeUrls = urlService.generateIframeUrls(projectNumber, {
      latitude,
      longitude,
    });

    return {
      googleMapsUrl: `https://maps.google.com/maps?q=${latitude},${longitude}`,
      updatedUrl: `https://www.govmap.gov.il/?lay=22,Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~${projectNumber}`,
      ...iframeUrls,
    };
  }
}

module.exports = new CoordinatesService();
