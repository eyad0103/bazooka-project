/**
 * Timeout Utility
 * Handles request timeouts and promise timeouts
 */

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

function createTimeoutHandler(timeoutMs) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

module.exports = { withTimeout, createTimeoutHandler };
