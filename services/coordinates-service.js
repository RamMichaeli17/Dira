// services/coordinates-service.js
const proj4 = require("proj4");
const { ITM, WGS84 } = require("../config/coordinates-config");

class CoordinatesService {
  convertCoordinates(coordinates) {
    const [longitude, latitude] = proj4(ITM, WGS84, [
      coordinates.x,
      coordinates.y,
    ]);
    console.log("Converted coordinates:", { longitude, latitude });
    return { longitude, latitude };
  }

  generateUrls(projectNumber, coordinates) {
    const { longitude, latitude } = this.convertCoordinates(coordinates);

    return {
      googleMapsUrl: `https://www.google.com/maps/place/${latitude},${longitude}`,
      iframeUrl: `https://www.govmap.gov.il/map.html?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham|ACTIVEPROJECTID~${projectNumber}`,
      updatedUrl: `https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~${projectNumber}`,
    };
  }
}

module.exports = new CoordinatesService();
