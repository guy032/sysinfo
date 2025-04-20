"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const http = tslib_1.__importStar(require("http"));
const https = tslib_1.__importStar(require("https"));
/**
 * Check if a website is reachable and get response details
 * @param {string} url URL to check
 * @param {number} [timeout=5000] Timeout in ms
 * @returns {Promise<WebsiteCheckResult>} Object with status info
 */
function checkWebsite(url, timeout = 5000) {
    const httpLib = url.startsWith('https:') || url.indexOf(':443/') > 0 || url.indexOf(':8443/') > 0
        ? https
        : http;
    const t = Date.now();
    return new Promise((resolve) => {
        const request = httpLib
            .get(url, function (res) {
            res.on('data', () => {
                /* consume data */
            });
            res.on('end', () => {
                resolve({
                    url,
                    statusCode: res.statusCode || 0,
                    message: res.statusMessage || '',
                    time: Date.now() - t,
                });
            });
        })
            .on('error', function (e) {
            resolve({
                url,
                statusCode: 404,
                message: e.message,
                time: Date.now() - t,
            });
        });
        request.setTimeout(timeout, () => {
            request.destroy();
            resolve({
                url,
                statusCode: 408,
                message: 'Request Timeout',
                time: Date.now() - t,
            });
        });
    });
}
exports.default = checkWebsite;
