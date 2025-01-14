// services/queue-service.js

/**
 * Simple queue service for managing request processing
 */
class QueueService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.currentRequestId = null;
  }

  /**
   * Add request to queue
   * @param {Object} request Request object with req, res and abortController
   * @returns {number} Queue length
   */
  add(request) {
    request.id = request.req.headers["x-request-id"];
    this.queue.push(request);
    return this.queue.length;
  }

  /**
   * Remove and return first request
   * @returns {Object|null} First request or null if queue empty
   */
  remove() {
    const request = this.queue.shift();
    if (request) {
      this.currentRequestId = null;
    }
    return request;
  }

  /**
   * Get first request without removing
   * @returns {Object|null} First request or null if queue empty
   */
  peek() {
    return this.queue[0] || null;
  }

  /**
   * Get queue length
   * @returns {number} Queue length
   */
  getLength() {
    return this.queue.length;
  }

  /**
   * Check if request is being processed
   * @returns {boolean} Processing status
   */
  isCurrentlyProcessing() {
    return this.isProcessing;
  }

  /**
   * Update processing status
   * @param {boolean} status New status
   */
  setProcessingStatus(status) {
    this.isProcessing = status;
    this.currentRequestId = status && this.queue[0] ? this.queue[0].id : null;
  }

  /**
   * Get ID of request being processed
   * @returns {string|null} Current request ID
   */
  getCurrentRequestId() {
    return this.currentRequestId;
  }
}

module.exports = new QueueService();
