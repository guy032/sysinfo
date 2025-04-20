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
export declare const promisifyWithData: (callbackFn: CallbackFunction) => PromisifiedFunction;
/**
 * Create a WinRM wrapper for any promisified function
 *
 * @param promiseFn - The promisified function
 * @returns A function that accepts WinRM config and returns a Promise
 */
export declare const createWinRMWrapper: (promiseFn: PromisifiedFunction) => PromisifiedFunction;
/**
 * Wraps a function with better error handling, especially for null returns
 *
 * @param fn - The function to wrap with additional error handling
 * @returns A function with improved error handling
 */
export declare const withErrorHandling: <T extends (...args: any[]) => Promise<any>>(fn: T) => T;
export {};
//# sourceMappingURL=util.d.ts.map