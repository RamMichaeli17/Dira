// services/queue-service.js

/**
 * Simple queue service for managing sequential request processing.
 * Prevents overloading the browser instance by executing one task at a time.
 */
class QueueService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.currentRequestId = null;
  }

  /**
   * Adds a new request to the end of the queue.
   * @param {Object} request - Request object containing req, res, and abortController.
   * @returns {number} The new length of the queue.
   */
  add(request) {
    // FIX: Added optional chaining and a fallback ID to prevent errors
    // if the 'x-request-id' header is missing or malformed.
    request.id =
      request.req?.headers?.["x-request-id"] || Date.now().toString();

    this.queue.push(request);
    console.log(
      `Request ${request.id} added to queue. Queue length: ${this.queue.length}`,
    );
    return this.queue.length;
  }

  /**
   * Removes a specific request by its ID from anywhere in the queue (e.g., when a user aborts).
   * @param {string} requestId - The ID of the request to remove.
   * @returns {Object|null} The removed request object, or null if not found.
   */
  removeById(requestId) {
    const index = this.queue.findIndex((request) => request.id === requestId);
    if (index === -1) return null;

    const request = this.queue[index];
    this.queue.splice(index, 1);

    // If we removed the currently processing request, clear the state
    if (request.id === this.currentRequestId) {
      this.currentRequestId = null;
      this.isProcessing = false;
    }

    console.log(
      `Request ${requestId} removed from queue. Queue length: ${this.queue.length}`,
    );
    return request;
  }

  /**
   * Removes and returns the first request in the queue (FIFO).
   * @returns {Object|null} The first request, or null if the queue is empty.
   */
  remove() {
    const request = this.queue.shift();
    if (request) {
      console.log(
        `Request ${request.id} removed from queue. Queue length: ${this.queue.length}`,
      );
      // Reset processing state so the next item can start
      this.currentRequestId = null;
      this.isProcessing = false;
    }
    return request;
  }

  /**
   * Returns the first request without removing it from the queue.
   * @returns {Object|null} The first request, or null if the queue is empty.
   */
  peek() {
    return this.queue[0] || null;
  }

  /**
   * Gets the current number of requests waiting in the queue.
   * @returns {number} Queue length.
   */
  getLength() {
    return this.queue.length;
  }

  /**
   * Checks if the queue is currently processing a request.
   * @returns {boolean} True if busy, false otherwise.
   */
  isCurrentlyProcessing() {
    return this.isProcessing;
  }

  /**
   * Updates the processing status of the queue.
   * @param {boolean} status - The new processing status.
   */
  setProcessingStatus(status) {
    this.isProcessing = status;
    this.currentRequestId = status && this.queue[0] ? this.queue[0].id : null;
  }

  /**
   * Gets the ID of the request currently being processed.
   * @returns {string|null} Current request ID.
   */
  getCurrentRequestId() {
    return this.currentRequestId;
  }

  /**
   * Checks if a specific request ID currently exists anywhere in the queue.
   * @param {string} requestId - The request ID to look for.
   * @returns {boolean} True if found, false otherwise.
   */
  hasRequest(requestId) {
    return this.queue.some((request) => request.id === requestId);
  }
}

module.exports = new QueueService();
