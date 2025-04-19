/**
 * Utility functions for promisification and WinRM wrapper generation
 */

/**
 * Type definitions for WinRM configuration
 */
export interface WinRMConfig {
  winrm: any;
  host: string;
  port: number;
  username: string;
  password: string;
  platform?: string;
}

/**
 * Type for a callback function that receives data
 */
type DataCallback<T> = (data: T) => void;

/**
 * Type for a callback-based function that can be promisified
 */
interface CallbackFunction {
  name?: string;
  _name?: string;
  _fnName?: string;
  (options: WinRMConfig, callback: DataCallback<any>): void;
  (options: WinRMConfig, optionalParam: any, callback: DataCallback<any>): void;
}

/**
 * Type for a promisified function
 */
type PromisifiedFunction = (options: WinRMConfig, optionalParam?: any) => Promise<any>;

/**
 * Promisify a callback-based function with a specific signature
 * where the callback is the last parameter and receives (data)
 *
 * @param callbackFn - The callback-based function to promisify
 * @returns A function that returns a Promise
 */
export const promisifyWithData = (callbackFn: CallbackFunction): PromisifiedFunction => {
  const promisified = (options: WinRMConfig): Promise<any> =>
    new Promise((resolve, reject) => {
      try {
        callbackFn(options, (data) => {
          resolve(data);
        });
      } catch (error) {
        reject(error);
      }
    });

  // Preserve original function's name and properties
  promisified._originalFn = callbackFn;
  promisified._name = callbackFn._name || callbackFn.name;
  promisified._fnName = callbackFn._fnName;

  return promisified;
};

/**
 * Checks if a result is considered empty
 *
 * @param result - The result to check
 * @returns True if the result is empty, false otherwise
 */
const isEmptyResult = (result: any): boolean => {
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
const getFunctionName = (fn: any): string => {
  // Check for specific library function names
  if (fn._originalFn) {
    // This is a common pattern in the systeminformation library
    const libFn = fn._originalFn;

    // Try to get the name from the original function's properties
    if (libFn._fnName) {
      return libFn._fnName;
    }

    if (libFn._name) {
      return libFn._name;
    }

    if (libFn.name) {
      return libFn.name;
    }

    // Try to extract name from toString() which often includes the function name
    const fnStr = libFn.toString();
    const match = fnStr.match(/function\s+([^\s(]+)/);

    if (match) {
      return match[1];
    }
  }

  // Try to get name from the function itself
  if (fn._fnName) {
    return fn._fnName;
  }

  if (fn._name) {
    return fn._name;
  }

  if (fn.name) {
    return fn.name;
  }

  // If we get here, use the import path or filename if available
  // This will typically be something like "audioLib", "batteryLib", etc.
  for (const key in global) {
    if (global[key] === fn) {
      return key;
    }
  }

  return 'unknown-function';
};

/**
 * Create a WinRM wrapper for any promisified function
 *
 * @param promiseFn - The promisified function
 * @returns A function that accepts WinRM config and returns a Promise
 */
export const createWinRMWrapper = (promiseFn: PromisifiedFunction): PromisifiedFunction => {
  // Create wrapper function
  const wrapper = async (winrmConfig: WinRMConfig, optionalParameter?: any): Promise<any> => {
    const { winrm, host, port, username, password } = winrmConfig;
    const config = {
      winrm,
      host,
      port,
      username,
      password,
      platform: 'win32',
    };

    // Set maximum retry attempts
    const maxRetries = 2;
    let retryCount = 0;
    let result;
    let hadEmptyInitialResult = false;

    // Get the function name for logs
    const fnName = getFunctionName(promiseFn);

    do {
      try {
        // Log retry attempts
        if (retryCount > 0) {
          console.log(`[RETRY] Attempt #${retryCount} for function: ${fnName}`);
        }

        result = await promiseFn(config, optionalParameter);

        // Handle null or undefined returns by providing an empty object
        // This is especially needed for fsStats which returns null on Windows
        if (result === null || result === undefined) {
          result = {};
        }

        // If result is not empty, and we had an empty initial result, log the recovery
        if (!isEmptyResult(result) && hadEmptyInitialResult) {
          console.log(
            `[RECOVERY] Retry #${retryCount} for function: ${fnName} successfully returned data after initial empty result`,
          );
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
          // Optional: Add a small delay between retries
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        // Log the error
        console.error(
          `[ERROR] Function ${fnName} failed with: ${(error as Error)?.message || 'Unknown error'}`,
        );

        // Return empty object on error to maintain consistent return type
        return {};
      }
    } while (isEmptyResult(result) && retryCount <= maxRetries);

    // Log if all retries were exhausted and still got empty result
    if (isEmptyResult(result) && hadEmptyInitialResult && retryCount >= maxRetries) {
      console.log(
        `[EXHAUSTED] All ${maxRetries} retries for function: ${fnName} returned empty results`,
      );
    }

    return result;
  };

  // Preserve function properties
  wrapper._originalPromiseFn = promiseFn;

  return wrapper;
};

/**
 * Wraps a function with better error handling, especially for null returns
 *
 * @param fn - The function to wrap with additional error handling
 * @returns A function with improved error handling
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(fn: T): T => {
  const wrappedFunction = async (...args: any[]) => {
    try {
      const result = await fn(...args);

      // Handle null or undefined returns by providing an empty object
      return result === null || result === undefined ? {} : result;
    } catch (error) {
      console.error(`Error executing function: ${(error as Error).message}`);

      return { error: (error as Error).message, success: false };
    }
  };

  return wrappedFunction as T;
};
