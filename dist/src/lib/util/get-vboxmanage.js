"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVboxmanage = getVboxmanage;
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
// Define constants
const _windows = os_1.default.type() === 'Windows_NT';
/**
 * Get the VBoxManage executable path
 *
 * @returns {string} Path to VBoxManage executable
 */
function getVboxmanage() {
    return _windows
        ? `"${process.env.VBOX_INSTALL_PATH || process.env.VBOX_MSI_INSTALL_PATH}\\VBoxManage.exe"`
        : 'vboxmanage';
}
exports.default = getVboxmanage;
