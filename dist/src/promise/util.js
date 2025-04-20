"use strict";
/**
 * Utility functions for promisification and WinRM wrapper generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.withErrorHandling = exports.createWinRMWrapper = exports.promisifyWithData = void 0;
/**
 * Promisify a callback-based function with a specific signature
 * where the callback is the last parameter and receives (data)
 *
 * @param callbackFn - The callback-based function to promisify
 * @returns A function that returns a Promise
 */
const promisifyWithData = (callbackFn) => {
    const promisified = (options) => new Promise((resolve, reject) => {
        try {
            callbackFn(options, (data) => {
                resolve(data);
            });
        }
        catch (error) {
            reject(error);
        }
    });
    // Preserve original function's name and properties
    promisified._originalFn = callbackFn;
    promisified._name = callbackFn._name || callbackFn.name;
    promisified._fnName = callbackFn._fnName;
    return promisified;
};
exports.promisifyWithData = promisifyWithData;
/**
 * Checks if a result is considered empty
 *
 * @param result - The result to check
 * @returns True if the result is empty, false otherwise
 */
const isEmptyResult = (result) => {
    if (result === null || result === undefined) {
        return true;
    }
    if (typeof result !== 'object') {
        return false;
    }
    return Object.keys(result).length === 0;
};
/**
 * Extract the function name from a function
 *
 * @param fn - The function to extract the name from
 * @returns The function name or 'unknown-function' if not found
 */
const getFunctionName = (fn) => {
    // First check function itself
    const directProps = ['_fnName', '_name', 'name'];
    for (const prop of directProps) {
        if (fn[prop]) {
            return fn[prop];
        }
    }
    // Check original function if wrapped
    if (fn._originalFn) {
        const libFn = fn._originalFn;
        for (const prop of directProps) {
            if (libFn[prop]) {
                return libFn[prop];
            }
        }
        // Try to extract name from toString()
        const fnStr = libFn.toString();
        const match = fnStr.match(/function\s+([^\s(]+)/);
        if (match) {
            return match[1];
        }
    }
    // If still not found, try global registry
    for (const key in global) {
        if (global[key] === fn) {
            return key;
        }
    }
    return 'unknown-function';
};
/**
 * Retry a function with the specified configuration
 *
 * @param fn - The function to retry
 * @param config - The configuration to pass to the function
 * @param optionalParam - An optional parameter to pass to the function
 * @param fnName - The name of the function for logging
 * @param maxRetries - Maximum number of retries
 * @returns The result of the function
 */
const retryFunction = async (fn, config, optionalParam, fnName, maxRetries = 2) => {
    let retryCount = 0;
    let result;
    let hadEmptyInitialResult = false;
    do {
        try {
            // Log retry attempts
            if (retryCount > 0) {
                console.warn(`[RETRY] Attempt #${retryCount} for function: ${fnName}`);
            }
            result = await fn(config, optionalParam);
            // Ensure null/undefined results become empty objects
            if (result === null || result === undefined) {
                result = {};
            }
            // Log recovery if applicable
            if (!isEmptyResult(result) && hadEmptyInitialResult) {
                console.info(`[RECOVERY] Retry #${retryCount} for function: ${fnName} successfully returned data after initial empty result`);
            }
            // If result is not empty, break out of retry loop
            if (!isEmptyResult(result)) {
                break;
            }
            // Set flag if this was the first attempt and it was empty
            if (retryCount === 0) {
                hadEmptyInitialResult = true;
            }
            // Only retry if we haven't reached max retries
            if (retryCount < maxRetries) {
                retryCount++;
                // Add a small delay between retries
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }
        catch (error) {
            console.error(`[ERROR] Function ${fnName} failed with: ${error?.message || 'Unknown error'}`);
            return {}; // Return empty object on error
        }
    } while (isEmptyResult(result) && retryCount <= maxRetries);
    // Log if all retries were exhausted
    if (isEmptyResult(result) && hadEmptyInitialResult && retryCount >= maxRetries) {
        console.warn(`[EXHAUSTED] All ${maxRetries} retries for function: ${fnName} returned empty results`);
    }
    return result;
};
/**
 * Create a WinRM wrapper for any promisified function
 *
 * @param promiseFn - The promisified function
 * @returns A function that accepts WinRM config and returns a Promise
 */
const createWinRMWrapper = (promiseFn) => {
    const wrapper = async (winrmConfig, optionalParameter) => {
        const { winrm, host, port, username, password } = winrmConfig;
        const config = {
            winrm,
            host,
            port,
            username,
            password,
            platform: 'win32',
        };
        const fnName = getFunctionName(promiseFn);
        return retryFunction(promiseFn, config, optionalParameter, fnName);
    };
    // Preserve function properties
    wrapper._originalPromiseFn = promiseFn;
    return wrapper;
};
exports.createWinRMWrapper = createWinRMWrapper;
/**
 * Wraps a function with better error handling, especially for null returns
 *
 * @param fn - The function to wrap with additional error handling
 * @returns A function with improved error handling
 */
const withErrorHandling = (fn) => {
    const wrappedFunction = async (...args) => {
        try {
            const result = await fn(...args);
            // Handle null or undefined returns by providing an empty object
            return result === null || result === undefined ? {} : result;
        }
        catch (error) {
            console.error(`Error executing function: ${error.message}`);
            return { error: error.message, success: false };
        }
    };
    return wrappedFunction;
};
exports.withErrorHandling = withErrorHandling;
