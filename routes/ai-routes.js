/**
 * @fileoverview Express router for handling AI-related API requests.
 * Routes client requests to the AIService for processing and returns structured JSON responses.
 * Now includes a Reverse Geocoding step using OpenStreetMap before querying the AI.
 */

const express = require("express");
const router = express.Router();
const aiService = require("../services/ai-service");

/**
 * Fetches the official address/display name from OpenStreetMap based on coordinates.
 * This prevents the AI from "hallucinating" or guessing the location incorrectly.
 * @param {number|string} lat - The latitude of the location.
 * @param {number|string} lng - The longitude of the location.
 * @returns {Promise<string|null>} The official display name of the location, or null if the request fails.
 */
async function getOsmDisplayName(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "User-Agent": "DiraApp/1.0 (contact@your-domain.com)",
        },
      },
    );
    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error("OSM Fetch Error:", error);
    return null;
  }
}

/**
 * @route POST /api/ai/neighborhood
 * @description Fetches an AI-generated neighborhood summary based on coordinates.
 * Supports automatic translation to English via sequential AI processing.
 * @access Public
 * @param {Object} req - Express request object.
 * @param {Object} req.body - The payload of the request.
 * @param {number|string} req.body.lat - The latitude of the project.
 * @param {number|string} req.body.lng - The longitude of the project.
 * @param {string} [req.body.language='he'] - The requested language for the AI output ('he' or 'en').
 * @param {Object} res - Express response object.
 * @returns {Object} 200 - A JSON object containing the structured neighborhood summary.
 * @returns {Object} 400 - A JSON object containing an "invalidInput" error message.
 * @returns {Object} 500 - A JSON object containing a processing error message.
 */
router.post("/neighborhood", async (req, res) => {
  try {
    const { lat, lng, language = "he" } = req.body;

    // Validate the incoming payload
    if (!lat || !lng) {
      return res.status(400).json({ error: "invalidInput" });
    }

    // Step 1: Extract the exact official address using OSM (Reverse Geocoding)
    const displayName = await getOsmDisplayName(lat, lng);

    if (!displayName) {
      return res.status(500).json({ error: "geoServiceError" });
    }

    console.log(`[Geo] OSM Identified Location: ${displayName}`);

    // Step 2: Fetch the detailed neighborhood data (ALWAYS IN HEBREW INITIALLY)
    let neighborhoodInfo = await aiService.getNeighborhoodInfo(displayName);

    // Step 3: If the client requested English, translate the JSON data
    if (language === "en") {
      console.log(`[AI] Translating results to English...`);
      neighborhoodInfo =
        await aiService.translateNeighborhoodData(neighborhoodInfo);
    }

    // Return the successful structured response (in requested language)
    return res.status(200).json(neighborhoodInfo);
  } catch (error) {
    console.error("AI Route Processing Error:", error);
    return res.status(500).json({ error: "aiProcessingError" });
  }
});

module.exports = router;
