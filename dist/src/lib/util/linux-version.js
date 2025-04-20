"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
/**
 * Default options for Linux exec operations
 */
const execOptsLinux = {
    maxBuffer: 1024 * 50_000,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
};
/**
 * Get Linux version information
 * @returns {string} Linux version string
 */
function linuxVersion() {
    let result = '';
    try {
        // Only run this on Linux
        if (process.platform === 'linux') {
            result = (0, child_process_1.execSync)('uname -v', execOptsLinux).toString();
        }
    }
    catch {
        result = '';
    }
    return result;
}
exports.default = linuxVersion;
