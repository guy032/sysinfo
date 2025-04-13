/**
 * Utility functions for promisification and WinRM wrapper generation
 */

/**
 * Promisify a callback-based function with a specific signature
 * where the callback is the last parameter and receives (data)
 * 
 * @param {Function} callbackFn - The callback-based function to promisify
 * @returns {Function} A function that returns a Promise
 */
const promisifyWithData = (callbackFn) => {
  return (options, optionalParam) => {
    return new Promise((resolve, reject) => {
      try {
        // Check if the function is networkStats which has an optional middle parameter
        if (['networkStats', 'versions', 'services'].includes(callbackFn.name)) {
          callbackFn(options, optionalParam, (data) => {
            resolve(data);
          });
        } else {
          callbackFn(options, (data) => {
            resolve(data);
          });
        }
      } catch (err) {
        reject(err);
      }
    });
  };
};

/**
 * Create a WinRM wrapper for any promisified function
 * 
 * @param {Function} promiseFn - The promisified function
 * @returns {Function} A function that accepts WinRM config and returns a Promise
 */
const createWinRMWrapper = (promiseFn) => {
  return async (winrmConfig, optionalParameter) => {
    const { winrm, host, port, username, password } = winrmConfig;
    
    try {
      const result = await promiseFn({
        winrm,
        host,
        port,
        username,
        password,
        platform: 'win32',
      }, optionalParameter);
      
      // Handle null or undefined returns by providing an empty object
      // This is especially needed for fsStats which returns null on Windows
      if (result === null || result === undefined) {
        return {};
      }
      
      return result;
    } catch (error) {
      // console.error(`[WinRM] Error in ${fnName}: ${error.message} after ${Date.now() - startTime}ms`);
      // Return empty object on error to maintain consistent return type
      return {};
    }
  };
};

/**
 * Wraps a function with better error handling, especially for null returns
 * 
 * @param {Function} fn - The function to wrap with additional error handling
 * @returns {Function} A function with improved error handling
 */
const withErrorHandling = (fn) => {
  return async (...args) => {
    try {
      const result = await fn(...args);
      // Handle null or undefined returns by providing an empty object
      return result === null || result === undefined ? {} : result;
    } catch (error) {
      console.error(`Error executing function: ${error.message}`);
      return { error: error.message, success: false };
    }
  };
};

module.exports = {
  promisifyWithData,
  createWinRMWrapper,
  withErrorHandling
}; 