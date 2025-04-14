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
export const promisifyWithData =
  (callbackFn: CallbackFunction): PromisifiedFunction =>
  (options: WinRMConfig, optionalParam?: any): Promise<any> =>
    new Promise((resolve, reject) => {
      try {
        // Check if the function is networkStats which has an optional middle parameter
        if (['networkStats', 'versions', 'services'].includes(callbackFn.name || '')) {
          callbackFn(options, optionalParam, (data) => {
            resolve(data);
          });
        } else {
          callbackFn(options, (data) => {
            resolve(data);
          });
        }
      } catch (error) {
        reject(error);
      }
    });

/**
 * Create a WinRM wrapper for any promisified function
 *
 * @param promiseFn - The promisified function
 * @returns A function that accepts WinRM config and returns a Promise
 */
export const createWinRMWrapper =
  (promiseFn: PromisifiedFunction): PromisifiedFunction =>
  async (winrmConfig: WinRMConfig, optionalParameter?: any): Promise<any> => {
    const { winrm, host, port, username, password } = winrmConfig;

    try {
      const result = await promiseFn(
        {
          winrm,
          host,
          port,
          username,
          password,
          platform: 'win32',
        },
        optionalParameter,
      );

      // Handle null or undefined returns by providing an empty object
      // This is especially needed for fsStats which returns null on Windows
      if (result === null || result === undefined) {
        return {};
      }

      return result;
    } catch {
      // Return empty object on error to maintain consistent return type
      return {};
    }
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
