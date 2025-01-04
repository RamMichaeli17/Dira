const express = require("express");
const puppeteer = require("puppeteer");
const proj4 = require("proj4");
const path = require("path");

require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const BROWSER_POOL_SIZE = parseInt(process.env.BROWSER_POOL_SIZE) || 5;

const ITM =
  "+proj=tmerc +lat_0=31.73439361111111 +lon_0=35.20451694444444 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +towgs84=0,0,-48,0,0,0,0 +units=m +no_defs";
const WGS84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

const puppeteerConfig = {
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  headless: true,
  executablePath:
    process.env.NODE_ENV === "production"
      ? process.env.PUPPETEER_EXECUTABLE_PATH
      : puppeteer.executablePath(),
};

let browserPool = [];

(async () => {
  try {
    for (let i = 0; i < BROWSER_POOL_SIZE; i++) {
      const browser = await puppeteer.launch(puppeteerConfig);
      browserPool.push(browser);
    }
    console.log("Browser pool initialized successfully.");
  } catch (error) {
    console.error("Error initializing browser pool:", error);
  }
})();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/convert", async (req, res) => {
  try {
    const { projectInput } = req.body;
    console.log("Received project input:", projectInput);

    if (!projectInput) {
      console.error("No input provided.");
      return res.status(400).json({
        error: "Invalid input. Project input is required.",
      });
    }

    let projectNumber;

    if (/^\d+$/.test(projectInput)) {
      projectNumber = projectInput;
    } else if (/https?:\/\//.test(projectInput)) {
      try {
        const url = new URL(projectInput);
        console.log("Parsed URL:", url.href);

        const params = url.searchParams;
        const projectNumberFromParams = Array.from(params.values()).find(
          (value) => /^\d+$/.test(value)
        );

        if (projectNumberFromParams) {
          projectNumber = projectNumberFromParams;
          console.log("Extracted project number from URL:", projectNumber);
        } else {
          console.error("No project number found in URL parameters.");
          return res.status(400).json({
            error: "No project number found in URL parameters.",
          });
        }
      } catch (error) {
        console.error("Invalid URL format:", error);
        return res.status(400).json({ error: "Invalid URL format." });
      }
    } else {
      console.error("Invalid input format:", projectInput);
      return res.status(400).json({
        error: "Invalid input format. Expected project number or URL.",
      });
    }

    const baseUrl =
      "https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~";
    const updatedUrl = baseUrl + projectNumber;

    console.log("Generated GovMap URL:", updatedUrl);

    const browser =
      browserPool.pop() || (await puppeteer.launch(puppeteerConfig));
    const page = await browser.newPage();

    console.log("Navigating to GovMap URL...");
    await page.goto(updatedUrl, { waitUntil: "networkidle2" });

    const govMapUrl = page.url();
    console.log("GovMap redirected URL:", govMapUrl);

    if (govMapUrl.includes("C")) {
      const coords = govMapUrl.split("C")[1]?.split(",");
      if (coords?.length === 2) {
        const itmX = parseFloat(coords[0]);
        const itmY = parseFloat(coords[1]);

        console.log("Extracted coordinates:", { itmX, itmY });

        if (isNaN(itmX) || isNaN(itmY)) {
          console.error("Invalid coordinates received:", { itmX, itmY });
          await page.close();
          browserPool.push(browser);
          return res.status(500).json({
            error: "Invalid coordinates received from GovMap URL.",
          });
        }

        const [longitude, latitude] = proj4(ITM, WGS84, [itmX, itmY]);
        console.log("Converted coordinates:", { longitude, latitude });

        const googleMapsUrl = `https://www.google.com/maps/place/${latitude},${longitude}`;
        await page.close();
        browserPool.push(browser);

        return res.json({ googleMapsUrl, updatedUrl });
      } else {
        console.error("Coordinates format is invalid:", coords);
        await page.close();
        browserPool.push(browser);
        return res.status(500).json({
          error: "Coordinates format is invalid.",
        });
      }
    } else {
      console.error("No coordinates found in URL.");
      await page.close();
      browserPool.push(browser);
      return res.status(500).json({
        error: "No coordinates found in URL.",
      });
    }
  } catch (error) {
    console.error("Error during conversion:", error);
    return res.status(500).json({
      error: "An unexpected error occurred during processing. Please try again later.",
    });
  }
});

process.on("SIGINT", async () => {
  console.log("Closing browser pool...");
  for (const browser of browserPool) {
    await browser.close();
  }
  process.exit();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
