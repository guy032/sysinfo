"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cores = cores;
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
let coresNum = 0;
/**
 * Get the number of CPU cores
 *
 * @returns {number} Number of CPU cores
 */
function cores() {
    if (coresNum === 0) {
        coresNum = os_1.default.cpus().length;
    }
    return coresNum;
}
exports.default = cores;
