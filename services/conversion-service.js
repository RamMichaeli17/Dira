// services/conversion-service.js
const browserService = require("./browser-service");
const coordinatesService = require("./coordinates-service");
const govmapService = require("./govmap-service");
const projectDetailsService = require("./project-details-service");

class ConversionService {
  async processProjectInput(projectInput) {
    let newPage = null;
    const startTime = Date.now();

    try {
      console.log("Received project input:", projectInput);

      const { projectNumber, lotteryNumber } =
        await projectDetailsService.extractProjectDetails(projectInput);

      newPage = await browserService.createNewPage();
      const coordinates = await govmapService.getCoordinates(
        projectNumber,
        newPage
      );
      const urls = coordinatesService.generateUrls(projectNumber, coordinates);

      await newPage.close();
      await browserService.resetMainPage();

      console.log(`Conversion completed in ${Date.now() - startTime} ms.`);
      return urls;
    } catch (error) {
      if (newPage) await newPage.close();
      await browserService.resetMainPage();
      throw error;
    }
  }
}

module.exports = new ConversionService();
