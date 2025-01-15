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
    const page = await browserService.mainPage;

    // Input lottery number
    const inputSelector = "#lotteryNumber";
    await page.waitForSelector(inputSelector);
    await page.type(inputSelector, lotteryNumber);

    // Click search button
    const searchText = "חיפוש";
    await page.waitForFunction(
      (text) => {
        return Array.from(document.querySelectorAll("a")).some((a) =>
          a.textContent.trim().includes(text)
        );
      },
      {},
      searchText
    );

    await page.evaluate((text) => {
      const button = Array.from(document.querySelectorAll("a")).find((a) =>
        a.textContent.trim().includes(text)
      );
      if (button) {
        button.click();
      }
    }, searchText);

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Click details button
    const detailsText = "פרטים";
    try {
      await page.waitForFunction(
        (text) => {
          return Array.from(document.querySelectorAll("button")).some(
            (button) => button.textContent.trim().includes(text)
          );
        },
        { timeout: 2000 },
        detailsText
      );

      await page.evaluate((text) => {
        const button = Array.from(document.querySelectorAll("button")).find(
          (btn) => btn.textContent.trim().includes(text)
        );
        if (button) {
          button.click();
        }
      }, detailsText);
    } catch (error) {
      throw new Error(`No project found for lottery number: ${lotteryNumber}`);
    }

    // Get the URL after clicking details
    const currentURL = page.url();
    const matches = currentURL.match(/\/(\d{5})\/(\d{4})\/ProjectInfo/);

    if (!matches) {
      throw new Error("Failed to extract project number from URL");
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
