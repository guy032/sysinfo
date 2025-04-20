"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWmic = getWmic;
const tslib_1 = require("tslib");
const util = tslib_1.__importStar(require("."));
/**
 * Get the WMIC executable path
 *
 * @returns {string} Path to WMIC executable
 */
async function getWmic(options = {}) {
    const stdout = await util.powerShell('Get-Command wmic | ConvertTo-Json -Compress', options);
    const stdoutStr = Array.isArray(stdout) ? stdout[0] : stdout;
    const wmicPath = JSON.parse(stdoutStr).Path;
    // CommandType     Name                                               Version    Source
    // -----------     ----                                               -------    ------
    // Application     WMIC.exe                                           10.0.26... C:\WINDOWS\System32\Wbem\WMIC.exe
    // Handle potential array return by extracting first element or using the string directly
    return Array.isArray(wmicPath) ? wmicPath[0] : wmicPath;
}
exports.default = getWmic;
