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

import { exec, execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import path from 'path';

// Keep only imports needed for the file's internal logic
import { getCodepage, init as getCodepageInit } from './get-codepage';
import { getPlatformFlags, getPlatformFlagsFromOptions } from './platform';
import { getPowerShellPath, init as powerShellInit, powerShell } from './powershell';
import { promiseAll } from './promise';
import { init as smartMonToolsInit } from './smart-mon-tools-installed';

// Platform detection
let _platform: string = process.platform;
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
function setPlatform(platform?: string): void {
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

const WINDIR: string = process.env.WINDIR || 'C:\\Windows';

// powerShell
let _powerShell = '';

// Math utility
const mathMin = Math.min;

// Execution options
const execOptsWin = {
  windowsHide: true,
  maxBuffer: 1024 * 50_000,
  encoding: 'utf8' as BufferEncoding,
  env: { ...process.env, LANG: 'en_US.UTF-8' },
};

const execOptsLinux = {
  maxBuffer: 1024 * 50_000,
  encoding: 'utf8' as BufferEncoding,
  stdio: ['pipe', 'pipe', 'ignore'] as Array<'pipe' | 'ignore'>,
};

/**
 * Safe process execution with spawn
 */
function execSafe(cmd: string, args: string[] = [], options: any = {}): Promise<string> {
  let result = '';

  return new Promise((resolve) => {
    process.nextTick(() => {
      try {
        const child = spawn(cmd, args, options);

        if (child && !child.pid) {
          child.on('error', function () {
            resolve(result);
          });
        }

        if (child && child.pid) {
          child.stdout.on('data', function (data: Buffer) {
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
        } else {
          resolve(result);
        }
      } catch {
        resolve(result);
      }
    });
  });
}

// Override promiseAll to handle each command individually
const originalPromiseAll = promiseAll;

// Get PowerShell path
_powerShell = getPowerShellPath();

// Initialize any functions that need dependencies
getCodepageInit(powerShell);
smartMonToolsInit(powerShell);
powerShellInit(_powerShell);

// Direct re-exports
export { default as getAppleModel } from '../../mapping/apple-model';
export { default as checkWebsite } from './check-website';
export { default as cleanString } from './clean-string';
export { default as cores } from './cores';
export { default as countLines } from './count-lines';
export { default as countUniqueLines } from './count-unique-lines';
export { default as darwinXcodeExists } from './darwin-xcode-exists';
export { default as decodeEscapeSequence } from './decode-escape-sequence';
export { default as decodePiCpuinfo } from './decode-pi-cpuinfo';
export { default as detectSplit } from './detect-split';
export { default as execWin } from './exec-win';
export { default as findObjectByKey } from './find-object-by-key';
export { getCodepage } from './get-codepage';
export { default as getFilesInPath } from './get-files-in-path';
export { default as getPowershell } from './get-powershell';
export { default as getRpiGpu } from './get-rpi-gpu';
export { default as getValue } from './get-value';
export { default as getVboxmanage } from './get-vboxmanage';
export { default as getWmic } from './get-wmic';
export { default as hex2bin } from './hex2bin';
export { default as isFunction } from './is-function';
export { default as isPrototypePolluted } from './is-prototype-polluted';
export { default as isRaspberry } from './is-raspberry';
export { default as isRaspbian } from './is-raspbian';
export { default as linuxVersion } from './linux-version';
export { default as nanoSeconds } from './nano-seconds';
export { default as noop } from './noop';
export { default as parseDateTime } from './parse-date-time';
export { default as parseHead } from './parse-head';
export { default as parseTime } from './parse-time';
export { plistParser, plistReader, strIsNumeric } from './plist-parser';

// PowerShell exports
export { executeScript } from './powershell';
export { getPowerShellPath } from './powershell';
export { powerShell } from './powershell';
export { powerShellRelease } from './powershell';
export { powerShellStart } from './powershell';
export { powerShellWinRMBatch } from './powershell';
export { powerShellWinRMSingleShell } from './powershell';
export { powerShellWinRMWorkload } from './powershell';
export { promiseAll, promisify, promisifySave } from './promise';
export { default as sanitizeShellString } from './sanitize-shell-string';
export { default as semverCompare } from './semver-compare';
export { smartMonToolsInstalled } from './smart-mon-tools-installed';
export { default as sortByKey } from './sort-by-key';
export { default as splitByNumber } from './split-by-number';
export { default as toInt } from './to-int';
export { default as unique } from './unique';

// Local exports
export { execOptsLinux, execOptsWin, execSafe, mathMin, WINDIR };

// Export platform utilities
export { getPlatformFlags, getPlatformFlagsFromOptions } from './platform';
