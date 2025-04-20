"use strict";
// @ts-check
// ==================================================================================
// utils.ts
// ----------------------------------------------------------------------------------
// Description:   System Information - library
//                for Node.js
// Copyright:     (c) 2014 - 2025
// Author:        Sebastian Hildebrandt
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 0. helper functions
// ----------------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.toInt = exports.splitByNumber = exports.sortByKey = exports.smartMonToolsInstalled = exports.semverCompare = exports.sanitizeShellString = exports.promisifySave = exports.promisify = exports.promiseAll = exports.powerShellWinRMWorkload = exports.powerShellWinRMSingleShell = exports.powerShellWinRMBatch = exports.powerShellStart = exports.powerShellRelease = exports.powerShell = exports.getPowerShellPath = exports.executeScript = exports.strIsNumeric = exports.plistReader = exports.plistParser = exports.parseTime = exports.parseHead = exports.parseDateTime = exports.noop = exports.nanoSeconds = exports.linuxVersion = exports.isRaspbian = exports.isRaspberry = exports.isPrototypePolluted = exports.isFunction = exports.hex2bin = exports.getWmic = exports.getVboxmanage = exports.getValue = exports.getRpiGpu = exports.getPowershell = exports.getFilesInPath = exports.getCodepage = exports.findObjectByKey = exports.execWin = exports.detectSplit = exports.decodePiCpuinfo = exports.decodeEscapeSequence = exports.darwinXcodeExists = exports.countUniqueLines = exports.countLines = exports.cores = exports.cleanString = exports.checkWebsite = exports.getAppleModel = void 0;
exports.getPlatformFlagsFromOptions = exports.getPlatformFlags = exports.WINDIR = exports.mathMin = exports.execOptsWin = exports.execOptsLinux = exports.unique = void 0;
exports.execSafe = execSafe;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
// Keep only imports needed for the file's internal logic
const get_codepage_1 = require("./get-codepage");
const powershell_1 = require("./powershell");
const promise_1 = require("./promise");
const smart_mon_tools_installed_1 = require("./smart-mon-tools-installed");
// Platform detection
let _platform = process.platform;
let _linux = false;
let _darwin = false;
let _windows = false;
let _freebsd = false;
let _openbsd = false;
let _netbsd = false;
let _sunos = false;
/**
 * Set platform for internal detection
 * @deprecated Use getPlatformFlags from './platform' instead
 */
function setPlatform(platform) {
    _platform = platform || process.platform;
    _linux = _platform === 'linux' || _platform === 'android';
    _darwin = _platform === 'darwin';
    _windows = _platform === 'win32';
    _freebsd = _platform === 'freebsd';
    _openbsd = _platform === 'openbsd';
    _netbsd = _platform === 'netbsd';
    _sunos = _platform === 'sunos';
}
// Initialize platform
setPlatform();
const WINDIR = process.env.WINDIR || 'C:\\Windows';
exports.WINDIR = WINDIR;
// powerShell
let _powerShell = '';
// Math utility
const mathMin = Math.min;
exports.mathMin = mathMin;
// Execution options
const execOptsWin = {
    windowsHide: true,
    maxBuffer: 1024 * 50_000,
    encoding: 'utf8',
    env: { ...process.env, LANG: 'en_US.UTF-8' },
};
exports.execOptsWin = execOptsWin;
const execOptsLinux = {
    maxBuffer: 1024 * 50_000,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
};
exports.execOptsLinux = execOptsLinux;
/**
 * Safe process execution with spawn
 */
