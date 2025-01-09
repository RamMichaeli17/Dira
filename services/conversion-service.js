// services/conversion.service.js

const proj4 = require("proj4");
const { ITM, WGS84 } = require("../config/coordinates-config");
const browserService = require("./browser-service");

/**
 * שירות המרת נתונים
 * אחראי על כל תהליך ההמרה והחילוץ של נתוני הפרויקט
 */
class ConversionService {
  /**
   * מחלץ את פרטי הפרויקט מהקלט שהתקבל
   */
  async extractProjectDetails(projectInput) {
    let projectNumber;
    let lotteryNumber;

    if (/^\d{4}$/.test(projectInput)) {
      // מקרה של מספר הגרלה בן 4 ספרות
      const links = await browserService.mainPage.evaluate((projectInput) => {
        const anchors = Array.from(document.querySelectorAll("a.details-button"));
        return anchors
          .map((anchor) => anchor.href)
          .filter((href) => {
            const regex = new RegExp("https://www\\.dira\\.moch\\.gov\\.il/\\d{5}/\\d{4}/ProjectInfo");
            return regex.test(href);
          });
      }, projectInput);

      if (links.length > 0) {
        const matches = links[0].match(/\/(\d{5})\/(\d{4})\/ProjectInfo/);
        if (matches && matches.length > 2) {
          projectNumber = matches[1];
          lotteryNumber = matches[2];
        } else {
          throw new Error("No project number found in the link.");
        }
      } else {
        throw new Error("No link found for the given number.");
      }
    } else if (/^\d{5}$/.test(projectInput)) {
      // מקרה של מספר פרויקט בן 5 ספרות
      projectNumber = projectInput;
      lotteryNumber = null;
    } else if (/https?:\/\//.test(projectInput)) {
      // מקרה של URL
      try {
        const url = new URL(projectInput);
        const pathSegments = url.pathname
          .split("/")
          .filter((segment) => /^\d+$/.test(segment));

        if (pathSegments.length >= 2) {
          projectNumber = pathSegments[0];
          lotteryNumber = pathSegments[1];
        } else {
          throw new Error("No project number found in URL path.");
        }
      } catch (error) {
        throw new Error("Invalid URL format.");
      }
    } else {
      throw new Error("Invalid input format. Expected project number or URL.");
    }

    return { projectNumber, lotteryNumber };
  }

  /**
   * משיג את הקואורדינטות מ-GovMap
   */
  async getCoordinates(projectNumber, page) {
    const baseUrl = "https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~";
    const updatedUrl = baseUrl + projectNumber;
    
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        await page.goto(updatedUrl, {
          waitUntil: "networkidle2",
          timeout: 60000,
        });
        
        const govMapUrl = page.url();
        if (govMapUrl.includes("C")) {
          const coords = govMapUrl.split("C")[1]?.split(",");
          if (coords?.length === 2) {
            const x = parseFloat(coords[0]);
            const y = parseFloat(coords[1]);
            
            if (isNaN(x) || isNaN(y)) {
              throw new Error("Invalid coordinates received from GovMap URL.");
            }
            
            return { x, y };
          }
        }
        attempts++;
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) {
          throw error;
        }
      }
    }

    throw new Error("Failed to get coordinates after several attempts.");
  }

  /**
   * יוצר את כל ה-URLs הנדרשים
   */
  generateUrls(projectNumber, coordinates) {
    const [longitude, latitude] = proj4(ITM, WGS84, [coordinates.x, coordinates.y]);
    
    return {
      googleMapsUrl: `https://www.google.com/maps/place/${latitude},${longitude}`,
      iframeUrl: `https://www.govmap.gov.il/map.html?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham|ACTIVEPROJECTID~${projectNumber}`,
      updatedUrl: `https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~${projectNumber}`
    };
  }

  /**
   * מעבד את הקלט ומחזיר את כל המידע הנדרש
   */
  async processProjectInput(projectInput) {
    let newPage;
    
    try {
      const { projectNumber, lotteryNumber } = await this.extractProjectDetails(projectInput);
      newPage = await browserService.createNewPage();
      
      const coordinates = await this.getCoordinates(projectNumber, newPage);
      const urls = this.generateUrls(projectNumber, coordinates);
      
      await newPage.close();
      await browserService.resetMainPage();
      
      return urls;
    } catch (error) {
      if (newPage) {
        await newPage.close();
      }
      await browserService.resetMainPage();
      throw error;
    }
  }
}

module.exports = new ConversionService();