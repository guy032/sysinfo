"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
exports.smartMonToolsInstalled = smartMonToolsInstalled;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const noop_1 = tslib_1.__importDefault(require("./noop"));
// Cache the result
let _smartMonToolsInstalled = null;
/**
 * Reference to powerShell function that will be set during initialization
 */
let powerShell;
/**
 * Initialize the module with dependencies
 *
 * @param {Function} ps - powerShell function to use
 */
function init(ps) {
    powerShell = ps;
}
/**
 * Helper function to check if a path contains a Windows-style drive letter
 */
function isWindowsPath(path) {
    return typeof path === 'string' && path.length > 0 && path.includes(':\\');
}
/**
 * Checks if smartmontools are installed
 *
 * @param {PlatformOptions} [options={}] - Function options
 * @returns {Promise<boolean>} Returns true if installed
 */
async function smartMonToolsInstalled(options = {}) {
    // Platform constants
    const _windows = options.platform === 'win32' || process.platform === 'win32';
    const _linux = options.platform === 'linux' ||
        options.platform === 'android' ||
        (!options.platform && (process.platform === 'linux' || process.platform === 'android'));
    const _darwin = options.platform === 'darwin' || (!options.platform && process.platform === 'darwin');
    const _freebsd = options.platform === 'freebsd' || (!options.platform && process.platform === 'freebsd');
    const _openbsd = options.platform === 'openbsd' || (!options.platform && process.platform === 'openbsd');
    const _netbsd = options.platform === 'netbsd' || (!options.platform && process.platform === 'netbsd');
    const execOptsLinux = {
        maxBuffer: 1024 * 50_000,
        encoding: 'utf8',
    };
    if (_smartMonToolsInstalled !== null) {
        return _smartMonToolsInstalled;
    }
    _smartMonToolsInstalled = false;
    if (_windows) {
        try {
            if (typeof powerShell === 'function') {
                const pathArray = await powerShell('WHERE smartctl 2>nul', options);
                if (typeof pathArray === 'string') {
                    _smartMonToolsInstalled = pathArray.length > 0 ? pathArray.includes(':\\') : false;
                }
                else if (Array.isArray(pathArray)) {
                    // If result is an array of strings, check if any of them include the path
                    _smartMonToolsInstalled = pathArray.some((path) => isWindowsPath(path));
                }
            }
        }
        catch {
            _smartMonToolsInstalled = false;
        }
    }
    if (_linux || _darwin || _freebsd || _openbsd || _netbsd) {
        try {
            const pathArray = (0, child_process_1.execSync)('which smartctl 2>/dev/null', execOptsLinux)
                .toString()
                .split('\r\n');
            _smartMonToolsInstalled = pathArray.length > 0;
        }
        catch {
            (0, noop_1.default)();
        }
    }
    return _smartMonToolsInstalled;
}
exports.default = smartMonToolsInstalled;
