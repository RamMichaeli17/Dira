// services/redis-service.js

const Redis = require("ioredis");

class RedisService {
  constructor() {
    this.client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      // Keep connection alive
      keepAlive: 30000,
      // Reconnect on error
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    this.client.on("connect", () => {
      console.log("Redis Client Connected");
    });
  }

  /**
   * Get cached project data
   * @param {string} projectNumber
   * @returns {Promise<Object|null>} Cached data or null
   */
  async getProjectData(projectNumber) {
    try {
      const data = await this.client.get(projectNumber);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  }

  /**
   * Cache project data
   * @param {string} projectNumber
   * @param {Object} data
   * @param {number} ttl Time to live in seconds (default 7 days)
   */
  async setProjectData(projectNumber, data, ttl = 604800) {
    try {
      await this.client.set(
        projectNumber,
        JSON.stringify(data),
        "EX",
        ttl
      );
    } catch (error) {
      console.error("Redis set error:", error);
    }
  }

  /**
   * Clear cached data for a project
   * @param {string} projectNumber
   */
  async clearProjectData(projectNumber) {
    try {
      await this.client.del(projectNumber);
    } catch (error) {
      console.error("Redis delete error:", error);
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    try {
      await this.client.quit();
      console.log("Redis connection closed");
    } catch (error) {
      console.error("Redis close error:", error);
    }
  }
}

module.exports = new RedisService();
