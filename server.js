const express = require("express");
const puppeteer = require("puppeteer");
const proj4 = require("proj4");
const path = require("path");

const app = express();
const PORT = 3000;

const ITM =
  "+proj=tmerc +lat_0=31.73439361111111 +lon_0=35.20451694444444 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +towgs84=0,0,-48,0,0,0,0 +units=m +no_defs";
const WGS84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

// הגדרות Express
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// נקודת קצה לקבלת קלט ולעיבודו
app.post("/convert", async (req, res) => {
  const { projectInput } = req.body;

  if (!projectInput) {
    return res.status(400).json({ error: "Invalid input." });
  }

  let projectNumber;

  // בדיקת הקלט: האם זה URL או מספר פרויקט
  if (/^\d+$/.test(projectInput)) {
    // זה מספר בלבד
    projectNumber = projectInput;
  } else if (/https?:\/\//.test(projectInput)) {
    // זה URL – חילוץ מספר הפרויקט
    const match = projectInput.match(/\d+/);
    if (match) {
      projectNumber = match[0];
    } else {
      return res.status(400).json({ error: "No project number found in URL." });
    }
  } else {
    return res.status(400).json({ error: "Invalid input format." });
  }

  try {
    const baseUrl =
      "https://www.govmap.gov.il/?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham%7CACTIVEPROJECTID~";
    const updatedUrl = baseUrl + projectNumber;

    // Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
    });
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
      await browser.close();
      return res.json({ googleMapsUrl, updatedUrl });
    } else {
      await browser.close();
      return res.status(500).json({ error: "No coordinates found." });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "An error occurred during processing." });
  }
});

// הרצת השרת
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
