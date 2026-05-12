<div id="top"></div>

<!-- PROJECT SHIELDS -->

[![GitHub repo size][reposize-shield]](#)
[![GitHub language count][languagescount-shield]](#)
[![Contributors][contributors-shield]][contributors-url]
[![Stargazers][stars-shield]][stars-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]
[![Gmail][gmail-shield]][gmail-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/RamMichaeli17/Dira">
    <img src="https://github.com/user-attachments/assets/1684e6cb-ba0c-40fa-bdc5-fec34f2b9b0b" alt="Logo" width="240" height="240">
  </a>

<h3 align="center">Project Link Converter & AI Neighborhood Insights</h3>

  <p align="center">
    This project is a robust location intelligence tool built with <strong>Node.js</strong>, <strong>Express.js</strong>, <strong>Puppeteer</strong>, and <strong>Redis</strong>. Born from a real-world frustration with the Israeli "Mechir Lamishtaken" lotteries, it seamlessly converts legacy ITM government grid coordinates into universal WGS84 GPS formats. Furthermore, it leverages the <strong>Google Gemini API</strong> and <strong>OpenStreetMap</strong> to provide dynamic, AI-powered neighborhood insights.
    <br />
    <br />
    <strong>Visit the live project:</strong> <a href="https://dira.onrender.com/">Project Converter Deployment</a>
    <br /><br />
    <strong>Note:</strong> The live deployment operates under free-tier quotas, including a <strong>1k units/month</strong> limit on Browserless.io and standard <strong>Google AI Studio rate limits</strong>. If these quotas are exceeded, conversion or AI features may be temporarily unavailable.
    <br /><br />
    <strong>Pro Tip:</strong> For an unrestricted and high-performance experience, it is recommended to <strong>run the project locally</strong> using your own API keys as detailed in the <a href="#getting-started">Getting Started</a> section.
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#key-components-and-features">Key Components and Features</a></li>
    <li><a href="#additional-concepts-covered">Additional Concepts Covered</a></li>
    <li><a href="#learning-objectives">Learning Objectives</a></li>
    <li><a href="#build-requirements">Build Requirements</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#deployment">Deployment</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contributors">Contributors</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

![image](https://github.com/user-attachments/assets/a13414b9-282f-4b28-b30c-72716b5f6c81)

This project is a sophisticated full-stack web application designed to help users instantly locate "Mechir Lamishtaken" (Apartment at a Discount) real estate projects. Users typically discover these projects on the official **[Ministry of Construction and Housing (MOCH) Projects List](https://dira.moch.gov.il/ProjectsList)**, which serves as the primary government platform for subsidized housing lotteries in Israel.

Acting as an essential companion tool to the government portal, this application allows users to take any simple project number, lottery ID, or official MOCH URL and instantly translate it into an explorable environment. The system performs real-time web scraping, geospatial coordinate conversion, and AI-driven environmental analysis. It covers advanced backend and frontend engineering concepts, including:

- **Real-Time Web Scraping**: Dynamically navigates government maps (GovMap) using headless browsers to extract hidden ITM coordinates.
- **Geospatial Coordinate Conversion**: Mathematically translates local Israeli Grid (ITM) coordinates into global GPS standards (WGS84) for seamless Google Maps integration.
- **AI Neighborhood Insights**: Generates smart, on-demand summaries of the area's education, public transport, and future development using AI and reverse geocoding.
- **Asynchronous Task Queue**: Manages heavy scraping requests sequentially with real-time UI status updates, preventing server overload during traffic spikes.
- **Full-Stack Cancellation Mechanism**: Allows users to abort operations mid-flight via an `AbortController`, instantly killing background cloud browser processes to conserve resources.
- **Smart Caching & Security**: Uses persistent in-memory caching to serve repeated queries in milliseconds, combined with a custom "cache-aware" rate limiter to prevent bot abuse.
- **Internationalization (i18n)**: Features a dynamic, React-less vanilla JS frontend that seamlessly switches between Hebrew (RTL) and English (LTR) without page reloads.
- **Zero-Cost Engineering**: Creatively integrates multiple free-tier cloud services to run a heavy automation and AI backend with zero operational costs.

### Technologies Used

- **Node.js**: Core backend runtime for asynchronous task orchestration.
- **Express.js**: Framework for creating robust server routes, middleware, and API endpoints.
- **Puppeteer & Browserless.io**: Cloud-based headless browser automation with dynamic residential proxy toggling.
- **Redis (ioredis)**: In-memory database used for high-speed, permanent caching of project coordinates.
- **Proj4**: Mathematical library for highly accurate spatial coordinate transformations (ITM to WGS84).
- **Google Gemini API**: Dual-model AI integration (Flash 2.5 & Flash-Lite 3.1) for web research, data structuring, and automated translation.
- **OpenStreetMap (OSM)**: Reverse geocoding API to extract official physical addresses and prevent AI location hallucinations.
- **Vanilla JavaScript & CSS3**: High-performance, modular ES6 frontend architecture with custom CSS keyframe animations (No heavy frameworks used).
- **Express Rate Limit**: Security middleware specifically customized to bypass limits when serving cached data.
- **Render & Uptime Robot**: Deployment platform and monitoring tool combined to ensure 24/7 availability on a free-tier environment.

<p align="right">(<a href="#top">back to top</a>)</p>

## Key Components and Features

### Real-Time Web Scraping & Automation

- **Dynamic Extraction**: Navigates complex government maps (GovMap) using Puppeteer to locate and extract hidden ITM coordinates from dynamically injected URLs.
- **Cloud Browser Management**: Offloads heavy headless browser execution to Browserless.io via WebSockets, completely bypassing local server resource limits.

### Geospatial Processing

- **Mathematical Conversion**: Translates local Israeli Grid (ITM) coordinates into global GPS standards (WGS84) using the Proj4 library.
- **Interactive Maps**: Seamlessly generates and embeds precise Google Maps and updated GovMap iframes based on the calculated data.

### AI Neighborhood Insights

- **Reverse Geocoding**: Queries OpenStreetMap (OSM) to validate exact physical addresses before AI processing, ensuring zero "location hallucinations".
- **Smart Area Summaries**: Leverages Google Gemini API (Flash 2.5) to perform web research and return structured data about local education, public transport, and future urban development.
- **Multi-Model Translation**: Utilizes a secondary, lightweight model (Flash-Lite 3.1) to translate the Hebrew JSON data into English on the fly when required.

### Advanced Task Management

- **Asynchronous Queue Service**: Processes heavy scraping requests sequentially using a custom FIFO queue, preventing server crashes during traffic spikes while providing real-time position updates to the user.
- **Mid-Flight Cancellation**: Implements the `AbortController` API across the full stack. If a user cancels, the system instantly terminates the active cloud browser tab and removes the request from the queue to conserve API credits.

### Caching & Optimization

- **Persistent Redis Cache**: Stores successful coordinates in an in-memory database. Subsequent identical requests bypass the queue entirely and resolve in under 50 milliseconds.
- **Cache-Aware Rate Limiting**: Customized security middleware that prevents bot abuse (max 15 requests/15 mins) but intelligently _ignores_ requests that are served from the cache, protecting free-tier quotas.

### Additional Concepts Covered

- **Zero-Cost Architecture**: Creatively strings together Render's free tier, Browserless, and Uptime Robot to maintain a 24/7 heavy automation backend without incurring operational costs.
- **Internationalization (i18n)**: A robust, React-less Vanilla JS frontend that dynamically switches text and document direction (RTL/LTR) between Hebrew and English without page reloads.
- **Race Condition Prevention**: Sophisticated client-side polling logic that manages asynchronous UI updates, clears phantom timers, and accurately displays queue progression.
- **UI/UX Polish**: Features smooth CSS keyframe animations, dynamic loading overlays for map iframes, and FOUC (Flash of Unstyled Content) prevention techniques.

<p align="right">(<a href="#top">back to top</a>)</p>

## Learning Objectives

By exploring this project, you will learn how to:

- **Architect a Zero-Cost Cloud Infrastructure**: Creatively integrate free-tier services (Render, Browserless.io, Uptime Robot) to run heavy background workloads without incurring operational costs.
- **Orchestrate Cloud Automation**: Master headless browser manipulation (Puppeteer) over WebSockets to extract data from dynamically rendered and heavily obfuscated websites.
- **Manage Asynchronous Workloads**: Build and implement a custom FIFO task queue to protect server resources, prevent memory leaks, and manage concurrent traffic spikes.
- **Implement Full-Stack Cancellation**: Utilize the `AbortController` API to seamlessly terminate active cloud browser processes mid-flight when a user aborts a request.
- **Integrate AI Responsibly**: Combine Reverse Geocoding (OSM) with Large Language Models (Google Gemini) to anchor prompts in factual geographic data, effectively preventing AI hallucinations.
- **Execute Geospatial Mathematics**: Apply complex mathematical transformations using Proj4 to convert local grid coordinate systems (ITM) into global GPS standards (WGS84).
- **Optimize Performance & Security**: Leverage Redis for persistent caching and design custom, cache-aware rate limiters to protect API quotas and slash response times to under 50ms.
- **Build Reactive Vanilla JS**: Develop a high-performance, framework-less frontend featuring dynamic i18n (RTL/LTR switching) and advanced polling logic for state synchronization.

<p align="right">(<a href="#top">back to top</a>)</p>

## Build Requirements

- **Node.js** (v18.x or later): Required for native `AbortController` and modern ES modules support.
- **Redis**: A local server or cloud instance (e.g., Upstash, Redis Cloud) for the caching layer.
- **Browserless.io Account**: An API token is required for headless browser automation in the cloud.
- **Google AI Studio Account**: A Gemini API key is required to power the Neighborhood Insights feature.

<p align="right">(<a href="#top">back to top</a>)</p>

## Deployment

This project is deployed using **[Render](https://render.com/)**. To maintain a zero-cost architecture while delivering high performance, the following cloud strategies were implemented:

- **Bypassing Sleep Mode**: Render's free tier normally spins down instances after 15 minutes of inactivity (causing 50+ second delays on cold starts). To solve this, the application is monitored by **Uptime Robot**, which pings a dedicated `/keep-alive` endpoint every 15 minutes to ensure the server remains awake and instantly accessible.
- **Cloud Browser Execution**: Render's free tier lacks the CPU/RAM required to run headless Chrome locally. Therefore, the deployment is configured to route all Puppeteer traffic through **Browserless.io** via WebSockets, operating within their 1k units/month free tier quota.

Visit the live project: [Project Converter Deployment](https://dira.onrender.com/)

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

### Installation

1. Clone the repository

```sh
git clone [https://github.com/RamMichaeli17/Dira.git](https://github.com/RamMichaeli17/Dira.git)
```

2. Install NPM packages

```sh
npm install
```

3. Set up environment variables

- Create a `.env` file in the root directory and add your credentials/configurations:

```env
# Port the server will run on
PORT=3000

# Node environment (development/production)
NODE_ENV=development

# Number of concurrent browsers in the pool (optional)
BROWSER_POOL_SIZE=1

# Run browsers in headless mode: true or false
HEADLESS_ON=false

# Your Google API key for general services (if separate from Gemini)
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY

# Redis connection URL (Example: redis://default:password@host:port)
REDIS_URL=redis://localhost:6379

# Browserless.io token if using remote Puppeteer
BROWSERLESS_TOKEN=YOUR_BROWSERLESS_TOKEN

# Whether to use Browserless: true or false
USE_BROWSERLESS=false

# Your Google Generative AI (Gemini) API Key
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# The Gemini model to use for neighborhood search and grounding
GEMINI_SEARCH_MODEL=gemini-2.5-flash

# The Gemini model to use for translation tasks
GEMINI_TRANSLATION_MODEL=gemini-3.1-flash-lite
```

4. Start the server

```sh
npm start
```

## Usage

Using the Project Link Converter is highly intuitive. Here is the standard workflow:

- **Find a Project**: Locate an active lottery or project on the official [Ministry of Construction and Housing (MOCH) website](https://dira.moch.gov.il/ProjectsList).
- **Convert Location**: Copy the project's official URL or its 3-5 digit ID number, paste it into the application's search bar, and click "Convert".
- **View Interactive Maps**: Watch the real-time queue status as the system extracts the ITM coordinates, converts them to WGS84, and generates precise Google Maps and GovMap iframes.
- **AI Neighborhood Insights**: Once the map loads, click the "✨ Analyze Project Environment with AI" button to receive an on-demand, detailed report covering local education, public transportation, and future urban development plans.

<p align="right">(<a href="#top">back to top</a>)</p>

## License

Distributed under the MIT License. See [`LICENSE.txt`](https://github.com/RamMichaeli17/Dira/blob/main/LICENSE.txt) for more information.

<p align="right">(<a href="#top">back to top</a>)</p>

## Contributors

Thanks to the following people who have contributed to this project:

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/RamMichaeli17">
        <img src="https://avatars.githubusercontent.com/u/62435713?v=4" width="100px;" /><br>
        <sub>
          <b>Ram Michaeli</b>
        </sub>
      </a>
    </td>
    <!-- Add more contributors here -->
  </tr>
</table>

<p align="right">(<a href="#top">back to top</a>)</p>

## Contact

Ram Michaeli - [ram153486@gmail.com](mailto:ram153486@gmail.com)

Project Link: [https://github.com/RamMichaeli17/Dira](https://github.com/RamMichaeli17/Dira)

<a href="mailto:ram153486@gmail.com"><img src="https://img.shields.io/twitter/url?label=Gmail%3A%20ram153486%40gmail.com&logo=gmail&style=social&url=https%3A%2F%2Fmailto%3Aram153486%40gmail.com"/></a>
<a href="https://linkedin.com/in/ram-michaeli"><img src="https://img.shields.io/twitter/url?label=ram%20Michaeli&logo=linkedin&style=social&url=https%3A%2F%2Fmailto%3Aram153486%40gmail.com"/></a>

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->

[reposize-shield]: https://img.shields.io/github/repo-size/RamMichaeli17/Dira?style=for-the-badge
[languagescount-shield]: https://img.shields.io/github/languages/count/RamMichaeli17/Dira?style=for-the-badge
[contributors-shield]: https://img.shields.io/github/contributors/RamMichaeli17/Dira.svg?style=for-the-badge
[contributors-url]: https://github.com/RamMichaeli17/Dira/graphs/contributors
[stars-shield]: https://img.shields.io/github/stars/RamMichaeli17/Dira.svg?style=for-the-badge
[stars-url]: https://github.com/RamMichaeli17/Dira/stargazers
[license-shield]: https://img.shields.io/github/license/RamMichaeli17/Dira.svg?style=for-the-badge
[license-url]: https://github.com/RamMichaeli17/Dira/blob/main/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white
[linkedin-url]: https://linkedin.com/in/ram-michaeli
[gmail-shield]: https://img.shields.io/badge/ram153486@gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white
[gmail-url]: mailto:ram153486@gmail.com
