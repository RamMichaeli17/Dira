// services/redis-service.js

const Redis = require("ioredis");

/**
 * Service for managing Redis cache operations.
 * Handles automatic reconnections. Data is stored indefinitely.
 */
class RedisService {
  constructor() {
    this.client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      // Keep connection alive
      keepAlive: 30000,
      // Reconnect on error with exponential backoff
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
   * Retrieves cached project data.
   * @param {string} projectNumber - The project identifier.
   * @returns {Promise<Object|null>} Cached data or null if not found/error.
   */
  async getProjectData(projectNumber) {
    try {
      const data = await this.client.get(projectNumber);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Redis get error:", error);
      // Fallback to null so the application can proceed without cache
      return null;
    }
  }

  /**
   * Caches project data permanently (No expiration).
   * @param {string} projectNumber - The project identifier.
   * @param {Object} data - The map URLs and coordinates to cache.
   */
  async setProjectData(projectNumber, data) {
    try {
      await this.client.set(projectNumber, JSON.stringify(data));
    } catch (error) {
      console.error("Redis set error:", error);
    }
  }

  /**
   * Manually removes cached data for a specific project.
   * @param {string} projectNumber - The project identifier.
   */
  async clearProjectData(projectNumber) {
    try {
      await this.client.del(projectNumber);
    } catch (error) {
      console.error("Redis delete error:", error);
    }
  }

  /**
   * Gracefully closes the Redis connection during server shutdown.
   */
  async close() {
    try {
      await this.client.quit();
      console.log("Redis connection closed safely.");
    } catch (error) {
      console.error("Redis close error:", error);
    }
  }
}

module.exports = new RedisService();
