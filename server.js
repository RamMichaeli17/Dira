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
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-gpu",
    "--start-maximized",
  ],
  headless: process.env.HEADLESS_ON === "true",
  executablePath:
    process.env.NODE_ENV === "production"
      ? process.env.PUPPETEER_EXECUTABLE_PATH
      : puppeteer.executablePath(),
};

// יצירת מופע אחד של Puppeteer ודף פתוח
let browser;
let mainPage;

(async () => {
  try {
    browser = await puppeteer.launch(puppeteerConfig);
    mainPage = await browser.newPage();
    await mainPage.setViewport({ width: 1920, height: 1080 });
    console.log("Puppeteer browser and main page instance launched.");
    await mainPage.goto("https://better-dira.netlify.app/", {
      waitUntil: "networkidle2",
    });
    // ביצוע זום אאוט
    await mainPage.evaluate(() => {
      document.body.style.zoom = "80%";
    });
  } catch (error) {
    console.error(
      "Error launching Puppeteer browser and main page instance:",
      error
    );
  }
})();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// מערך תור
let queue = [];

app.post("/convert", async (req, res) => {
  const startTime = Date.now(); // התחלת מדידה
  const { projectInput } = req.body;
  console.log("Received project input:", projectInput);

  if (!projectInput) {
    console.error("No input provided.");
    return res
      .status(400)
      .json({ error: "Invalid input. Project input is required." });
  }

  // הוספת הבקשה לתור
  queue.push({ req, res });

  // אם אין בקשות בתהליך, התחיל את התהליך
  if (queue.length === 1) {
    processQueue();
  }

  async function processQueue() {
    // נבדוק אם יש בקשה בתור
    if (queue.length > 0) {
      const { req, res } = queue[0];
      try {
        await handleRequest(req, res);
        queue.shift(); // הסר את הבקשה מהתור לאחר סיום הטיפול בה
        processQueue(); // המשך לטפל בבקשות הבאות בתור
      } catch (error) {
        console.error("Error during conversion:", error);
        queue.shift(); // הסר את הבקשה מהתור גם במקרה של שגיאה
        res
          .status(500)
          .json({
            error:
              "An unexpected error occurred during processing. Please try again later.",
          });
        processQueue();
      }
    }
  }

  async function handleRequest(req, res) {
    let newPage;
    try {
      const { projectInput } = req.body;
      let projectNumber;
      let lotteryNumber;

      if (/^\d{4}$/.test(projectInput)) {
        // המקרה שבו הוזן מספר בן 4 ספרות
        const links = await mainPage.evaluate((projectInput) => {
          const anchors = Array.from(
            document.querySelectorAll("a.details-button")
          );
          return anchors
            .map((anchor) => anchor.href)
            .filter((href) => {
              const regex = new RegExp(
                `https://www\\.dira\\.moch\\.gov\\.il/\\d{5}/\\d{4}/ProjectInfo`
              );
              return regex.test(href);
            });
        }, projectInput);

        if (links.length > 0) {
          const fullLink = links[0];
          const matches = fullLink.match(/\/(\d{5})\/(\d{4})\/ProjectInfo/);
          if (matches && matches.length > 2) {
            projectNumber = matches[1]; // קח את המספר בן 5 הספרות
            lotteryNumber = matches[2]; // קח את המספר בן 4 הספרות
            console.log("Found link:", fullLink);
            newPage = await browser.newPage(); // פתח כרטיסיה חדשה
          } else {
            console.error("No project number found in the link.");
            return res
              .status(400)
              .json({ error: "No project number found in the link." });
          }
        } else {
          console.error("No link found for the given number.");
          return res
            .status(400)
            .json({ error: "No link found for the given number." });
        }
      } else if (/^\d{5}$/.test(projectInput)) {
        projectNumber = projectInput;
        lotteryNumber = null;
        newPage = await browser.newPage();
      } else if (/https?:\/\//.test(projectInput)) {
        try {
          const url = new URL(projectInput);
          console.log("Parsed URL:", url.href);
          const pathSegments = url.pathname
            .split("/")
            .filter((segment) => /^\d+$/.test(segment));

          if (pathSegments.length >= 2) {
            projectNumber = pathSegments[0];
            lotteryNumber = pathSegments[1];
            console.log(
              "Extracted project number from URL path:",
              projectNumber
            );
            newPage = await browser.newPage();
          } else {
            console.error("No project number found in URL path.");
            return res
              .status(400)
              .json({ error: "No project number found in URL path." });
          }
        } catch (error) {
          console.error("Invalid URL format:", error);
          return res.status(400).json({ error: "Invalid URL format." });
        }
      } else {
        console.error("Invalid input format:", projectInput);
        return res
          .status(400)
          .json({
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
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          await newPage.goto(updatedUrl, {
            waitUntil: "networkidle2",
            timeout: 60000,
          });
          govMapUrl = newPage.url();
          console.log("GovMap redirected URL:", govMapUrl);

          if (govMapUrl !== updatedUrl) {
            break;
          } else {
            console.log("URL is the same as updated URL. Retrying...");
            attempts++;
          }
        } catch (error) {
          console.error("Error during page.goto:", error);
          attempts++;
        }
      }

      if (attempts === maxAttempts) {
        console.error("Failed to get a redirected URL after several attempts.");
        await newPage.close(); // סגור את הכרטיסיה החדשה במקרה של שגיאה
        return res
          .status(500)
          .json({
            error: "Failed to get redirected URL after several attempts.",
          });
      }

      if (govMapUrl.includes("C")) {
        const coords = govMapUrl.split("C")[1]?.split(",");

        if (coords?.length === 2) {
          const itmX = parseFloat(coords[0]);
          const itmY = parseFloat(coords[1]);
          console.log("Extracted coordinates:", { itmX, itmY });

          if (isNaN(itmX) || isNaN(itmY)) {
            console.error("Invalid coordinates received:", { itmX, itmY });
            await newPage.close(); // סגור את הכרטיסיה החדשה במקרה של שגיאה
            return res
              .status(500)
              .json({ error: "Invalid coordinates received from GovMap URL." });
          }

          const [longitude, latitude] = proj4(ITM, WGS84, [itmX, itmY]);
          console.log("Converted coordinates:", { longitude, latitude });
          const googleMapsUrl = `https://www.google.com/maps/place/${latitude},${longitude}`;
          const iframeUrl = `https://www.govmap.gov.il/map.html?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham|ACTIVEPROJECTID~${projectNumber}`; // יעדכן את קישור ה-iFrame
          const endTime = Date.now();
          console.log(`Conversion completed in ${endTime - startTime} ms.`);
          await newPage.close(); // סגור את הכרטיסיה החדשה לאחר סיום בקשה
          await mainPage.goto("https://better-dira.netlify.app/", {
            waitUntil: "networkidle2",
          }); // חזרה לכתובת הבסיסית לאחר סיום בקשה
          return res.json({ googleMapsUrl, iframeUrl, updatedUrl });
        } else {
          console.error("Coordinates format is invalid:", coords);
          await newPage.close(); // סגור את הכרטיסיה החדשה במקרה של שגיאה
          await mainPage.goto("https://better-dira.netlify.app/", {
            waitUntil: "networkidle2",
          }); // חזרה לכתובת הבסיסית במקרה של שגיאה
          return res
            .status(500)
            .json({ error: "Coordinates format is invalid." });
        }
      } else {
        console.error("No coordinates found in URL.");
        await newPage.close(); // סגור את הכרטיסיה החדשה במקרה של שגיאה
        await mainPage.goto("https://better-dira.netlify.app/", {
          waitUntil: "networkidle2",
        }); // חזרה לכתובת הבסיסית במקרה של שגיאה
        return res.status(500).json({ error: "No coordinates found in URL." });
      }
    } catch (error) {
      console.error("Error during conversion:", error);
      if (newPage) {
        await newPage.close(); // סגור את הכרטיסיה החדשה במקרה של שגיאה
      }
      await mainPage.goto("https://better-dira.netlify.app/", {
        waitUntil: "networkidle2",
      }); // חזרה לכתובת הבסיסית במקרה של שגיאה
      return res
        .status(500)
        .json({
          error:
            "An unexpected error occurred during processing. Please try again later.",
        });
    }
  }
});

app.get("/queue-status", (req, res) => {
  res.json({ queueLength: queue.length });
});

process.on("SIGINT", async () => {
  console.log("Closing Puppeteer browser...");
  await browser.close();
  process.exit();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
