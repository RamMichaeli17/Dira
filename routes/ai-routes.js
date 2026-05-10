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
 * * @param {number|string} lat - The latitude of the location.
 * @param {number|string} lng - The longitude of the location.
 * @returns {Promise<string|null>} The official display name of the location, or null if the request fails.
 */
async function getOsmDisplayName(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          // חובה להגדיר User-Agent מותאם אישית כדי שרתים בענן (כמו Render) לא ייחסמו
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
 * @description Fetches an AI-generated neighborhood summary from Madlan based on coordinates.
 * @access Public
 * @param {Object} req - Express request object.
 * @param {Object} req.body - The payload of the request.
 * @param {number|string} req.body.lat - The latitude of the project.
 * @param {number|string} req.body.lng - The longitude of the project.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 - A JSON object containing the structured neighborhood summary and Madlan URL.
 * @returns {Object} 400 - A JSON object containing an "invalidInput" error message.
 * @returns {Object} 500 - A JSON object containing a processing error message.
 */
router.post("/neighborhood", async (req, res) => {
  try {
    const { lat, lng } = req.body;

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

    // Step 2: Pass the exact display name to the AI service to search on Madlan
    const neighborhoodInfo = await aiService.getNeighborhoodInfo(displayName);

    // Return the successful structured response
    return res.status(200).json(neighborhoodInfo);
  } catch (error) {
    console.error("AI Route Processing Error:", error);
    return res.status(500).json({ error: "aiProcessingError" });
  }
});

module.exports = router;
