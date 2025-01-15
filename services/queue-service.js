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
    console.log(
      `Request ${request.id} added to queue. Queue length: ${this.queue.length}`
    );
    return this.queue.length;
  }

  /**
   * Remove request by ID from anywhere in the queue
   * @param {string} requestId ID of request to remove
   * @returns {Object|null} Removed request or null if not found
   */
  removeById(requestId) {
    const index = this.queue.findIndex((request) => request.id === requestId);
    if (index === -1) return null;

    const request = this.queue[index];
    this.queue.splice(index, 1);

    // If we removed the current request, clear the currentRequestId
    if (request.id === this.currentRequestId) {
      this.currentRequestId = null;
      this.isProcessing = false;
    }

    console.log(
      `Request ${requestId} removed from queue. Queue length: ${this.queue.length}`
    );
    return request;
  }

  /**
   * Remove and return first request
   * @returns {Object|null} First request or null if queue empty
   */
  remove() {
    const request = this.queue.shift();
    if (request) {
      console.log(
        `Request ${request.id} removed from queue. Queue length: ${this.queue.length}`
      );
      this.currentRequestId = null;
      this.isProcessing = false;
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

  /**
   * Check if request exists in queue
   * @param {string} requestId Request ID to check
   * @returns {boolean} True if request exists in queue
   */
  hasRequest(requestId) {
    return this.queue.some((request) => request.id === requestId);
  }
}

module.exports = new QueueService();
