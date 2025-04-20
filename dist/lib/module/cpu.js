import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import { AMDBaseFrequencies } from '../../mapping/amd-base-frequencies';
import { socketTypes } from '../../mapping/socket-types';
import { socketTypesByName } from '../../mapping/socket-types-by-name';
import * as util from '../util';
import { getPlatformFlagsFromOptions } from '../util/platform';
// Module variables
const _cpus = [];
/**
 * Get socket type by name
 * @param str CPU name/model string
 * @returns Socket type
 */
function getSocketTypesByName(str) {
    let result = '';
    for (const key of Object.keys(socketTypesByName)) {
        const names = socketTypesByName[key].split(' ');
        for (const element of names) {
            if (str.includes(element)) {
                result = key;
            }
        }
    }
    return result;
}
/**
 * Determine CPU manufacturer from string
 * @param str CPU info string
 * @returns Normalized manufacturer name
 */
function cpuManufacturer(str) {
    let result = str;
    str = str.toLowerCase();
    if (str.includes('intel')) {
        result = 'Intel';
    }
    if (str.includes('amd')) {
        result = 'AMD';
    }
    if (str.includes('qemu')) {
        result = 'QEMU';
    }
    if (str.includes('hygon')) {
        result = 'Hygon';
    }
    if (str.includes('centaur')) {
        result = 'WinChip/Via';
    }
    if (str.includes('vmware')) {
        result = 'VMware';
    }
    if (str.includes('xen')) {
        result = 'Xen Hypervisor';
    }
    if (str.includes('tcg')) {
        result = 'QEMU';
    }
    if (str.includes('apple')) {
        result = 'Apple';
    }
    if (str.includes('sifive')) {
        result = 'SiFive';
    }
    if (str.includes('thead')) {
        result = 'T-Head';
    }
    if (str.includes('andestech')) {
        result = 'Andes Technology';
    }
    return result;
}
/**
 * Process CPU brand and manufacturer information
 * @param res CPU information object
 * @returns Processed CPU information
 */
function cpuBrandManufacturer(res) {
    res.brand = res.brand
        .replaceAll(/\(R\)+/g, '®')
        .replaceAll(/\s+/g, ' ')
        .trim();
    res.brand = res.brand
        .replaceAll(/\(TM\)+/g, '™')
        .replaceAll(/\s+/g, ' ')
        .trim();
    res.brand = res.brand
        .replaceAll(/\(C\)+/g, '©')
        .replaceAll(/\s+/g, ' ')
        .trim();
    res.brand = res.brand.replaceAll(/CPU+/g, '').replaceAll(/\s+/g, ' ').trim();
    res.manufacturer = cpuManufacturer(res.brand);
    const parts = res.brand.split(' ');
    parts.shift();
    res.brand = parts.join(' ');
    return res;
}
/**
 * Get AMD CPU base frequency based on model
 * @param brand CPU brand string
 * @returns Base frequency in GHz
 */
function getAMDSpeed(brand) {
    let result = '0';
    for (const key in AMDBaseFrequencies) {
        if (Object.prototype.hasOwnProperty.call(AMDBaseFrequencies, key)) {
            const parts = key.split('|');
            let found = 0;
            for (const item of parts) {
                if (brand.includes(item)) {
                    found++;
                }
            }
            if (found === parts.length) {
                result = AMDBaseFrequencies[key];
            }
        }
    }
    return Number.parseFloat(result);
}
/**
 * Get current CPU speed in GHz
 * @returns CPU speed information
 */
function getCpuCurrentSpeedSync(options) {
    const { _linux } = getPlatformFlagsFromOptions(options);
    const cpus = os.cpus();
    let minFreq = 999_999_999;
    let maxFreq = 0;
    let avgFreq = 0;
    const cores = [];
    const speeds = [];
    if (cpus && cpus.length > 0 && cpus[0].speed) {
        for (const element of cpus) {
            speeds.push(element.speed > 100 ? (element.speed + 1) / 1000 : element.speed / 10);
        }
    }
    else if (_linux) {
        try {
            const speedStrings = execSync('cat /proc/cpuinfo | grep "cpu MHz" | cut -d " " -f 3', util.execOptsLinux)
                .toString()
                .split('\n')
                .filter((line) => line.length > 0);
            for (const speedString of speedStrings) {
                speeds.push(Math.floor(Number.parseInt(speedString, 10) / 10) / 100);
            }
        }
        catch {
            util.noop();
        }
    }
    if (speeds && speeds.length > 0) {
        for (const speed of speeds) {
            avgFreq = avgFreq + speed;
            if (speed > maxFreq) {
                maxFreq = speed;
            }
            if (speed < minFreq) {
                minFreq = speed;
            }
            cores.push(Number.parseFloat(speed.toFixed(2)));
        }
        avgFreq = avgFreq / speeds.length;
        return {
            min: Number.parseFloat(minFreq.toFixed(2)),
            max: Number.parseFloat(maxFreq.toFixed(2)),
            avg: Number.parseFloat(avgFreq.toFixed(2)),
            cores,
        };
    }
    return {
        min: 0,
        max: 0,
        avg: 0,
        cores,
    };
}
/**
 * Get CPU flags
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to CPU flags as string
 */
