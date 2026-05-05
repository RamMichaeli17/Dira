// services/project-details-service.js
const browserService = require("./browser-service");

/**
 * Service for extracting project numbers and lottery numbers from user input.
 * Handles scraping the Ministry of Construction and Housing (MOCH) website if needed.
 */
class ProjectDetailsService {
  /**
   * Main entry point. Determines the type of input and routes to the correct extractor.
   * @param {string} projectInput - Raw input from the user (URL, 3-4 digit lottery, or 5 digit project).
   * @returns {Promise<{projectNumber: string, lotteryNumber: string|null}>}
   */
  async extractProjectDetails(projectInput) {
    // Validate input format
    if (
      !/^\d{3,5}$/.test(projectInput) &&
      !/^https?:\/\/www\.dira\.moch\.gov\.il/.test(projectInput)
    ) {
      throw new Error(
        "Invalid input. Please enter a 3-5 digit number or a valid dira.moch.gov.il URL.",
      );
    }

    // Handle 3 or 4 digit lottery numbers (Requires scraping)
    if (/^\d{3,4}$/.test(projectInput)) {
      return await this.findProjectByLottery(projectInput);
    }

    // Handle 5 digit project numbers (Direct match)
    if (/^\d{5}$/.test(projectInput)) {
      return { projectNumber: projectInput, lotteryNumber: null };
    }

    // Handle URLs
    if (/^https?:\/\/www\.dira\.moch\.gov\.il/.test(projectInput)) {
      return this.extractFromUrl(projectInput);
    }

    throw new Error("Invalid input format.");
  }

  /**
   * Scrapes the MOCH website to find the actual project number based on a lottery number.
   * @param {string} lotteryNumber - The 3 or 4 digit lottery number.
   * @returns {Promise<{projectNumber: string, lotteryNumber: string}>}
   */
  async findProjectByLottery(lotteryNumber) {
    let page = null;

    try {
      page = await browserService.createNewPage(false);
      await page.goto("https://www.dira.moch.gov.il/ProjectsList", {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      const inputSelector = "#lotteryNumber";
      await page.waitForSelector(inputSelector);
      await page.type(inputSelector, lotteryNumber);

      // Click search button
      const searchText = "חיפוש";
      await page.waitForFunction(
        (text) => {
          return Array.from(document.querySelectorAll("a")).some((a) =>
            a.textContent.trim().includes(text),
          );
        },
        {},
        searchText,
      );

      await page.evaluate((text) => {
        const button = Array.from(document.querySelectorAll("a")).find((a) =>
          a.textContent.trim().includes(text),
        );
        if (button) {
          button.click();
        }
      }, searchText);

      // Brief pause to allow DOM to update before searching for the next button
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Click details button
      const detailsText = "פרטים";
      try {
        await page.waitForFunction(
          (text) => {
            return Array.from(document.querySelectorAll("button")).some(
              (button) => button.textContent.trim().includes(text),
            );
          },
          { timeout: 2000 },
          detailsText,
        );

        await page.evaluate((text) => {
          const button = Array.from(document.querySelectorAll("button")).find(
            (btn) => btn.textContent.trim().includes(text),
          );
          if (button) {
            button.click();
          }
        }, detailsText);
      } catch (error) {
        throw new Error("projectNotFound");
      }

      const currentURL = page.url();
      const matches = currentURL.match(/\/(\d{2,5})\/(\d{3,4})\/ProjectInfo/);

      if (!matches) {
        throw new Error("Failed to extract project number from URL");
      }

      return {
        projectNumber: matches[1],
        lotteryNumber: matches[2],
      };
    } finally {
      // Ensure the tab is ALWAYS closed, regardless of success or failure.
      // Notice we do NOT close the main browser instance here anymore.
      if (page && !page.isClosed()) {
        await page.close();
      }
    }
  }

  /**
   * Extracts project and lottery numbers from a given MOCH URL.
   * @param {string} url - The MOCH project URL.
   * @returns {{projectNumber: string, lotteryNumber: string}}
   */
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
