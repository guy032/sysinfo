"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRpiGpu = getRpiGpu;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const decode_pi_cpuinfo_1 = tslib_1.__importDefault(require("./decode-pi-cpuinfo"));
// Cache Raspberry Pi CPU info
let _rpi_cpuinfo = null;
/**
 * Get Raspberry Pi GPU information
 *
 * @param {string[]} [cpuinfo] - CPU info from /proc/cpuinfo or cached info
 * @returns {string|boolean} GPU model or false if not a Raspberry Pi
 */
function getRpiGpu(cpuinfo) {
    if (_rpi_cpuinfo === null && cpuinfo !== undefined) {
        _rpi_cpuinfo = cpuinfo;
    }
    else if (cpuinfo === undefined && _rpi_cpuinfo !== null) {
        cpuinfo = _rpi_cpuinfo;
    }
    else {
        try {
            cpuinfo = fs_1.default.readFileSync('/proc/cpuinfo', { encoding: 'utf8' }).toString().split('\n');
            _rpi_cpuinfo = cpuinfo;
        }
        catch {
            return false;
        }
    }
    const rpi = (0, decode_pi_cpuinfo_1.default)(cpuinfo);
    if (rpi.type === '4B' || rpi.type === 'CM4' || rpi.type === 'CM4S' || rpi.type === '400') {
        return 'VideoCore VI';
    }
    if (rpi.type === '5' || rpi.type === '500') {
        return 'VideoCore VII';
    }
    return 'VideoCore IV';
}
exports.default = getRpiGpu;
