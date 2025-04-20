declare const WINDIR: string;
declare const mathMin: (...values: number[]) => number;
declare const execOptsWin: {
    windowsHide: boolean;
    maxBuffer: number;
    encoding: BufferEncoding;
    env: {
        LANG: string;
        TZ?: string;
    };
};
declare const execOptsLinux: {
    maxBuffer: number;
    encoding: BufferEncoding;
    stdio: Array<"pipe" | "ignore">;
};
/**
 * Safe process execution with spawn
 */
declare function execSafe(cmd: string, args?: string[], options?: any): Promise<string>;
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
export { execOptsLinux, execOptsWin, execSafe, mathMin, WINDIR };
export { getPlatformFlags, getPlatformFlagsFromOptions } from './platform';
//# sourceMappingURL=index.d.ts.map