function execSafe(cmd, args = [], options = {}) {
    let result = '';
    return new Promise((resolve) => {
        process.nextTick(() => {
            try {
                const child = (0, child_process_1.spawn)(cmd, args, options);
                if (child && !child.pid) {
                    child.on('error', function () {
                        resolve(result);
                    });
                }
                if (child && child.pid) {
                    child.stdout.on('data', function (data) {
                        result += data.toString();
                    });
                    child.on('close', function () {
                        child.kill();
                        resolve(result);
                    });
                    child.on('error', function () {
                        child.kill();
                        resolve(result);
                    });
                }
                else {
                    resolve(result);
                }
            }
            catch {
                resolve(result);
            }
        });
    });
}
// Override promiseAll to handle each command individually
const originalPromiseAll = promise_1.promiseAll;
// Get PowerShell path
_powerShell = (0, powershell_1.getPowerShellPath)();
// Initialize any functions that need dependencies
(0, get_codepage_1.init)(powershell_1.powerShell);
(0, smart_mon_tools_installed_1.init)(powershell_1.powerShell);
(0, powershell_1.init)(_powerShell);
// Direct re-exports
var apple_model_1 = require("../../mapping/apple-model");
Object.defineProperty(exports, "getAppleModel", { enumerable: true, get: function () { return tslib_1.__importDefault(apple_model_1).default; } });
var check_website_1 = require("./check-website");
Object.defineProperty(exports, "checkWebsite", { enumerable: true, get: function () { return tslib_1.__importDefault(check_website_1).default; } });
var clean_string_1 = require("./clean-string");
Object.defineProperty(exports, "cleanString", { enumerable: true, get: function () { return tslib_1.__importDefault(clean_string_1).default; } });
var cores_1 = require("./cores");
Object.defineProperty(exports, "cores", { enumerable: true, get: function () { return tslib_1.__importDefault(cores_1).default; } });
var count_lines_1 = require("./count-lines");
Object.defineProperty(exports, "countLines", { enumerable: true, get: function () { return tslib_1.__importDefault(count_lines_1).default; } });
var count_unique_lines_1 = require("./count-unique-lines");
Object.defineProperty(exports, "countUniqueLines", { enumerable: true, get: function () { return tslib_1.__importDefault(count_unique_lines_1).default; } });
var darwin_xcode_exists_1 = require("./darwin-xcode-exists");
Object.defineProperty(exports, "darwinXcodeExists", { enumerable: true, get: function () { return tslib_1.__importDefault(darwin_xcode_exists_1).default; } });
var decode_escape_sequence_1 = require("./decode-escape-sequence");
Object.defineProperty(exports, "decodeEscapeSequence", { enumerable: true, get: function () { return tslib_1.__importDefault(decode_escape_sequence_1).default; } });
var decode_pi_cpuinfo_1 = require("./decode-pi-cpuinfo");
Object.defineProperty(exports, "decodePiCpuinfo", { enumerable: true, get: function () { return tslib_1.__importDefault(decode_pi_cpuinfo_1).default; } });
var detect_split_1 = require("./detect-split");
Object.defineProperty(exports, "detectSplit", { enumerable: true, get: function () { return tslib_1.__importDefault(detect_split_1).default; } });
var exec_win_1 = require("./exec-win");
Object.defineProperty(exports, "execWin", { enumerable: true, get: function () { return tslib_1.__importDefault(exec_win_1).default; } });
var find_object_by_key_1 = require("./find-object-by-key");
Object.defineProperty(exports, "findObjectByKey", { enumerable: true, get: function () { return tslib_1.__importDefault(find_object_by_key_1).default; } });
var get_codepage_2 = require("./get-codepage");
Object.defineProperty(exports, "getCodepage", { enumerable: true, get: function () { return get_codepage_2.getCodepage; } });
var get_files_in_path_1 = require("./get-files-in-path");
Object.defineProperty(exports, "getFilesInPath", { enumerable: true, get: function () { return tslib_1.__importDefault(get_files_in_path_1).default; } });
var get_powershell_1 = require("./get-powershell");
Object.defineProperty(exports, "getPowershell", { enumerable: true, get: function () { return tslib_1.__importDefault(get_powershell_1).default; } });
var get_rpi_gpu_1 = require("./get-rpi-gpu");
Object.defineProperty(exports, "getRpiGpu", { enumerable: true, get: function () { return tslib_1.__importDefault(get_rpi_gpu_1).default; } });
var get_value_1 = require("./get-value");
Object.defineProperty(exports, "getValue", { enumerable: true, get: function () { return tslib_1.__importDefault(get_value_1).default; } });
var get_vboxmanage_1 = require("./get-vboxmanage");
Object.defineProperty(exports, "getVboxmanage", { enumerable: true, get: function () { return tslib_1.__importDefault(get_vboxmanage_1).default; } });
var get_wmic_1 = require("./get-wmic");
Object.defineProperty(exports, "getWmic", { enumerable: true, get: function () { return tslib_1.__importDefault(get_wmic_1).default; } });
var hex2bin_1 = require("./hex2bin");
Object.defineProperty(exports, "hex2bin", { enumerable: true, get: function () { return tslib_1.__importDefault(hex2bin_1).default; } });
var is_function_1 = require("./is-function");
Object.defineProperty(exports, "isFunction", { enumerable: true, get: function () { return tslib_1.__importDefault(is_function_1).default; } });
var is_prototype_polluted_1 = require("./is-prototype-polluted");
Object.defineProperty(exports, "isPrototypePolluted", { enumerable: true, get: function () { return tslib_1.__importDefault(is_prototype_polluted_1).default; } });
var is_raspberry_1 = require("./is-raspberry");
Object.defineProperty(exports, "isRaspberry", { enumerable: true, get: function () { return tslib_1.__importDefault(is_raspberry_1).default; } });
var is_raspbian_1 = require("./is-raspbian");
Object.defineProperty(exports, "isRaspbian", { enumerable: true, get: function () { return tslib_1.__importDefault(is_raspbian_1).default; } });
var linux_version_1 = require("./linux-version");
Object.defineProperty(exports, "linuxVersion", { enumerable: true, get: function () { return tslib_1.__importDefault(linux_version_1).default; } });
var nano_seconds_1 = require("./nano-seconds");
Object.defineProperty(exports, "nanoSeconds", { enumerable: true, get: function () { return tslib_1.__importDefault(nano_seconds_1).default; } });
var noop_1 = require("./noop");
Object.defineProperty(exports, "noop", { enumerable: true, get: function () { return tslib_1.__importDefault(noop_1).default; } });
var parse_date_time_1 = require("./parse-date-time");
Object.defineProperty(exports, "parseDateTime", { enumerable: true, get: function () { return tslib_1.__importDefault(parse_date_time_1).default; } });
var parse_head_1 = require("./parse-head");
Object.defineProperty(exports, "parseHead", { enumerable: true, get: function () { return tslib_1.__importDefault(parse_head_1).default; } });
var parse_time_1 = require("./parse-time");
Object.defineProperty(exports, "parseTime", { enumerable: true, get: function () { return tslib_1.__importDefault(parse_time_1).default; } });
var plist_parser_1 = require("./plist-parser");
Object.defineProperty(exports, "plistParser", { enumerable: true, get: function () { return plist_parser_1.plistParser; } });
Object.defineProperty(exports, "plistReader", { enumerable: true, get: function () { return plist_parser_1.plistReader; } });
Object.defineProperty(exports, "strIsNumeric", { enumerable: true, get: function () { return plist_parser_1.strIsNumeric; } });
// PowerShell exports
var powershell_2 = require("./powershell");
Object.defineProperty(exports, "executeScript", { enumerable: true, get: function () { return powershell_2.executeScript; } });
var powershell_3 = require("./powershell");
Object.defineProperty(exports, "getPowerShellPath", { enumerable: true, get: function () { return powershell_3.getPowerShellPath; } });
var powershell_4 = require("./powershell");
Object.defineProperty(exports, "powerShell", { enumerable: true, get: function () { return powershell_4.powerShell; } });
var powershell_5 = require("./powershell");
Object.defineProperty(exports, "powerShellRelease", { enumerable: true, get: function () { return powershell_5.powerShellRelease; } });
var powershell_6 = require("./powershell");
Object.defineProperty(exports, "powerShellStart", { enumerable: true, get: function () { return powershell_6.powerShellStart; } });
var powershell_7 = require("./powershell");
Object.defineProperty(exports, "powerShellWinRMBatch", { enumerable: true, get: function () { return powershell_7.powerShellWinRMBatch; } });
var powershell_8 = require("./powershell");
Object.defineProperty(exports, "powerShellWinRMSingleShell", { enumerable: true, get: function () { return powershell_8.powerShellWinRMSingleShell; } });
var powershell_9 = require("./powershell");
Object.defineProperty(exports, "powerShellWinRMWorkload", { enumerable: true, get: function () { return powershell_9.powerShellWinRMWorkload; } });
var promise_2 = require("./promise");
Object.defineProperty(exports, "promiseAll", { enumerable: true, get: function () { return promise_2.promiseAll; } });
Object.defineProperty(exports, "promisify", { enumerable: true, get: function () { return promise_2.promisify; } });
Object.defineProperty(exports, "promisifySave", { enumerable: true, get: function () { return promise_2.promisifySave; } });
var sanitize_shell_string_1 = require("./sanitize-shell-string");
Object.defineProperty(exports, "sanitizeShellString", { enumerable: true, get: function () { return tslib_1.__importDefault(sanitize_shell_string_1).default; } });
var semver_compare_1 = require("./semver-compare");
Object.defineProperty(exports, "semverCompare", { enumerable: true, get: function () { return tslib_1.__importDefault(semver_compare_1).default; } });
var smart_mon_tools_installed_2 = require("./smart-mon-tools-installed");
Object.defineProperty(exports, "smartMonToolsInstalled", { enumerable: true, get: function () { return smart_mon_tools_installed_2.smartMonToolsInstalled; } });
var sort_by_key_1 = require("./sort-by-key");
Object.defineProperty(exports, "sortByKey", { enumerable: true, get: function () { return tslib_1.__importDefault(sort_by_key_1).default; } });
var split_by_number_1 = require("./split-by-number");
Object.defineProperty(exports, "splitByNumber", { enumerable: true, get: function () { return tslib_1.__importDefault(split_by_number_1).default; } });
var to_int_1 = require("./to-int");
Object.defineProperty(exports, "toInt", { enumerable: true, get: function () { return tslib_1.__importDefault(to_int_1).default; } });
var unique_1 = require("./unique");
Object.defineProperty(exports, "unique", { enumerable: true, get: function () { return tslib_1.__importDefault(unique_1).default; } });
// Export platform utilities
var platform_1 = require("./platform");
Object.defineProperty(exports, "getPlatformFlags", { enumerable: true, get: function () { return platform_1.getPlatformFlags; } });
Object.defineProperty(exports, "getPlatformFlagsFromOptions", { enumerable: true, get: function () { return platform_1.getPlatformFlagsFromOptions; } });