export function cpuFlags(options = {}, callback) {
    const { _windows, _linux, _darwin, _freebsd, _openbsd, _netbsd, _sunos } = getPlatformFlagsFromOptions(options);
    return new Promise((resolve) => {
        process.nextTick(() => {
            let result = '';
            if (_windows) {
                try {
                    util
                        .powerShell('reg query "HKEY_LOCAL_MACHINE\\HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0" /v FeatureSet', options)
                        .then((stdout) => {
                        const stdoutStr = Array.isArray(stdout) ? stdout.join('') : stdout;
                        const flag_hex = stdoutStr.split('0x').pop()?.trim() || '';
                        const flag_bin_unpadded = Number.parseInt(flag_hex, 16).toString(2);
                        const flag_bin = '0'.repeat(32 - flag_bin_unpadded.length) + flag_bin_unpadded;
                        // empty flags are the reserved fields in the CPUID feature bit list
                        // as found on wikipedia:
                        // https://en.wikipedia.org/wiki/CPUID
                        const all_flags = [
                            'fpu',
                            'vme',
                            'de',
                            'pse',
                            'tsc',
                            'msr',
                            'pae',
                            'mce',
                            'cx8',
                            'apic',
                            '',
                            'sep',
                            'mtrr',
                            'pge',
                            'mca',
                            'cmov',
                            'pat',
                            'pse-36',
                            'psn',
                            'clfsh',
                            '',
                            'ds',
                            'acpi',
                            'mmx',
                            'fxsr',
                            'sse',
                            'sse2',
                            'ss',
                            'htt',
                            'tm',
                            'ia64',
                            'pbe',
                        ];
                        for (const [f, all_flag] of all_flags.entries()) {
                            if (flag_bin[f] === '1' && all_flag !== '') {
                                result += ' ' + all_flag;
                            }
                        }
                        result = result.trim().toLowerCase();
                        if (callback) {
                            callback(result);
                        }
                        resolve(result);
                    });
                }
                catch {
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                }
            }
            if (_linux) {
                try {
                    exec('export LC_ALL=C; lscpu; unset LC_ALL', function (error, stdout) {
                        if (!error) {
                            const lines = stdout.toString().split('\n');
                            for (const line of lines) {
                                if (line.split(':')[0].toUpperCase().includes('FLAGS')) {
                                    result = line.split(':')[1].trim().toLowerCase();
                                }
                            }
                        }
                        if (result) {
                            if (callback) {
                                callback(result);
                            }
                            resolve(result);
                        }
                        else {
                            fs.readFile('/proc/cpuinfo', function (error, stdout) {
                                if (!error) {
                                    const lines = stdout.toString().split('\n');
                                    result = util.getValue(lines, 'features', ':', true).toLowerCase();
                                }
                                if (callback) {
                                    callback(result);
                                }
                                resolve(result);
                            });
                        }
                    });
                }
                catch {
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                }
            }
            // Handle other platforms (macOS, BSD, etc.)
            if (_darwin || _freebsd || _openbsd || _netbsd || _sunos) {
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
        });
    });
}
/**
 * Get CPU temperature if sensors are installed
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to CPU temperature information
 */
export function cpuTemperature(options = {}, callback) {
    const { _linux } = getPlatformFlagsFromOptions(options);
    return new Promise((resolve) => {
        process.nextTick(() => {
            const result = {
                main: null,
                cores: [],
                max: null,
                socket: [],
                chipset: null,
            };
            if (_linux) {
                // CPU Chipset, Socket
                try {
                    const cmd = 'cat /sys/class/thermal/thermal_zone*/type  2>/dev/null; echo "-----"; cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null;';
                    const parts = execSync(cmd, util.execOptsLinux).toString().split('-----\n');
                    if (parts.length === 2) {
                        const lines = parts[0].split('\n');
                        const lines2 = parts[1].split('\n');
                        for (const [i, line_] of lines.entries()) {
                            const line = line_.trim();
                            if (line.startsWith('acpi') && i < lines2.length) {
                                result.socket.push(Math.round(Number.parseInt(lines2[i], 10) / 100) / 10);
                            }
                            if (line.startsWith('pch') && i < lines2.length) {
                                result.chipset = Math.round(Number.parseInt(lines2[i], 10) / 100) / 10;
                            }
                        }
                    }
                }
                catch {
                    util.noop();
                }
                /* eslint-disable no-template-curly-in-string */
                const cmd = 'for mon in /sys/class/hwmon/hwmon*; do for label in "$mon"/temp*_label; do if [ -f $label ]; then value=${label%_*}_input; echo $(cat "$label")___$(cat "$value"); fi; done; done;';
                /* eslint-enable no-template-curly-in-string */
                try {
                    exec(cmd, function (error, stdout) {
                        const stdoutStr = stdout.toString();
                        const tdiePos = stdoutStr.toLowerCase().indexOf('tdie');
                        if (tdiePos !== -1) {
                            stdout = Buffer.from(stdoutStr.slice(Math.max(0, tdiePos))).toString();
                        }
                        const lines = stdout.toString().split('\n');
                        let tctl = 0;
                        for (const line of lines) {
                            const parts = line.split('___');
                            const label = parts[0];
                            const value = parts.length > 1 && parts[1] ? parts[1] : '0';
                            if (value && label && label.toLowerCase() === 'tctl') {
                                tctl = Math.round(Number.parseInt(value, 10) / 100) / 10;
                                result.main = tctl;
                            }
                            if (value &&
                                (label === undefined || (label && label.toLowerCase().startsWith('core')))) {
                                result.cores.push(Math.round(Number.parseInt(value, 10) / 100) / 10);
                            }
                            else if (value &&
                                label &&
                                result.main === null &&
                                (label.toLowerCase().includes('package') ||
                                    label.toLowerCase().includes('physical') ||
                                    label.toLowerCase() === 'tccd1')) {
                                result.main = Math.round(Number.parseInt(value, 10) / 100) / 10;
                            }
                        }
                        if (tctl && result.main === null) {
                            result.main = tctl;
                        }
                        if (result.cores.length > 0) {
                            if (result.main === null) {
                                result.main = Math.round(result.cores.reduce((a, b) => a + b, 0) / result.cores.length);
                            }
                            const maxtmp = Math.max(...result.cores);
                            result.max = maxtmp > (result.main || 0) ? maxtmp : result.main;
                        }
                        if (result.main !== null) {
                            if (result.max === null) {
                                result.max = result.main;
                            }
                            if (callback) {
                                callback(result);
                            }
                            resolve(result);
                            return;
                        }
                        // Continue with sensors command if direct readings weren't available
                        // This part will be added in the next edit...
                        if (callback) {
                            callback(result);
                        }
                        resolve(result);
                    });
                }
                catch {
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                }
            }
            else {
                // Other platforms will be handled in subsequent edits
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
        });
    });
}
/**
 * Parse Windows cache information
 */
function parseWinCache(linesProc, linesCache) {
    const result = {
        l1d: null,
        l1i: null,
        l2: null,
        l3: null,
    };
    // Win32_processor
    const lines = linesProc.split('\r\n');
    result.l1d = 0;
    result.l1i = 0;
    const l2cachesize = util.getValue(lines, 'l2cachesize', ':');
    result.l2 = l2cachesize ? Number.parseInt(l2cachesize, 10) * 1024 : 0;
    const l3cachesize = util.getValue(lines, 'l3cachesize', ':');
    result.l3 = l3cachesize ? Number.parseInt(l3cachesize, 10) * 1024 : 0;
    // Win32_CacheMemory
    const parts = linesCache.split(/\n\s*\n/);
    let l1i = 0;
    let l1d = 0;
    let l2 = 0;
    for (const part of parts) {
        const lines = part.split('\r\n');
        const cacheType = util.getValue(lines, 'CacheType');
        const level = util.getValue(lines, 'Level');
        const installedSize = util.getValue(lines, 'InstalledSize');
        // L1 Instructions
        if (level === '3' && cacheType === '3') {
            result.l1i = (result.l1i || 0) + Number.parseInt(installedSize, 10) * 1024;
        }
        // L1 Data
        if (level === '3' && cacheType === '4') {
            result.l1d = (result.l1d || 0) + Number.parseInt(installedSize, 10) * 1024;
        }
        // L1 all
        if (level === '3' && cacheType === '5') {
            l1i = Number.parseInt(installedSize, 10) / 2;
            l1d = Number.parseInt(installedSize, 10) / 2;
        }
        // L2
        if (level === '4' && cacheType === '5') {
            l2 = l2 + Number.parseInt(installedSize, 10) * 1024;
        }
    }
    if (result.l1i === 0 && result.l1d === 0) {
        result.l1i = l1i;
        result.l1d = l1d;
    }
    if (l2) {
        result.l2 = l2;
    }
    return result;
}
/**
 * Get CPU cache information
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to CPU cache information
 */
export function cpuCache(options = {}, callback) {
    const { _windows, _linux, _darwin, _freebsd, _openbsd, _netbsd, _sunos } = getPlatformFlagsFromOptions(options);
    return new Promise((resolve) => {
        process.nextTick(() => {
            const result = {
                l1d: null,
                l1i: null,
                l2: null,
                l3: null,
            };
            // Platform-specific implementations
            // (simplified for brevity - would need to implement all platform-specific code)
            if (_linux) {
                try {
                    exec('export LC_ALL=C; lscpu; unset LC_ALL', function (error, stdout) {
                        if (!error) {
                            const lines = stdout.toString().split('\n');
                            for (const line of lines) {
                                const parts = line.split(':');
                                if (parts[0].toUpperCase().includes('L1D CACHE')) {
                                    const size = parts[1].trim();
                                    result.l1d =
                                        Number.parseInt(size, 10) *
                                            (size.includes('M') ? 1024 * 1024 : size.includes('K') ? 1024 : 1);
                                }
                                if (parts[0].toUpperCase().includes('L1I CACHE')) {
                                    const size = parts[1].trim();
                                    result.l1i =
                                        Number.parseInt(size, 10) *
                                            (size.includes('M') ? 1024 * 1024 : size.includes('K') ? 1024 : 1);
                                }
                                if (parts[0].toUpperCase().includes('L2 CACHE')) {
                                    const size = parts[1].trim();
                                    result.l2 =
                                        Number.parseInt(size, 10) *
                                            (size.includes('M') ? 1024 * 1024 : size.includes('K') ? 1024 : 1);
                                }
                                if (parts[0].toUpperCase().includes('L3 CACHE')) {
                                    const size = parts[1].trim();
                                    result.l3 =
                                        Number.parseInt(size, 10) *
                                            (size.includes('M') ? 1024 * 1024 : size.includes('K') ? 1024 : 1);
                                }
                            }
                        }
                        if (callback) {
                            callback(result);
                        }
                        resolve(result);
                    });
                }
                catch {
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                }
            }
            else if (_windows) {
                try {
                    const workload = [
                        util.powerShell('Get-CimInstance Win32_processor | select L2CacheSize, L3CacheSize | fl', options),
                        util.powerShell('Get-CimInstance Win32_CacheMemory | select CacheType,InstalledSize,Level | fl', options),
                    ];
                    Promise.all(workload).then((data) => {
                        const dataStr = Array.isArray(data[0]) ? data[0].join('\r\n') : data[0];
                        const lines = dataStr.split('\r\n');
                        const linesCache = Array.isArray(data[1]) ? data[1].join('\n') : data[1];
                        const parsedCache = parseWinCache(dataStr, linesCache);
                        result.l1d = parsedCache.l1d;
                        result.l1i = parsedCache.l1i;
                        result.l2 = parsedCache.l2;
                        result.l3 = parsedCache.l3;
                        if (callback) {
                            callback(result);
                        }
                        resolve(result);
                    });
                }
                catch {
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                }
            }
            else {
                // Handle other platforms
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
        });
    });
}
/**
 * Get CPU information
 * @param options Options
 * @returns Promise resolving to CPU information
 */
function getCpu(options = {}) {
    const { _windows, _linux, _darwin, _freebsd, _openbsd, _netbsd, _sunos } = getPlatformFlagsFromOptions(options);
    return new Promise((resolve) => {
        process.nextTick(async () => {
            const UNKNOWN = 'unknown';
            let result = {
                manufacturer: UNKNOWN,
                brand: UNKNOWN,
                vendor: '',
                family: '',
                model: '',
                stepping: '',
                revision: '',
                voltage: '',
                speed: 0,
                speedMin: 0,
                speedMax: 0,
                governor: '',
                cores: util.cores(),
                physicalCores: util.cores(),
                performanceCores: util.cores(),
                efficiencyCores: 0,
                processors: 1,
                socket: '',
                flags: '',
                virtualization: false,
                cache: {
                    l1d: null,
                    l1i: null,
                    l2: null,
                    l3: null,
                },
            };
            const temperature = await cpuTemperature(options);
            result.temperature = temperature;
            const flags = await cpuFlags(options);
            result.flags = flags;
            result.virtualization = flags.includes('vmx') || flags.includes('svm');
            if (_darwin) {
                exec('sysctl machdep.cpu hw.cpufrequency_max hw.cpufrequency_min hw.packages hw.physicalcpu_max hw.ncpu hw.tbfrequency hw.cpufamily hw.cpusubfamily', function (error, stdout) {
                    const lines = stdout.toString().split('\n');
                    const modelline = util.getValue(lines, 'machdep.cpu.brand_string');
                    const modellineParts = modelline.split('@');
                    result.brand = modellineParts[0].trim();
                    const speed = modellineParts[1] ? modellineParts[1].trim() : '0';
                    result.speed = Number.parseFloat(speed.replaceAll(/GHz+/g, ''));
                    let tbFrequency = Number(util.getValue(lines, 'hw.tbfrequency')) / 1_000_000_000;
                    tbFrequency = tbFrequency < 0.1 ? tbFrequency * 100 : tbFrequency;
                    result.speed = result.speed === 0 ? tbFrequency : result.speed;
                    result = { ...result, ...cpuBrandManufacturer(result) };
                    const cpuFreqMin = util.getValue(lines, 'hw.cpufrequency_min');
                    result.speedMin = cpuFreqMin ? Number(cpuFreqMin) / 1_000_000_000 : result.speed;
                    const cpuFreqMax = util.getValue(lines, 'hw.cpufrequency_max');
                    result.speedMax = cpuFreqMax ? Number(cpuFreqMax) / 1_000_000_000 : result.speed;
                    result.vendor = util.getValue(lines, 'machdep.cpu.vendor') || 'Apple';
                    result.family =
                        util.getValue(lines, 'machdep.cpu.family') || util.getValue(lines, 'hw.cpufamily');
                    result.model = util.getValue(lines, 'machdep.cpu.model');
                    result.stepping =
                        util.getValue(lines, 'machdep.cpu.stepping') ||
                            util.getValue(lines, 'hw.cpusubfamily');
                    result.virtualization = true;
                    const countProcessors = util.getValue(lines, 'hw.packages');
                    const countCores = util.getValue(lines, 'hw.physicalcpu_max');
                    const countThreads = util.getValue(lines, 'hw.ncpu');
                    if (os.arch() === 'arm64') {
                        result.socket = 'SOC';
                        try {
                            const clusters = execSync('ioreg -c IOPlatformDevice -d 3 -r | grep cluster-type')
                                .toString()
                                .split('\n');
                            const efficiencyCores = clusters.filter((line) => line.includes('"E"')).length;
                            const performanceCores = clusters.filter((line) => line.includes('"P"')).length;
                            result.efficiencyCores = efficiencyCores;
                            result.performanceCores = performanceCores;
                        }
                        catch {
                            util.noop();
                        }
                    }
                    if (countProcessors) {
                        result.processors = Number.parseInt(countProcessors, 10) || 1;
                    }
                    if (countCores && countThreads) {
                        result.cores = Number.parseInt(countThreads, 10) || util.cores();
                        result.physicalCores = Number.parseInt(countCores, 10) || util.cores();
                    }
                    cpuCache(options).then((res) => {
                        result.cache = res;
                        resolve(result);
                    });
                });
            }
            if (_linux) {
                let modelline = '';
                let lines = [];
                if (os.cpus()[0] && os.cpus()[0].model) {
                    modelline = os.cpus()[0].model;
                }
                exec('export LC_ALL=C; lscpu; echo -n "Governor: "; cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor 2>/dev/null; echo; unset LC_ALL', function (error, stdout) {
                    if (!error) {
                        lines = stdout.toString().split('\n');
                    }
                    modelline = util.getValue(lines, 'model name') || modelline;
                    modelline = util.getValue(lines, 'bios model name') || modelline;
                    modelline = util.cleanString(modelline);
                    const modellineParts = modelline.split('@');
                    result.brand = modellineParts[0].trim();
                    result.speed = modellineParts[1] ? Number.parseFloat(modellineParts[1].trim()) : 0;
                    if (result.speed === 0 &&
                        (result.brand.includes('AMD') || result.brand.toLowerCase().includes('ryzen'))) {
                        result.speed = getAMDSpeed(result.brand);
                    }
                    if (result.speed === 0) {
                        const current = getCpuCurrentSpeedSync(options);
                        if (current.avg !== 0) {
                            result.speed = current.avg;
                        }
                    }
                    result.speedMin =
                        Math.round(Number.parseFloat(util.getValue(lines, 'cpu min mhz').replaceAll(',', '.')) / 10) / 100;
                    result.speedMax =
                        Math.round(Number.parseFloat(util.getValue(lines, 'cpu max mhz').replaceAll(',', '.')) / 10) / 100;
                    result = { ...result, ...cpuBrandManufacturer(result) };
                    result.vendor = cpuManufacturer(util.getValue(lines, 'vendor id'));
                    result.family = util.getValue(lines, 'cpu family');
                    result.model = util.getValue(lines, 'model:');
                    result.stepping = util.getValue(lines, 'stepping');
                    result.revision = util.getValue(lines, 'cpu revision');
                    const cacheL1d = util.getValue(lines, 'l1d cache');
                    if (cacheL1d) {
                        result.cache.l1d =
                            Number.parseInt(cacheL1d, 10) *
                                (cacheL1d.includes('M') ? 1024 * 1024 : cacheL1d.includes('K') ? 1024 : 1);
                    }
                    const cacheL1i = util.getValue(lines, 'l1i cache');
                    if (cacheL1i) {
                        result.cache.l1i =
                            Number.parseInt(cacheL1i, 10) *
                                (cacheL1i.includes('M') ? 1024 * 1024 : cacheL1i.includes('K') ? 1024 : 1);
                    }
                    const cacheL2 = util.getValue(lines, 'l2 cache');
                    if (cacheL2) {
                        result.cache.l2 =
                            Number.parseInt(cacheL2, 10) *
                                (cacheL2.includes('M') ? 1024 * 1024 : cacheL2.includes('K') ? 1024 : 1);
                    }
                    const cacheL3 = util.getValue(lines, 'l3 cache');
                    if (cacheL3) {
                        result.cache.l3 =
                            Number.parseInt(cacheL3, 10) *
                                (cacheL3.includes('M') ? 1024 * 1024 : cacheL3.includes('K') ? 1024 : 1);
                    }
                    const threadsPerCore = util.getValue(lines, 'thread(s) per core') || '1';
                    const processors = util.getValue(lines, 'socket(s)') || '1';
                    const threadsPerCoreInt = Number.parseInt(threadsPerCore, 10); // threads per code (normally only for performance cores)
                    const processorsInt = Number.parseInt(processors, 10) || 1; // number of sockets /  processor units in machine (normally 1)
                    const coresPerSocket = Number.parseInt(util.getValue(lines, 'core(s) per socket'), 10); // number of cores (e.g. 16 on i12900)
                    result.physicalCores = coresPerSocket
                        ? coresPerSocket * processorsInt
                        : result.cores / threadsPerCoreInt;
                    result.performanceCores =
                        threadsPerCoreInt > 1 ? result.cores - result.physicalCores : result.cores;
                    result.efficiencyCores =
                        threadsPerCoreInt > 1
                            ? result.cores - threadsPerCoreInt * result.performanceCores
                            : 0;
                    result.processors = processorsInt;
                    result.governor = util.getValue(lines, 'governor') || '';
                    // Test Raspberry
                    if (result.vendor === 'ARM' && util.isRaspberry()) {
                        const rPIRevision = util.decodePiCpuinfo();
                        result.family = result.manufacturer;
                        result.manufacturer = rPIRevision.manufacturer;
                        result.brand = rPIRevision.processor;
                        result.revision = rPIRevision.revisionCode;
                        result.socket = 'SOC';
                    }
                    // Test RISC-V
                    if (util.getValue(lines, 'architecture') === 'riscv64') {
                        const linesRiscV = fs.readFileSync('/proc/cpuinfo').toString().split('\n');
                        const uarch = util.getValue(linesRiscV, 'uarch') || '';
                        if (uarch.includes(',')) {
                            const split = uarch.split(',');
                            result.manufacturer = cpuManufacturer(split[0]);
                            result.brand = split[1];
                        }
                    }
                    // socket type
                    let lines2 = [];
                    exec('export LC_ALL=C; dmidecode –t 4 2>/dev/null | grep "Upgrade: Socket"; unset LC_ALL', function (error2, stdout2) {
                        lines2 = stdout2.toString().split('\n');
                        if (lines2 && lines2.length > 0) {
                            result.socket =
                                util.getValue(lines2, 'Upgrade').replace('Socket', '').trim() || result.socket;
                        }
                        resolve(result);
                    });
                });
            }
            if (_freebsd || _openbsd || _netbsd) {
                let modelline = '';
                const lines = [];
                if (os.cpus()[0] && os.cpus()[0].model) {
                    modelline = os.cpus()[0].model;
                }
                exec('export LC_ALL=C; dmidecode -t 4; dmidecode -t 7 unset LC_ALL', function (error, stdout) {
                    let cache = [];
                    let lines = [];
                    if (!error) {
                        const data = stdout.toString().split('# dmidecode');
                        const processor = data.length > 1 ? data[1] : '';
                        cache = data.length > 2 ? data[2].split('Cache Information') : [];
                        lines = processor.split('\n');
                    }
                    result.brand = modelline.split('@')[0].trim();
                    result.speed = modelline.split('@')[1]
                        ? Number.parseFloat(modelline.split('@')[1].trim())
                        : 0;
                    if (result.speed === 0 &&
                        (result.brand.includes('AMD') || result.brand.toLowerCase().includes('ryzen'))) {
                        result.speed = getAMDSpeed(result.brand);
                    }
                    if (result.speed === 0) {
                        const current = getCpuCurrentSpeedSync(options);
                        if (current.avg !== 0) {
                            result.speed = current.avg;
                        }
                    }
                    result.speedMin = result.speed;
                    result.speedMax =
                        Math.round(Number.parseFloat(util.getValue(lines, 'max speed').replaceAll('Mhz', '')) / 10) / 100;
                    result = { ...result, ...cpuBrandManufacturer(result) };
                    result.vendor = cpuManufacturer(util.getValue(lines, 'manufacturer'));
                    const sigStr = util.getValue(lines, 'signature');
                    const sig = sigStr.split(',');
                    for (let i = 0; i < sig.length; i++) {
                        sig[i] = sig[i].trim();
                    }
                    result.family = util.getValue(sig, 'Family', ' ', true);
                    result.model = util.getValue(sig, 'Model', ' ', true);
                    result.stepping = util.getValue(sig, 'Stepping', ' ', true);
                    result.revision = '';
                    const voltage = Number.parseFloat(util.getValue(lines, 'voltage'));
                    result.voltage = Number.isNaN(voltage) ? '' : voltage.toFixed(2);
                    for (const element of cache) {
                        lines = element.split('\n');
                        const cacheTypeArray = util
                            .getValue(lines, 'Socket Designation')
                            .toLowerCase()
                            .replace(' ', '-')
                            .split('-');
                        const cacheType = cacheTypeArray.length > 0 ? cacheTypeArray[0] : '';
                        const sizeParts = util.getValue(lines, 'Installed Size').split(' ');
                        let size = Number.parseInt(sizeParts[0], 10);
                        const unit = sizeParts.length > 1 ? sizeParts[1] : 'kb';
                        size =
                            size *
                                (unit === 'kb'
                                    ? 1024
                                    : unit === 'mb'
                                        ? 1024 * 1024
                                        : unit === 'gb'
                                            ? 1024 * 1024 * 1024
                                            : 1);
                        if (cacheType) {
                            if (cacheType === 'l1') {
                                result.cache[cacheType + 'd'] = size / 2;
                                result.cache[cacheType + 'i'] = size / 2;
                            }
                            else {
                                result.cache[cacheType] = size;
                            }
                        }
                    }
                    // socket type
                    result.socket = util.getValue(lines, 'Upgrade').replace('Socket', '').trim();
                    // # threads / # cores
                    const threadCount = util.getValue(lines, 'thread count').trim();
                    const coreCount = util.getValue(lines, 'core count').trim();
                    if (coreCount && threadCount) {
                        result.cores = Number.parseInt(threadCount, 10);
                        result.physicalCores = Number.parseInt(coreCount, 10);
                    }
                    resolve(result);
                });
            }
            if (_sunos) {
                resolve(result);
            }
            if (_windows) {
                try {
                    const workload = [
                        util.powerShell('Get-CimInstance Win32_processor | select Name, Revision, L2CacheSize, L3CacheSize, Manufacturer, MaxClockSpeed, Description, UpgradeMethod, Caption, NumberOfLogicalProcessors, NumberOfCores | fl', options),
                        util.powerShell('Get-CimInstance Win32_CacheMemory | select CacheType,InstalledSize,Level | fl', options),
                        util.powerShell('(Get-CimInstance Win32_ComputerSystem).HypervisorPresent', options),
                    ];
                    Promise.all(workload).then((data) => {
                        const dataStr = Array.isArray(data[0]) ? data[0].join('\r\n') : data[0];
                        const lines = dataStr.split('\r\n');
                        const name = util.getValue(lines, 'name', ':') || '';
                        if (name.includes('@')) {
                            result.brand = name.split('@')[0].trim();
                            result.speed = name.split('@')[1] ? Number.parseFloat(name.split('@')[1].trim()) : 0;
                        }
                        else {
                            result.brand = name.trim();
                            result.speed = 0;
                        }
                        result = { ...result, ...cpuBrandManufacturer(result) };
                        result.revision = util.getValue(lines, 'revision', ':');
                        result.vendor = util.getValue(lines, 'manufacturer', ':');
                        result.speedMax =
                            Math.round(Number.parseFloat(util.getValue(lines, 'maxclockspeed', ':').replaceAll(',', '.')) /
                                10) / 100;
                        if (result.speed === 0 &&
                            (result.brand.includes('AMD') || result.brand.toLowerCase().includes('ryzen'))) {
                            result.speed = getAMDSpeed(result.brand);
                        }
                        if (result.speed === 0) {
                            result.speed = result.speedMax;
                        }
                        result.speedMin = result.speed;
                        const description = util.getValue(lines, 'description', ':').split(' ');
                        for (let i = 0; i < description.length; i++) {
                            if (description[i].toLowerCase().startsWith('family') &&
                                i + 1 < description.length &&
                                description[i + 1]) {
                                result.family = description[i + 1];
                            }
                            if (description[i].toLowerCase().startsWith('model') &&
                                i + 1 < description.length &&
                                description[i + 1]) {
                                result.model = description[i + 1];
                            }
                            if (description[i].toLowerCase().startsWith('stepping') &&
                                i + 1 < description.length &&
                                description[i + 1]) {
                                result.stepping = description[i + 1];
                            }
                        }
                        // socket type
                        const socketId = util.getValue(lines, 'UpgradeMethod', ':');
                        if (socketTypes[socketId]) {
                            result.socket = socketTypes[socketId];
                        }
                        const socketByName = getSocketTypesByName(name);
                        if (socketByName) {
                            result.socket = socketByName;
                        }
                        // # threads / # cores
                        const countProcessors = util.countLines(lines, 'Caption');
                        const countThreads = util.getValue(lines, 'NumberOfLogicalProcessors', ':');
                        const countCores = util.getValue(lines, 'NumberOfCores', ':');
                        if (countProcessors) {
                            result.processors = countProcessors;
                        }
                        if (countCores && countThreads) {
                            result.cores = Number.parseInt(countThreads, 10) || util.cores();
                            result.physicalCores = Number.parseInt(countCores, 10) || util.cores();
                        }
                        if (countProcessors > 1) {
                            result.cores = result.cores * countProcessors;
                            result.physicalCores = result.physicalCores * countProcessors;
                        }
                        const linesProc = Array.isArray(data[0]) ? data[0].join('\n') : data[0];
                        const linesCache = Array.isArray(data[1]) ? data[1].join('\n') : data[1];
                        result.cache = parseWinCache(linesProc, linesCache);
                        const hyperv = data[2] ? data[2].toString().toLowerCase() : '';
                        result.virtualization = hyperv.includes('true');
                        resolve(result);
                    });
                }
                catch {
                    resolve(result);
                }
            }
        });
    });
}
/**
 * Get CPU information
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to CPU information
 */
export function cpu(options = {}, callback) {
    return new Promise((resolve) => {
        process.nextTick(() => {
            getCpu(options).then((result) => {
                if (callback) {
                    callback(result);
                }
                resolve(result);
            });
        });
    });
}
/**
 * Get current CPU speed
 * @param callback Optional callback function
 * @returns Promise resolving to CPU speed information
 */
export function cpuCurrentSpeed(options = {}, callback) {
    return new Promise((resolve) => {
        process.nextTick(() => {
            let result = getCpuCurrentSpeedSync(options);
            // Get CPU info to check for cached speed value
            getCpu(options).then((cpuInfo) => {
                if (result.avg === 0 && cpuInfo.speed !== 0) {
                    result = {
                        min: cpuInfo.speed,
                        max: cpuInfo.speed,
                        avg: cpuInfo.speed,
                        cores: [],
                    };
                }
                if (callback) {
                    callback(result);
                }
                resolve(result);
            });
        });
    });
}
/**
 * Get CPU load
 * @returns Promise resolving to current load
 */
function getLoad() {
    return new Promise((resolve) => {
        process.nextTick(() => {
            let _corecount = 0;
            let _current_cpu = {
                user: 0,
                nice: 0,
                system: 0,
                idle: 0,
                irq: 0,
                steal: 0,
                guest: 0,
                load: 0,
                tick: 0,
                ms: 0,
                currentLoad: 0,
                currentLoadUser: 0,
                currentLoadSystem: 0,
                currentLoadNice: 0,
                currentLoadIdle: 0,
                currentLoadIrq: 0,
                currentLoadSteal: 0,
                currentLoadGuest: 0,
                rawCurrentLoad: 0,
                rawCurrentLoadUser: 0,
                rawCurrentLoadSystem: 0,
                rawCurrentLoadNice: 0,
                rawCurrentLoadIdle: 0,
                rawCurrentLoadIrq: 0,
                rawCurrentLoadSteal: 0,
                rawCurrentLoadGuest: 0,
            };
            const loads = os.loadavg().map(function (x) {
                return x / util.cores();
            });
            const avgLoad = Number.parseFloat(Math.max(...loads).toFixed(2));
            let result = {};
            const now = Date.now() - _current_cpu.ms;
            if (now >= 200) {
                _current_cpu.ms = Date.now();
                // Get CPU info and calculate load
                const cpus = os.cpus().map(function (cpu) {
                    return {
                        ...cpu,
                        times: {
                            ...cpu.times,
                            steal: 0,
                            guest: 0,
                        },
                    };
                });
                let totalUser = 0;
                let totalSystem = 0;
                let totalNice = 0;
                let totalIrq = 0;
                let totalIdle = 0;
                let totalSteal = 0;
                let totalGuest = 0;
                const cores = [];
                _corecount = cpus && cpus.length > 0 ? cpus.length : 0;
                // Process CPU statistics
                for (let i = 0; i < _corecount; i++) {
                    const cpu = cpus[i].times;
                    totalUser += cpu.user;
                    totalSystem += cpu.sys;
                    totalNice += cpu.nice;
                    totalIdle += cpu.idle;
                    totalIrq += cpu.irq;
                    totalSteal += cpu.steal || 0;
                    totalGuest += cpu.guest || 0;
                    // Calculate load compared to previous state
                    const tmpTick = _cpus && _cpus[i] && _cpus[i].totalTick ? _cpus[i].totalTick : 0;
                    const tmpLoad = _cpus && _cpus[i] && _cpus[i].totalLoad ? _cpus[i].totalLoad : 0;
                    const tmpUser = _cpus && _cpus[i] && _cpus[i].user ? _cpus[i].user : 0;
                    const tmpSystem = _cpus && _cpus[i] && _cpus[i].sys ? _cpus[i].sys : 0;
                    const tmpNice = _cpus && _cpus[i] && _cpus[i].nice ? _cpus[i].nice : 0;
                    const tmpIdle = _cpus && _cpus[i] && _cpus[i].idle ? _cpus[i].idle : 0;
                    const tmpIrq = _cpus && _cpus[i] && _cpus[i].irq ? _cpus[i].irq : 0;
                    const tmpSteal = _cpus && _cpus[i] && _cpus[i].steal ? _cpus[i].steal : 0;
                    const tmpGuest = _cpus && _cpus[i] && _cpus[i].guest ? _cpus[i].guest : 0;
                    // Update CPU state
                    _cpus[i] = cpu;
                    _cpus[i].totalTick =
                        _cpus[i].user +
                            _cpus[i].sys +
                            _cpus[i].nice +
                            _cpus[i].irq +
                            _cpus[i].steal +
                            _cpus[i].guest +
                            _cpus[i].idle;
                    _cpus[i].totalLoad =
                        _cpus[i].user +
                            _cpus[i].sys +
                            _cpus[i].nice +
                            _cpus[i].irq +
                            _cpus[i].steal +
                            _cpus[i].guest;
                    _cpus[i].currentTick = _cpus[i].totalTick - tmpTick;
                    _cpus[i].load = _cpus[i].totalLoad - tmpLoad;
                    _cpus[i].loadUser = _cpus[i].user - tmpUser;
                    _cpus[i].loadSystem = _cpus[i].sys - tmpSystem;
                    _cpus[i].loadNice = _cpus[i].nice - tmpNice;
                    _cpus[i].loadIdle = _cpus[i].idle - tmpIdle;
                    _cpus[i].loadIrq = _cpus[i].irq - tmpIrq;
                    _cpus[i].loadSteal = _cpus[i].steal - tmpSteal;
                    _cpus[i].loadGuest = _cpus[i].guest - tmpGuest;
                    // Calculate per-core load percentages
                    cores[i] = {
                        load: (_cpus[i].load / _cpus[i].currentTick) * 100,
                        loadUser: (_cpus[i].loadUser / _cpus[i].currentTick) * 100,
                        loadSystem: (_cpus[i].loadSystem / _cpus[i].currentTick) * 100,
                        loadNice: (_cpus[i].loadNice / _cpus[i].currentTick) * 100,
                        loadIdle: (_cpus[i].loadIdle / _cpus[i].currentTick) * 100,
                        loadIrq: (_cpus[i].loadIrq / _cpus[i].currentTick) * 100,
                        loadSteal: (_cpus[i].loadSteal / _cpus[i].currentTick) * 100,
                        loadGuest: (_cpus[i].loadGuest / _cpus[i].currentTick) * 100,
                        rawLoad: _cpus[i].load,
                        rawLoadUser: _cpus[i].loadUser,
                        rawLoadSystem: _cpus[i].loadSystem,
                        rawLoadNice: _cpus[i].loadNice,
                        rawLoadIdle: _cpus[i].loadIdle,
                        rawLoadIrq: _cpus[i].loadIrq,
                        rawLoadSteal: _cpus[i].loadSteal,
                        rawLoadGuest: _cpus[i].loadGuest,
                    };
                }
                // Calculate overall CPU load
                const totalTick = totalUser + totalSystem + totalNice + totalIrq + totalSteal + totalGuest + totalIdle;
                const totalLoad = totalUser + totalSystem + totalNice + totalIrq + totalSteal + totalGuest;
                const currentTick = totalTick - _current_cpu.tick;
                result = {
                    avgLoad,
                    currentLoad: ((totalLoad - _current_cpu.load) / currentTick) * 100,
                    currentLoadUser: ((totalUser - _current_cpu.user) / currentTick) * 100,
                    currentLoadSystem: ((totalSystem - _current_cpu.system) / currentTick) * 100,
                    currentLoadNice: ((totalNice - _current_cpu.nice) / currentTick) * 100,
                    currentLoadIdle: ((totalIdle - _current_cpu.idle) / currentTick) * 100,
                    currentLoadIrq: ((totalIrq - _current_cpu.irq) / currentTick) * 100,
                    currentLoadSteal: ((totalSteal - _current_cpu.steal) / currentTick) * 100,
                    currentLoadGuest: ((totalGuest - _current_cpu.guest) / currentTick) * 100,
                    rawCurrentLoad: totalLoad - _current_cpu.load,
                    rawCurrentLoadUser: totalUser - _current_cpu.user,
                    rawCurrentLoadSystem: totalSystem - _current_cpu.system,
                    rawCurrentLoadNice: totalNice - _current_cpu.nice,
                    rawCurrentLoadIdle: totalIdle - _current_cpu.idle,
                    rawCurrentLoadIrq: totalIrq - _current_cpu.irq,
                    rawCurrentLoadSteal: totalSteal - _current_cpu.steal,
                    rawCurrentLoadGuest: totalGuest - _current_cpu.guest,
                    cpus: cores,
                };
                // Update current CPU state
                _current_cpu = {
                    user: totalUser,
                    nice: totalNice,
                    system: totalSystem,
                    idle: totalIdle,
                    irq: totalIrq,
                    steal: totalSteal,
                    guest: totalGuest,
                    tick: totalTick,
                    load: totalLoad,
                    ms: _current_cpu.ms,
                    currentLoad: result.currentLoad,
                    currentLoadUser: result.currentLoadUser,
                    currentLoadSystem: result.currentLoadSystem,
                    currentLoadNice: result.currentLoadNice,
                    currentLoadIdle: result.currentLoadIdle,
                    currentLoadIrq: result.currentLoadIrq,
                    currentLoadSteal: result.currentLoadSteal,
                    currentLoadGuest: result.currentLoadGuest,
                    rawCurrentLoad: result.rawCurrentLoad,
                    rawCurrentLoadUser: result.rawCurrentLoadUser,
                    rawCurrentLoadSystem: result.rawCurrentLoadSystem,
                    rawCurrentLoadNice: result.rawCurrentLoadNice,
                    rawCurrentLoadIdle: result.rawCurrentLoadIdle,
                    rawCurrentLoadIrq: result.rawCurrentLoadIrq,
                    rawCurrentLoadSteal: result.rawCurrentLoadSteal,
                    rawCurrentLoadGuest: result.rawCurrentLoadGuest,
                };
            }
            else {
                // If we just checked recently, use cached data with updated per-core calculations
                const cores = [];
                for (let i = 0; i < _corecount; i++) {
                    cores[i] = {
                        load: (_cpus[i].load / _cpus[i].currentTick) * 100,
                        loadUser: (_cpus[i].loadUser / _cpus[i].currentTick) * 100,
                        loadSystem: (_cpus[i].loadSystem / _cpus[i].currentTick) * 100,
                        loadNice: (_cpus[i].loadNice / _cpus[i].currentTick) * 100,
                        loadIdle: (_cpus[i].loadIdle / _cpus[i].currentTick) * 100,
                        loadIrq: (_cpus[i].loadIrq / _cpus[i].currentTick) * 100,
                        loadSteal: (_cpus[i].loadSteal / _cpus[i].currentTick) * 100,
                        loadGuest: (_cpus[i].loadGuest / _cpus[i].currentTick) * 100,
                        rawLoad: _cpus[i].load,
                        rawLoadUser: _cpus[i].loadUser,
                        rawLoadSystem: _cpus[i].loadSystem,
                        rawLoadNice: _cpus[i].loadNice,
                        rawLoadIdle: _cpus[i].loadIdle,
                        rawLoadIrq: _cpus[i].loadIrq,
                        rawLoadSteal: _cpus[i].loadSteal,
                        rawLoadGuest: _cpus[i].loadGuest,
                    };
                }
                result = {
                    avgLoad,
                    currentLoad: _current_cpu.currentLoad,
                    currentLoadUser: _current_cpu.currentLoadUser,
                    currentLoadSystem: _current_cpu.currentLoadSystem,
                    currentLoadNice: _current_cpu.currentLoadNice,
                    currentLoadIdle: _current_cpu.currentLoadIdle,
                    currentLoadIrq: _current_cpu.currentLoadIrq,
                    currentLoadSteal: _current_cpu.currentLoadSteal,
                    currentLoadGuest: _current_cpu.currentLoadGuest,
                    rawCurrentLoad: _current_cpu.rawCurrentLoad,
                    rawCurrentLoadUser: _current_cpu.rawCurrentLoadUser,
                    rawCurrentLoadSystem: _current_cpu.rawCurrentLoadSystem,
                    rawCurrentLoadNice: _current_cpu.rawCurrentLoadNice,
                    rawCurrentLoadIdle: _current_cpu.rawCurrentLoadIdle,
                    rawCurrentLoadIrq: _current_cpu.rawCurrentLoadIrq,
                    rawCurrentLoadSteal: _current_cpu.rawCurrentLoadSteal,
                    rawCurrentLoadGuest: _current_cpu.rawCurrentLoadGuest,
                    cpus: cores,
                };
            }
            resolve(result);
        });
    });
}
/**
 * Get current CPU load
 * @param callback Optional callback function
 * @returns Promise resolving to current load
 */
export function currentLoad(callback) {
    return new Promise((resolve) => {
        process.nextTick(() => {
            getLoad().then((result) => {
                if (callback) {
                    callback(result);
                }
                resolve(result);
            });
        });
    });
}
/**
 * Get full CPU load since bootup
 * @returns Promise resolving to full load
 */
function getFullLoad() {
    return new Promise((resolve) => {
        process.nextTick(() => {
            const cpus = os.cpus();
            let totalUser = 0;
            let totalSystem = 0;
            let totalNice = 0;
            let totalIrq = 0;
            let totalIdle = 0;
            let result = 0;
            if (cpus && cpus.length > 0) {
                for (const element of cpus) {
                    const cpu = element.times;
                    totalUser += cpu.user;
                    totalSystem += cpu.sys;
                    totalNice += cpu.nice;
                    totalIrq += cpu.irq;
                    totalIdle += cpu.idle;
                }
                const totalTicks = totalIdle + totalIrq + totalNice + totalSystem + totalUser;
                result = ((totalTicks - totalIdle) / totalTicks) * 100;
            }
            resolve(result);
        });
    });
}
/**
 * Get full CPU load since bootup
 * @param callback Optional callback function
 * @returns Promise resolving to full load
 */
export function fullLoad(callback) {
    return new Promise((resolve) => {
        process.nextTick(() => {
            getFullLoad().then((result) => {
                if (callback) {
                    callback(result);
                }
                resolve(result);
            });
        });
    });
}
