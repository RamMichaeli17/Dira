// public/stateUtils.js

/**
 * Simple state management for request tracking
 */
export const requestState = {
  currentRequestId: null,

  /**
   * Set current request ID
   * @param {string} id Request ID to set
   */
  setCurrentRequestId(id) {
    this.currentRequestId = id;
  },

  /**
   * Get current request ID
   * @returns {string|null} Current request ID
   */
  getCurrentRequestId() {
    return this.currentRequestId;
  },

  /**
   * Clear current request ID
   */
  clearCurrentRequestId() {
    this.currentRequestId = null;
  },
};
