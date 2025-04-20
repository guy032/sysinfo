"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Compare two semantic version strings
 * Returns -1 if v1 > v2, 1 if v1 < v2, 0 if equal
 *
 * @param {string} v1 First version string
 * @param {string} v2 Second version string
 * @returns {number} Comparison result (-1, 0, or 1)
 */
function semverCompare(v1, v2) {
    let res = 0;
    const parts1 = v1.split('.');
    const parts2 = v2.split('.');
    if (parts1[0] < parts2[0]) {
        res = 1;
    }
    else if (parts1[0] > parts2[0]) {
        res = -1;
    }
    else if (parts1[0] === parts2[0] && parts1.length >= 2 && parts2.length >= 2) {
        if (parts1[1] < parts2[1]) {
            res = 1;
        }
        else if (parts1[1] > parts2[1]) {
            res = -1;
        }
        else if (parts1[1] === parts2[1]) {
            if (parts1.length >= 3 && parts2.length >= 3) {
                if (parts1[2] < parts2[2]) {
                    res = 1;
                }
                else if (parts1[2] > parts2[2]) {
                    res = -1;
                }
            }
            else if (parts2.length >= 3) {
                res = 1;
            }
        }
    }
    return res;
}
exports.default = semverCompare;
