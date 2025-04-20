"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRaspbian = isRaspbian;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
/**
 * Check if OS is Raspbian
 *
 * @returns {boolean} True if OS is Raspbian
 */
function isRaspbian() {
    let result = false;
    try {
        const osRelease = fs_1.default
            .readFileSync('/etc/os-release', { encoding: 'utf8' })
            .toString()
            .split('\n');
        const linuxInfo = {};
        for (const line of osRelease) {
            const parts = line.split('=');
            if (parts.length === 2) {
                linuxInfo[parts[0].toLowerCase()] = parts[1].toLowerCase().replaceAll('"', '');
            }
        }
        result = Boolean(linuxInfo.id === 'raspbian' || (linuxInfo.id_like && linuxInfo.id_like.includes('raspbian')));
    }
    catch {
        // Not Raspbian
    }
    return result;
}
exports.default = isRaspbian;
