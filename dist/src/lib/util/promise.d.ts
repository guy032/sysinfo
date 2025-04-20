/**
 * Promise utility functions for handling asynchronous operations
 */
/**
 * Executes an array of promises and collects results and errors
 *
 * @param {Promise[]} promises - Array of promises to execute
 * @returns {Promise<{errors: any[], results: any[]}>} - Promise that resolves to object with errors and results arrays
 */
export declare function promiseAll(promises: Array<Promise<any>>): Promise<{
    errors: any[];
    results: any[];
}>;
/**
 * Type definition for a Node.js style callback function
 */
type NodeStyleCallback<T> = (err: Error | null, data?: T) => void;
/**
 * Type definition for a Node.js style function that takes a callback
 */
type NodeStyleFunction<T, Args extends any[]> = (...args: [...Args, NodeStyleCallback<T>]) => void;
/**
 * Promisifies a Node.js style function with callback
 *
 * @param {Function} nodeStyleFunction - Function that follows Node.js callback pattern
 * @returns {Function} - Promisified version of the function
 */
export declare function promisify<T, Args extends any[]>(nodeStyleFunction: NodeStyleFunction<T, Args>): (...args: Args) => Promise<T>;
/**
 * Promisifies a Node.js style function with callback, but always resolves (never rejects)
 *
 * @param {Function} nodeStyleFunction - Function that follows Node.js callback pattern
 * @returns {Function} - Promisified version of the function that never rejects
 */
export declare function promisifySave<T, Args extends any[]>(nodeStyleFunction: NodeStyleFunction<T, Args>): (...args: Args) => Promise<T | undefined>;
export {};
//# sourceMappingURL=promise.d.ts.map