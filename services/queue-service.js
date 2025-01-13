// services/queue-service.js

/**
 * Service for managing request queue
 * Handles request queuing and processing to prevent concurrent access to browser
 */
class QueueService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.canceledRequests = new Set();
    this.currentRequestId = null;
  }

  /**
   * Add new request to queue
   * @param {Object} request Request object containing req and res
   * @returns {number} Current queue length
   */
  add(request) {
    // Extract request ID from headers
    const requestId = request.req.headers["x-request-id"];
    request.id = requestId;

    this.queue.push(request);
    console.log(
      `Request ${requestId} added to queue. Queue length: ${this.queue.length}`
    );
    return this.queue.length;
  }

  /**
   * Remove first request from queue
   * @returns {Object|null} First request in queue or null if empty
   */
  remove() {
    const request = this.queue.shift();
    if (request) {
      this.currentRequestId = null;
      console.log(
        `Request ${request.id} removed from queue. Queue length: ${this.queue.length}`
      );
    }
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
   * Set processing status and current request ID
   * @param {boolean} status New processing status
   */
  setProcessingStatus(status) {
    this.isProcessing = status;
    if (status && this.queue[0]) {
      this.currentRequestId = this.queue[0].id;
    } else {
      this.currentRequestId = null;
    }
  }

  /**
   * Get current processing request ID
   * @returns {string|null} Current request ID or null
   */
  getCurrentRequestId() {
    return this.currentRequestId;
  }

  /**
   * Clear all requests from queue
   */
  clear() {
    this.queue = [];
    this.isProcessing = false;
    this.canceledRequests.clear();
    this.currentRequestId = null;
    console.log("Queue cleared");
  }

  /**
   * Mark request as canceled
   * @param {Object} request Request to mark as canceled
   */
  markAsCanceled(request) {
    this.canceledRequests.add(request);
    console.log("Request marked as canceled");
  }

  /**
   * Check if request is canceled
   * @param {Object} request Request to check
   * @returns {boolean} Whether request is canceled
   */
  isCanceled(request) {
    return this.canceledRequests.has(request);
  }

  /**
   * Clear canceled status for request
   * @param {Object} request Request to clear status for
   */
  clearCancelStatus(request) {
    this.canceledRequests.delete(request);
  }
}

// Export single instance
module.exports = new QueueService();
