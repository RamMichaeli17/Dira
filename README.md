# 🏙️ Dira Converter & Spatial Mapper

A high-performance, Full-Stack web application designed to automate data extraction, perform spatial mapping, and generate real-time AI insights for Israeli "Price Reduced" (Dira BeHanha) housing projects.

## 🚀 Overview

The Israeli Ministry of Construction and Housing (MOCH) portals often provide unstructured data and local grid coordinates (ITM) that are difficult for end-users to navigate. **Dira Converter** solves this real-world problem by acting as an intelligent middleware: it scrapes the required data, converts local coordinates to global GPS standards, renders interactive maps, and provides an AI-generated summary of the project's neighborhood.

## ✨ Key Features

*   **Automated Data Extraction:** Engineered a robust scraping engine using **Puppeteer** to dynamically navigate government portals and extract project/lottery details.
*   **Asynchronous Task Management:** Implemented a reliable Request Queue system using **Redis** to handle concurrent users, preventing server CPU overload from heavy headless browser operations.
*   **Smart Caching Layer:** Utilized **Redis** for result caching, significantly reducing response times for frequently searched projects and minimizing redundant scraping.
*   **Geospatial Engineering:** Built custom logic to mathematically convert Israel Transverse Mercator (ITM) coordinates into WGS84 (GPS) for integration with Google Maps and GovMap APIs.
*   **Generative AI Insights:** Integrated the **Google Gemini 2.0 API** with real-time web search grounding to dynamically generate structured summaries regarding local education, transportation, and future development.
*   **Bilingual & Responsive UI:** Designed a seamless Hebrew/English frontend with real-time queue status updates, loading states, and `AbortController` integration for request cancellation.

## 🛠️ Technology Stack

**Backend:**
*   Node.js & Express.js
*   Puppeteer (Headless Browser Automation)
*   Redis (Message Broker & Cache)
*   Google Generative AI SDK (Gemini 2.0 Flash)
*   Proj4js (Coordinate System Transformations)

**Frontend:**
*   Vanilla JavaScript (ES6+ Modules)
*   HTML5 & CSS3 (Fully Responsive, LTR/RTL Support)

## 🧠 Architectural Challenges & Solutions

1.  **Resource Bottlenecks:** Running multiple headless browser instances simultaneously crashes standard servers.
    *   *Solution:* Implemented a FIFO queue using Redis and an internal state manager. The server processes one Puppeteer task at a time while providing clients with real-time queue position updates.
2.  **Rate Limiting & Speed:** Government websites can be slow or block repeated requests.
    *   *Solution:* Added a persistent Redis caching layer. If a project was already converted by any user, the app serves the maps instantly from the cache, bypassing the scraper entirely.

## 💻 Local Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/RamMichaeli17/Dira.git](https://github.com/RamMichaeli17/Dira.git)
   cd Dira
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and add the following:
   ```env
   PORT=3000
   REDIS_URL=your_redis_connection_string
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. **Run the application:**
   ```bash
   npm start
   # Or for development with nodemon:
   npm run dev
   ```

## 👨‍💻 Author
**Ram Michaeli** - Software Developer 
