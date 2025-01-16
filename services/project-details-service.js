const browserService = require("./browser-service");
// services/project-details-service.js
class ProjectDetailsService {
  async extractProjectDetails(projectInput) {
    // Validate input format
    if (
      !/^\d{3,5}$/.test(projectInput) &&
      !/^https?:\/\/www\.dira\.moch\.gov\.il/.test(projectInput)
    ) {
      throw new Error(
        "Invalid input. Please enter a 3-5 digit number or a valid dira.moch.gov.il URL."
      );
    }

    // Handle 3 or 4 digit lottery numbers
    if (/^\d{3,4}$/.test(projectInput)) {
      return this.findProjectByLottery(projectInput);
    }

    // Handle 5 digit project numbers
    if (/^\d{5}$/.test(projectInput)) {
      return { projectNumber: projectInput, lotteryNumber: null };
    }

    // Handle URLs
    if (/^https?:\/\/www\.dira\.moch\.gov\.il/.test(projectInput)) {
      return this.extractFromUrl(projectInput);
    }

    throw new Error("Invalid input format.");
  }

  async findProjectByLottery(lotteryNumber, signal) {
    const page = browserService.mainPage;

    try {
      if (signal?.aborted) {
        console.log("Request was canceled before processing lottery number");
        throw new Error("Request was canceled");
      }

      // Setup abort handler for navigation
      const abortHandler = () => {
        console.log("Aborting lottery number processing");
        page.evaluate(() => window.stop());
      };
      signal?.addEventListener("abort", abortHandler);

      // Reset page state
      await page.evaluate(() => {
        const input = document.querySelector("#lotteryNumber");
        if (input) input.value = "";
      });

      // Input lottery number
      const inputSelector = "#lotteryNumber";
      await page.waitForSelector(inputSelector, { timeout: 5000 });
      await page.type(inputSelector, lotteryNumber);

      if (signal?.aborted) {
        throw new Error("Request was canceled");
      }

      // Click search button
      const searchButton = await page.evaluateHandle((searchText) => {
        return Array.from(document.querySelectorAll("a")).find((a) =>
          a.textContent.trim().includes(searchText)
        );
      }, "חיפוש");

      if (!searchButton) {
        throw new Error("Search button not found");
      }

      await Promise.race([
        searchButton.click(),
        new Promise((_, reject) => {
          signal?.addEventListener("abort", () =>
            reject(new Error("Request was canceled"))
          );
        }),
      ]);

      if (signal?.aborted) {
        throw new Error("Request was canceled");
      }

      // Wait for details button with timeout
      const detailsButtonPromise = page.waitForFunction(
        (text) => {
          return Array.from(document.querySelectorAll("button")).some(
            (button) => button.textContent.trim().includes(text)
          );
        },
        { timeout: 5000 },
        "פרטים"
      );

      await Promise.race([
        detailsButtonPromise,
        new Promise((_, reject) => {
          signal?.addEventListener("abort", () =>
            reject(new Error("Request was canceled"))
          );
        }),
      ]);

      if (signal?.aborted) {
        throw new Error("Request was canceled");
      }

      // Click details button
      await page.evaluate((text) => {
        const button = Array.from(document.querySelectorAll("button")).find(
          (btn) => btn.textContent.trim().includes(text)
        );
        if (button) button.click();
      }, "פרטים");

      // Get URL and extract numbers
      const currentURL = page.url();
      const matches = currentURL.match(/\/(\d{2,5})\/(\d{3,4})\/ProjectInfo/);

      if (!matches) {
        throw new Error("Failed to extract project number from URL");
      }

      return {
        projectNumber: matches[1],
        lotteryNumber: matches[2],
      };
    } catch (error) {
      if (error.message.includes("Request was canceled") || signal?.aborted) {
        console.log("Lottery number processing was canceled");
        // Ensure page is in a clean state after cancellation
        try {
          await browserService.resetMainPage();
        } catch (resetError) {
          console.error("Error resetting page after cancellation:", resetError);
        }
      }
      throw error;
    }
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
