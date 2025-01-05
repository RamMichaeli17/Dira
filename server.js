const express = require("express");
const puppeteer = require("puppeteer");
const proj4 = require("proj4");
const path = require("path");

require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

const ITM =
  "+proj=tmerc +lat_0=31.73439361111111 +lon_0=35.20451694444444 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +towgs84=0,0,-48,0,0,0,0 +units=m +no_defs";
const WGS84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

const puppeteerConfig = {
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--single-process"],
  headless: process.env.HEADLESS_ON === "true",
  executablePath:
    process.env.NODE_ENV === "production"
      ? process.env.PUPPETEER_EXECUTABLE_PATH
      : puppeteer.executablePath(),
};

// יצירת מופע אחד של Puppeteer ודף פתוח
let browser;
let page;

(async () => {
  try {
    browser = await puppeteer.launch(puppeteerConfig);
    page = await browser.newPage();
    console.log("Puppeteer browser and page instance launched.");
  } catch (error) {
    console.error("Error launching Puppeteer browser and page instance:", error);
  }
})();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/convert", async (req, res) => {
  try {
    const startTime = Date.now(); // התחלת מדידה
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

    console.log("Navigating to GovMap URL...");
    let govMapUrl = updatedUrl;
    let attempts = 0;
    const maxAttempts = 3; // מספר ניסיונות

    while (attempts < maxAttempts) {
      try {
        await page.goto(updatedUrl, { waitUntil: "networkidle2" });

        govMapUrl = page.url();
        console.log("GovMap redirected URL:", govMapUrl);

        if (govMapUrl !== updatedUrl) {
          // אם ה-URL השתנה, סיימנו
          break;
        } else {
          console.log("URL is the same as updated URL. Retrying...");
          attempts++; // המתן 2 שניות לפני שננסה שוב
        }
      } catch (error) {
        console.error("Error during page.goto:", error);
        attempts++; // המתן 2 שניות לפני שננסה שוב
      }
    }

    if (attempts === maxAttempts) {
      console.error("Failed to get a redirected URL after several attempts.");
      return res.status(500).json({
        error: "Failed to get redirected URL after several attempts.",
      });
    }

    // קוד להמשך הפעולה אחרי שה-URL השתנה
    if (govMapUrl.includes("C")) {
      const coords = govMapUrl.split("C")[1]?.split(",");
      if (coords?.length === 2) {
        const itmX = parseFloat(coords[0]);
        const itmY = parseFloat(coords[1]);

        console.log("Extracted coordinates:", { itmX, itmY });

        if (isNaN(itmX) || isNaN(itmY)) {
          console.error("Invalid coordinates received:", { itmX, itmY });
          return res.status(500).json({
            error: "Invalid coordinates received from GovMap URL.",
          });
        }

        const [longitude, latitude] = proj4(ITM, WGS84, [itmX, itmY]);
        console.log("Converted coordinates:", { longitude, latitude });

        const googleMapsUrl = `https://www.google.com/maps/place/${latitude},${longitude}`;

        const endTime = Date.now(); // סיום מדידה
        console.log(`Conversion completed in ${endTime - startTime} ms.`); // זמן סיום

        return res.json({ googleMapsUrl, updatedUrl });
      } else {
        console.error("Coordinates format is invalid:", coords);
        return res.status(500).json({
          error: "Coordinates format is invalid.",
        });
      }
    } else {
      console.error("No coordinates found in URL.");
      return res.status(500).json({
        error: "No coordinates found in URL.",
      });
    }
  } catch (error) {
    console.error("Error during conversion:", error);
    return res.status(500).json({
      error:
        "An unexpected error occurred during processing. Please try again later.",
    });
  }
});

process.on("SIGINT", async () => {
  console.log("Closing Puppeteer browser...");
  await browser.close();
  process.exit();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
