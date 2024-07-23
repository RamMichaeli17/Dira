const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const proj4 = require("proj4");

const ITM =
  "+proj=tmerc +lat_0=31.73439361111111 +lon_0=35.20451694444444 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +towgs84=0,0,-48,0,0,0,0 +units=m +no_defs";
const WGS84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

const projectsListLink = "https://www.dira.moch.gov.il/ProjectsList";

// let itmX;
// let itmY;

(async () => {
  // Launch Puppeteer and open a new page
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
  });
  const page = await browser.newPage();

  // Navigate to the page and wait for network to be idle
  await page.goto(projectsListLink, {
    waitUntil: "networkidle2",
  });

  // Get all rows and click the "פרטים" button in each row
  const rows = await page.$$("tbody tr");

  // Iterate through each row and print its text content
  for (const [index, row] of rows.entries()) {
    const rowText = await page.evaluate((el) => el.innerText, row);

    // Click on the "Details" button
    const detailsButton = await row.$(
      'button[ng-click="showProjectInfo(project)"]'
    );
    if (detailsButton) {
      await detailsButton.click();
      // Wait for the resulting content to load
      await page.waitForNetworkIdle();

      const projectNumber = await page.$eval('span[id="ProjectNumber"]', (el) =>
        el.innerText.trim()
      );

      console.log("Project Number: ", projectNumber);

      // Construct the updated URL by appending the project number
      const baseUrl =
        "https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~";
      const updatedUrl = baseUrl + projectNumber;

      const govMapPage = await browser.newPage();


      await govMapPage.goto(updatedUrl, {
        waitUntil: "networkidle2",
      });

      govMapUrl = govMapPage.url();
      console.log("govMapUrl: ", govMapUrl);

      const [itmX, itmY] = govMapUrl.split("C")[1].split(",");

      console.log(`itmX : ${itmX}`);
      console.log(`itmY : ${itmY}`);

      // Convert ITM to WGS84
      const [longitude, latitude] = proj4(ITM, WGS84, [
        parseFloat(itmX),
        parseFloat(itmY),
      ]);

      console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

      const googleMapsUrl = `https://www.google.com/maps/place/${latitude},${longitude}`;

      console.log("googleMapsUrl: ", googleMapsUrl);

      const googleMapPage = await browser.newPage();

      await googleMapPage.goto(googleMapsUrl, {
        waitUntil: "networkidle2",
      });
      
      await googleMapPage.close();
      await govMapPage.close();

      await page.goBack();

    }
  }
})();
