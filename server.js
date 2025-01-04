const express = require("express");
const puppeteer = require("puppeteer");
const proj4 = require("proj4");
const path = require("path");

require("dotenv").config();

const app = express();

// קבלת ערך ממשתני הסביבה או ברירת מחדל
const PORT = process.env.PORT || 3000;
const CHROME_EXECUTABLE_PATH = process.env.CHROME_EXECUTABLE_PATH;
const BROWSER_POOL_SIZE = parseInt(process.env.BROWSER_POOL_SIZE) || 5; // לוודא שהערך הוא מספר

// הגדרות מערכת ITM ו-WGS84
const ITM =
  "+proj=tmerc +lat_0=31.73439361111111 +lon_0=35.20451694444444 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +towgs84=0,0,-48,0,0,0,0 +units=m +no_defs";
const WGS84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

// הורדת Chrome מותאם אישית (Render)
const puppeteerConfig = {
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  headless: true,
  executablePath: CHROME_EXECUTABLE_PATH || null,
};

// מאגר Puppeteer
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

// הגדרות Express
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/convert", async (req, res) => {
  try {
    const { projectInput } = req.body;

    // אם לא קיבלנו קלט, מחזירים שגיאה
    if (!projectInput) {
      return res.status(400).json({ error: "Invalid input. Project input is required." });
    }

    let projectNumber;

    // בדיקת הקלט: האם זה מספר פרויקט או URL
    if (/^\d+$/.test(projectInput)) {
      projectNumber = projectInput;
    } else if (/https?:\/\//.test(projectInput)) {
      try {
        const url = new URL(projectInput);
        const params = url.searchParams;

        // חיפוש המספר מתוך ה-URL
        const projectNumberFromParams = Array.from(params.values()).find((value) => /^\d+$/.test(value));
        if (projectNumberFromParams) {
          projectNumber = projectNumberFromParams;
        } else {
          return res.status(400).json({ error: "No project number found in URL parameters." });
        }
      } catch (error) {
        return res.status(400).json({ error: "Invalid URL format." });
      }
    } else {
      return res.status(400).json({ error: "Invalid input format. Expected project number or URL." });
    }

    const baseUrl =
      "https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~";
    const updatedUrl = baseUrl + projectNumber;

    const browser =
      browserPool.pop() ||
      (await puppeteer.launch(puppeteerConfig));
    const page = await browser.newPage();
    await page.goto(updatedUrl, { waitUntil: "networkidle2" });

    const govMapUrl = page.url();

    if (govMapUrl.includes("C")) {
      const [itmX, itmY] = govMapUrl.split("C")[1].split(",");
      const [longitude, latitude] = proj4(ITM, WGS84, [
        parseFloat(itmX),
        parseFloat(itmY),
      ]);

      const googleMapsUrl = `https://www.google.com/maps/place/${latitude},${longitude}`;
      await page.close();
      browserPool.push(browser);
      return res.json({ googleMapsUrl, updatedUrl });
    } else {
      await page.close();
      browserPool.push(browser);
      return res.status(500).json({ error: "No coordinates found. Unable to retrieve project coordinates." });
    }
  } catch (error) {
    console.error("Error during conversion:", error);
    return res.status(500).json({ error: "An unexpected error occurred during processing. Please try again later." });
  }
});

// סגירה של הדפדפנים בברירת מחדל
process.on("SIGINT", async () => {
  console.log("Closing browser pool...");
  for (const browser of browserPool) {
    await browser.close();
  }
  process.exit();
});

// הרצת השרת
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
