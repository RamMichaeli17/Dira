const browserService = require("./browser-service");
// services/project-details-service.js
class ProjectDetailsService {
  async extractProjectDetails(projectInput) {
    if (/^\d{4}$/.test(projectInput)) {
      return this.findProjectByLottery(projectInput);
    }

    if (/^\d{5}$/.test(projectInput)) {
      return { projectNumber: projectInput, lotteryNumber: null };
    }

    if (/https?:\/\//.test(projectInput)) {
      return this.extractFromUrl(projectInput);
    }

    throw new Error(
      "Invalid input format. Expected project number, lottery number, or URL."
    );
  }

  async findProjectByLottery(lotteryNumber) {
    const links = await browserService.mainPage.evaluate((lottery) => {
      const anchors = Array.from(document.querySelectorAll("a.details-button"));
      return anchors
        .map((anchor) => anchor.href)
        .filter((href) => {
          const regex = new RegExp(
            `https://www\\.dira\\.moch\\.gov\\.il/\\d{5}/${lottery}/ProjectInfo`
          );
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
      lotteryNumber: matches[2],
    };
  }

  extractFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname
        .split("/")
        .filter((segment) => /^\d+$/.test(segment));

      if (pathSegments.length < 2) {
        throw new Error("Invalid URL format");
      }

      return {
        projectNumber: pathSegments[0],
        lotteryNumber: pathSegments[1],
      };
    } catch (error) {
      throw new Error(`Invalid URL format: ${error.message}`);
    }
  }
}

module.exports = new ProjectDetailsService();
