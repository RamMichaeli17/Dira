// services/queue-service.js

/**
 * Service for managing request queue
 * Handles request queuing and processing to prevent concurrent access to browser
 */
class QueueService {
    constructor() {
      this.queue = [];
      this.isProcessing = false;
    }
  
    /**
     * Add new request to queue
     * @param {Object} request Request object containing req and res
     * @returns {number} Current queue length
     */
    add(request) {
      this.queue.push(request);
      console.log(`Request added to queue. Queue length: ${this.queue.length}`);
      return this.queue.length;
    }
  
    /**
     * Remove first request from queue
     * @returns {Object|null} First request in queue or null if empty
     */
    remove() {
      const request = this.queue.shift();
      console.log(`Request removed from queue. Queue length: ${this.queue.length}`);
      return request;
    }
  
    /**
     * Get current queue length
     * @returns {number} Current queue length
     */
    getLength() {
      return this.queue.length;
    }
  
    /**
     * Get first request in queue without removing it
     * @returns {Object|null} First request in queue or null if empty
     */
    peek() {
      return this.queue[0] || null;
    }
  
    /**
     * Check if queue is currently processing requests
     * @returns {boolean} Processing status
     */
    isCurrentlyProcessing() {
      return this.isProcessing;
    }
  
    /**
     * Set processing status
     * @param {boolean} status New processing status
     */
    setProcessingStatus(status) {
      this.isProcessing = status;
    }
  
    /**
     * Clear all requests from queue
     */
    clear() {
      this.queue = [];
      this.isProcessing = false;
      console.log("Queue cleared");
    }
  }
  
  // Export single instance
  module.exports = new QueueService();