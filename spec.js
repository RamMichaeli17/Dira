const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const proj4 = require("proj4");

const ITM =
  "+proj=tmerc +lat_0=31.73439361111111 +lon_0=35.20451694444444 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +towgs84=0,0,-48,0,0,0,0 +units=m +no_defs";
const WGS84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

const projectLink = "https://www.dira.moch.gov.il/74532/2521/ProjectInfo";

const projectNumber = projectLink.match(/\d+/)[0];

console.log(projectNumber);

// Construct the updated URL by appending the project number
const baseUrl =
  "https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~";
let updatedUrl = baseUrl + projectNumber;

(async () => {
  // Launch Puppeteer and open a new page
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: false,
  });
  // Open the new URL in a new page
  const govMapPage = await browser.newPage();
  await govMapPage.goto(updatedUrl, {
    waitUntil: "networkidle2",
  });
  // Get the current URL
  const govMapUrl = govMapPage.url();
  console.log("govMapUrl: ", govMapUrl);

  // Extract the ITM coordinates from the URL
  if (govMapUrl.includes("C")) {
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
  } else {
    console.log("No coordinates found");
  }
  await browser.close();
})();
