/**
 * Promise utility functions for handling asynchronous operations
 */

/**
 * Executes an array of promises and collects results and errors
 *
 * @param {Promise[]} promises - Array of promises to execute
 * @returns {Promise<{errors: any[], results: any[]}>} - Promise that resolves to object with errors and results arrays
 */
export function promiseAll(
  promises: Array<Promise<any>>,
): Promise<{ errors: any[]; results: any[] }> {
  const resolvingPromises = promises.map(function (promise) {
    return new Promise(function (resolve) {
      const payload = Array.from({ length: 2 });
      promise
        .then(function (result) {
          payload[0] = result;
        })
        .catch(function (error) {
          payload[1] = error;
        })
        .then(function () {
          // The wrapped Promise returns an array: 0 = result, 1 = error ... we resolve all
          resolve(payload);
        });
    });
  });
  const errors: any[] = [];
  const results: any[] = [];

  // Execute all wrapped Promises
  return Promise.all(resolvingPromises).then(function (items) {
    for (const payload of items as any[][]) {
      if (payload[1]) {
        errors.push(payload[1]);
        results.push(null);
      } else {
        errors.push(null);
        results.push(payload[0]);
      }
    }

    return {
      errors,
      results,
    };
  });
}

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
export function promisify<T, Args extends any[]>(
  nodeStyleFunction: NodeStyleFunction<T, Args>,
): (...args: Args) => Promise<T> {
  return function (...args: Args): Promise<T> {
    return new Promise(function (resolve, reject) {
      const callback: NodeStyleCallback<T> = function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data as T);
        }
      };

      Reflect.apply(nodeStyleFunction, null, [...args, callback]);
    });
  };
}

/**
 * Promisifies a Node.js style function with callback, but always resolves (never rejects)
 *
 * @param {Function} nodeStyleFunction - Function that follows Node.js callback pattern
 * @returns {Function} - Promisified version of the function that never rejects
 */
export function promisifySave<T, Args extends any[]>(
  nodeStyleFunction: NodeStyleFunction<T, Args>,
): (...args: Args) => Promise<T | undefined> {
  return function (...args: Args): Promise<T | undefined> {
    return new Promise(function (resolve) {
      const callback: NodeStyleCallback<T> = function (err, data) {
        resolve(data);
      };

      Reflect.apply(nodeStyleFunction, null, [...args, callback]);
    });
  };
}
