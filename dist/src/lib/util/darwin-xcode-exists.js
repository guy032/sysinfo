"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.darwinXcodeExists = darwinXcodeExists;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
/**
 * Check if Xcode or Command Line Tools are installed on macOS
 *
 * @returns {boolean} True if Xcode or Command Line Tools are installed
 */
function darwinXcodeExists() {
    const cmdLineToolsExists = fs_1.default.existsSync('/Library/Developer/CommandLineTools/usr/bin/');
    const xcodeAppExists = fs_1.default.existsSync('/Applications/Xcode.app/Contents/Developer/Tools');
    const xcodeExists = fs_1.default.existsSync('/Library/Developer/Xcode/');
    return cmdLineToolsExists || xcodeExists || xcodeAppExists;
}
exports.default = darwinXcodeExists;
