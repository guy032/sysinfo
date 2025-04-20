"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPowershell = getPowershell;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const os_1 = tslib_1.__importDefault(require("os"));
// Define constants and variables
const _windows = os_1.default.type() === 'Windows_NT';
const WINDIR = process.env.WINDIR || 'C:\\Windows';
let _powerShell = 'powershell.exe';
/**
 * Get the PowerShell executable path
 *
 * @returns {string} Path to PowerShell executable
 */
function getPowershell() {
    _powerShell = 'powershell.exe';
    if (_windows) {
        const defaultPath = `${WINDIR}\\system32\\WindowsPowerShell\\v1.0\\powershell.exe`;
        if (fs_1.default.existsSync(defaultPath)) {
            _powerShell = defaultPath;
        }
    }
    return _powerShell;
}
exports.default = getPowershell;
