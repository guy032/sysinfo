"use strict";
/**
 * Promise utility functions for handling asynchronous operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseAll = promiseAll;
exports.promisify = promisify;
exports.promisifySave = promisifySave;
/**
 * Executes an array of promises and collects results and errors
 *
 * @param {Promise[]} promises - Array of promises to execute
 * @returns {Promise<{errors: any[], results: any[]}>} - Promise that resolves to object with errors and results arrays
 */
function promiseAll(promises) {
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
    const errors = [];
    const results = [];
    // Execute all wrapped Promises
    return Promise.all(resolvingPromises).then(function (items) {
        for (const payload of items) {
            if (payload[1]) {
                errors.push(payload[1]);
                results.push(null);
            }
            else {
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
 * Promisifies a Node.js style function with callback
 *
 * @param {Function} nodeStyleFunction - Function that follows Node.js callback pattern
 * @returns {Function} - Promisified version of the function
 */
function promisify(nodeStyleFunction) {
    return function (...args) {
        return new Promise(function (resolve, reject) {
            const callback = function (err, data) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
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
function promisifySave(nodeStyleFunction) {
    return function (...args) {
        return new Promise(function (resolve) {
            const callback = function (err, data) {
                resolve(data);
            };
            Reflect.apply(nodeStyleFunction, null, [...args, callback]);
        });
    };
}
