"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mem = mem;
exports.memLayout = memLayout;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const fs = tslib_1.__importStar(require("fs"));
const os = tslib_1.__importStar(require("os"));
const util = tslib_1.__importStar(require("../util"));
const platform_1 = require("../util/platform");
// RAM manufacturer lookup tables
const OSX_RAM_manufacturers = {
    '0x014F': 'Transcend Information',
    '0x2C00': 'Micron Technology Inc.',
    '0x802C': 'Micron Technology Inc.',
    '0x80AD': 'Hynix Semiconductor Inc.',
    '0x80CE': 'Samsung Electronics Inc.',
    '0xAD00': 'Hynix Semiconductor Inc.',
    '0xCE00': 'Samsung Electronics Inc.',
    '0x02FE': 'Elpida',
    '0x5105': 'Qimonda AG i. In.',
    '0x8551': 'Qimonda AG i. In.',
    '0x859B': 'Crucial',
    '0x04CD': 'G-Skill',
};
const LINUX_RAM_manufacturers = {
    '017A': 'Apacer',
    '0198': 'HyperX',
    '029E': 'Corsair',
    '04CB': 'A-DATA',
    '04CD': 'G-Skill',
    '059B': 'Crucial',
    '00CE': 'Samsung',
    '1315': 'Crucial',
    '014F': 'Transcend Information',
    '2C00': 'Micron Technology Inc.',
    '802C': 'Micron Technology Inc.',
    '80AD': 'Hynix Semiconductor Inc.',
    '80CE': 'Samsung Electronics Inc.',
    /* eslint-disable prettier/prettier */
    'AD00': 'Hynix Semiconductor Inc.',
    'CE00': 'Samsung Electronics Inc.',
    /* eslint-enable prettier/prettier */
    '02FE': 'Elpida',
    '5105': 'Qimonda AG i. In.',
    '8551': 'Qimonda AG i. In.',
    '859B': 'Crucial',
};
/**
 * Returns memory information
 *
 * @param {object} [options={}] Optional parameters
 * @param {Function} [callback] Optional callback function
 * @returns {Promise<MemData>} Returns memory information
 */
function mem(options = {}, callback) {
    const platform = (0, platform_1.getPlatformFlagsFromOptions)(options);
    return new Promise((resolve) => {
        process.nextTick(() => {
            const result = {
                total: 0,
                free: 0,
                used: 0,
                active: 0, // temporarily (fallback)
                available: 0, // temporarily (fallback)
                buffers: 0,
                cached: 0,
                slab: 0,
                buffcache: 0,
                swaptotal: 0,
                swapused: 0,
                swapfree: 0,
                writeback: null,
                dirty: null,
            };
            if (platform._linux) {
                try {
                    fs.readFile('/proc/meminfo', (error, stdout) => {
                        if (!error) {
                            const lines = stdout.toString().split('\n');
                            result.total = Number.parseInt(util.getValue(lines, 'memtotal'), 10);
                            result.total = result.total ? result.total * 1024 : os.totalmem();
                            result.free = Number.parseInt(util.getValue(lines, 'memfree'), 10);
                            result.free = result.free ? result.free * 1024 : os.freemem();
                            result.used = result.total - result.free;
                            result.buffers = Number.parseInt(util.getValue(lines, 'buffers'), 10);
                            result.buffers = result.buffers ? result.buffers * 1024 : 0;
                            result.cached = Number.parseInt(util.getValue(lines, 'cached'), 10);
                            result.cached = result.cached ? result.cached * 1024 : 0;
                            result.slab = Number.parseInt(util.getValue(lines, 'slab'), 10);
                            result.slab = result.slab ? result.slab * 1024 : 0;
                            result.buffcache = result.buffers + result.cached + result.slab;
                            const available = Number.parseInt(util.getValue(lines, 'memavailable'), 10);
                            result.available = available ? available * 1024 : result.free + result.buffcache;
                            result.active = result.total - result.available;
                            result.swaptotal = Number.parseInt(util.getValue(lines, 'swaptotal'), 10);
                            result.swaptotal = result.swaptotal ? result.swaptotal * 1024 : 0;
                            result.swapfree = Number.parseInt(util.getValue(lines, 'swapfree'), 10);
                            result.swapfree = result.swapfree ? result.swapfree * 1024 : 0;
                            result.swapused = result.swaptotal - result.swapfree;
                            result.writeback = Number.parseInt(util.getValue(lines, 'writeback'), 10);
                            result.writeback = result.writeback ? result.writeback * 1024 : 0;
                            result.dirty = Number.parseInt(util.getValue(lines, 'dirty'), 10);
                            result.dirty = result.dirty ? result.dirty * 1024 : 0;
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
            if (platform._freebsd || platform._openbsd || platform._netbsd) {
                try {
                    (0, child_process_1.exec)('/sbin/sysctl hw.realmem hw.physmem vm.stats.vm.v_page_count vm.stats.vm.v_wire_count vm.stats.vm.v_active_count vm.stats.vm.v_inactive_count vm.stats.vm.v_cache_count vm.stats.vm.v_free_count vm.stats.vm.v_page_size', (error, stdout) => {
                        if (!error) {
                            const lines = stdout.toString().split('\n');
                            const pagesize = Number.parseInt(util.getValue(lines, 'vm.stats.vm.v_page_size'), 10);
                            const inactive = Number.parseInt(util.getValue(lines, 'vm.stats.vm.v_inactive_count'), 10) *
                                pagesize;
                            const cache = Number.parseInt(util.getValue(lines, 'vm.stats.vm.v_cache_count'), 10) * pagesize;
                            result.total = Number.parseInt(util.getValue(lines, 'hw.realmem'), 10);
                            if (Number.isNaN(result.total)) {
                                result.total = Number.parseInt(util.getValue(lines, 'hw.physmem'), 10);
                            }
                            result.free =
                                Number.parseInt(util.getValue(lines, 'vm.stats.vm.v_free_count'), 10) * pagesize;
                            result.buffcache = inactive + cache;
                            result.available = result.buffcache + result.free;
                            result.active = result.total - result.free - result.buffcache;
                            result.swaptotal = 0;
                            result.swapfree = 0;
                            result.swapused = 0;
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
            if (platform._sunos) {
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
            if (platform._darwin) {
                let pageSize = 4096;
                try {
                    const sysPpageSize = util.toInt((0, child_process_1.execSync)('sysctl -n vm.pagesize').toString());
                    pageSize = sysPpageSize || pageSize;
                }
                catch {
                    util.noop();
                }
                try {
                    (0, child_process_1.exec)('vm_stat 2>/dev/null | grep "Pages active"', (error, stdout) => {
                        if (!error) {
                            const lines = stdout.toString().split('\n');
                            result.active = Number.parseInt(lines[0].split(':')[1], 10) * pageSize;
                            result.buffcache = result.used - result.active;
                            result.available = result.free + result.buffcache;
                        }
                        (0, child_process_1.exec)('sysctl -n vm.swapusage 2>/dev/null', (error, stdout) => {
                            if (!error) {
                                const lines = stdout.toString().split('\n');
                                if (lines.length > 0) {
                                    const firstline = lines[0].replaceAll(',', '.').replaceAll('M', '');
                                    const lineArray = firstline.trim().split('  ');
                                    for (const line of lineArray) {
                                        if (line.toLowerCase().includes('total')) {
                                            result.swaptotal = Number.parseFloat(line.split('=')[1].trim()) * 1024 * 1024;
                                        }
                                        if (line.toLowerCase().includes('used')) {
                                            result.swapused = Number.parseFloat(line.split('=')[1].trim()) * 1024 * 1024;
                                        }
                                        if (line.toLowerCase().includes('free')) {
                                            result.swapfree = Number.parseFloat(line.split('=')[1].trim()) * 1024 * 1024;
                                        }
                                    }
                                }
                            }
                            if (callback) {
                                callback(result);
                            }
                            resolve(result);
                        });
                    });
                }
                catch {
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                }
            }
            if (platform._windows) {
                try {
                    const workload = [
                        util.powerShell('Get-CimInstance Win32_OperatingSystem | Select FreePhysicalMemory,TotalVisibleMemorySize', options),
                        util.powerShell('Get-CimInstance Win32_PageFileUsage | Select AllocatedBaseSize, CurrentUsage', options),
                        util.powerShell('Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select CacheBytes,ModifiedPageListBytes,StandbyCacheNormalPriorityBytes,StandbyCacheCoreBytes', options),
                    ];
                    Promise.all(workload).then((data) => {
                        // Parse memory information from tabular format
                        const memoryLines = data[0].split('\r\n');
                        // The values are in the 3rd line, aligned under their column headers
                        if (memoryLines.length >= 3) {
                            // Extract the values from the third line which contains the actual data
                            const memValues = memoryLines[2].trim().split(/\s+/);
                            if (memValues.length >= 2) {
                                const freeMemKB = Number.parseInt(memValues[0], 10) || 0;
                                const totalMemKB = Number.parseInt(memValues[1], 10) || 0;
                                result.total = totalMemKB * 1024;
                                result.free = freeMemKB * 1024;
                                result.used = result.total - result.free;
                                result.active = result.used;
                                result.available = result.free;
                            }
                        }
                        // Parse page file information from tabular format
                        let swaptotal = 0;
                        let swapused = 0;
                        const pageFileLines = data[1].split('\r\n');
                        // Skip headers (first 2 lines) and process data lines
                        for (let i = 2; i < pageFileLines.length; i++) {
                            const line = pageFileLines[i].trim();
                            if (line) {
                                const values = line.split(/\s+/);
                                if (values.length >= 2) {
                                    swaptotal += Number.parseInt(values[0], 10) || 0;
                                    swapused += Number.parseInt(values[1], 10) || 0;
                                }
                            }
                        }
                        // Parse memory cache information from Win32_PerfFormattedData_PerfOS_Memory
                        if (data.length > 2) {
                            const cacheLines = data[2].split('\r\n');
                            // Format is typically:
                            // CacheBytes ModifiedPageListBytes StandbyCacheNormalPriorityBytes StandbyCacheCoreBytes
                            // ---------- --------------------- -------------------------------- ---------------------
                            //    86769664                51200                        401887232            307544064
                            if (cacheLines.length >= 3) {
                                const cacheValues = cacheLines[2].trim().split(/\s+/);
                                if (cacheValues.length >= 4) {
                                    // System file cache
                                    const cacheBytes = Number.parseInt(cacheValues[0], 10) || 0;
                                    // Similar to Linux "dirty" pages - memory waiting to be written to disk
                                    const modifiedBytes = Number.parseInt(cacheValues[1], 10) || 0;
                                    // Standby memory that can be repurposed
                                    const standbyNormalBytes = Number.parseInt(cacheValues[2], 10) || 0;
                                    const standbyCoreBytes = Number.parseInt(cacheValues[3], 10) || 0;
                                    // Fill in memory details using Windows equivalents
                                    result.cached = cacheBytes + standbyNormalBytes + standbyCoreBytes;
                                    result.buffers = modifiedBytes;
                                    result.buffcache = result.cached + result.buffers;
                                    result.dirty = modifiedBytes;
                                    // Adjust available memory to include cache that can be repurposed
                                    result.available = result.free + result.cached;
                                }
                            }
                        }
                        result.swaptotal = swaptotal * 1024 * 1024;
                        result.swapused = swapused * 1024 * 1024;
                        result.swapfree = result.swaptotal - result.swapused;
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
        });
    });
}
function getManufacturerDarwin(manId) {
    if (Object.prototype.hasOwnProperty.call(OSX_RAM_manufacturers, manId)) {
        return OSX_RAM_manufacturers[manId];
    }
    return manId;
}
function getManufacturerLinux(manId) {
    const manIdSearch = manId.replace('0x', '').toUpperCase();
    if (manIdSearch.length === 4 &&
        Object.prototype.hasOwnProperty.call(LINUX_RAM_manufacturers, manIdSearch)) {
        return LINUX_RAM_manufacturers[manIdSearch];
    }
    return manId;
}
/**
 * Returns memory layout information
 *
 * @param {object} [options={}] Optional parameters
 * @param {Function} [callback] Optional callback function
 * @returns {Promise<MemLayoutData[]>} Returns memory layout information
 */
function memLayout(options = {}, callback) {
    const platform = (0, platform_1.getPlatformFlagsFromOptions)(options);
    return new Promise((resolve) => {
        process.nextTick(() => {
            const result = [];
            if (platform._linux || platform._freebsd || platform._openbsd || platform._netbsd) {
                (0, child_process_1.exec)('export LC_ALL=C; dmidecode -t memory 2>/dev/null | grep -iE "Size:|Type|Speed|Manufacturer|Form Factor|Locator|Memory Device|Serial Number|Voltage|Part Number"; unset LC_ALL', (error, stdout) => {
                    if (!error) {
                        const devices = stdout.toString().split('Memory Device');
                        devices.shift();
                        for (const device of devices) {
                            const lines = device.split('\n');
                            const sizeString = util.getValue(lines, 'Size');
                            const size = sizeString.includes('GB')
                                ? Number.parseInt(sizeString, 10) * 1024 * 1024 * 1024
                                : Number.parseInt(sizeString, 10) * 1024 * 1024;
                            let bank = util.getValue(lines, 'Bank Locator');
                            if (bank.toLowerCase().includes('bad')) {
                                bank = '';
                            }
                            if (Number.parseInt(util.getValue(lines, 'Size'), 10) > 0) {
                                const totalWidth = util.toInt(util.getValue(lines, 'Total Width'));
                                const dataWidth = util.toInt(util.getValue(lines, 'Data Width'));
                                result.push({
                                    size,
                                    bank,
                                    type: util.getValue(lines, 'Type:'),
                                    ecc: dataWidth && totalWidth ? totalWidth > dataWidth : false,
                                    /* eslint-disable unicorn/no-nested-ternary */
                                    clockSpeed: util.getValue(lines, 'Configured Clock Speed:')
                                        ? Number.parseInt(util.getValue(lines, 'Configured Clock Speed:'), 10)
                                        : util.getValue(lines, 'Speed:')
                                            ? Number.parseInt(util.getValue(lines, 'Speed:'), 10)
                                            : null,
                                    /* eslint-enable unicorn/no-nested-ternary */
                                    formFactor: util.getValue(lines, 'Form Factor:'),
                                    manufacturer: getManufacturerLinux(util.getValue(lines, 'Manufacturer:')),
                                    partNum: util.getValue(lines, 'Part Number:'),
                                    serialNum: util.getValue(lines, 'Serial Number:'),
                                    voltageConfigured: Number.parseFloat(util.getValue(lines, 'Configured Voltage:')) || null,
                                    voltageMin: Number.parseFloat(util.getValue(lines, 'Minimum Voltage:')) || null,
                                    voltageMax: Number.parseFloat(util.getValue(lines, 'Maximum Voltage:')) || null,
                                });
                            }
                            else {
                                result.push({
                                    size: 0,
                                    bank,
                                    type: 'Empty',
                                    ecc: null,
                                    clockSpeed: 0,
                                    formFactor: util.getValue(lines, 'Form Factor:'),
                                    manufacturer: '',
                                    partNum: '',
                                    serialNum: '',
                                    voltageConfigured: null,
                                    voltageMin: null,
                                    voltageMax: null,
                                });
                            }
                        }
                    }
                    if (result.length === 0) {
                        result.push({
                            size: os.totalmem(),
                            bank: '',
                            type: '',
                            ecc: null,
                            clockSpeed: 0,
                            formFactor: '',
                            manufacturer: '',
                            partNum: '',
                            serialNum: '',
                            voltageConfigured: null,
                            voltageMin: null,
                            voltageMax: null,
                        });
                        // Try Raspberry PI
                        try {
                            let stdout = (0, child_process_1.execSync)('cat /proc/cpuinfo 2>/dev/null', util.execOptsLinux);
                            let lines = stdout.toString().split('\n');
                            const version = util.getValue(lines, 'revision', ':', true).toLowerCase();
                            if (util.isRaspberry(lines)) {
                                const clockSpeed = {
                                    0: 400,
                                    1: 450,
                                    2: 450,
                                    3: 3200,
                                    4: 4267,
                                };
                                result[0].type = 'LPDDR2';
                                result[0].type =
                                    version && version[2] && version[2] === '3' ? 'LPDDR4' : result[0].type;
                                result[0].type =
                                    version && version[2] && version[2] === '4' ? 'LPDDR4X' : result[0].type;
                                result[0].ecc = false;
                                result[0].clockSpeed = (version && version[2] && clockSpeed[version[2]]) || 400;
                                result[0].clockSpeed =
                                    version && version[4] && version[4] === 'd' ? 500 : result[0].clockSpeed;
                                result[0].formFactor = 'SoC';
                                stdout = (0, child_process_1.execSync)('vcgencmd get_config sdram_freq 2>/dev/null', util.execOptsLinux);
                                lines = stdout.toString().split('\n');
                                const freq = Number.parseInt(util.getValue(lines, 'sdram_freq', '=', true), 10) || 0;
                                if (freq) {
                                    result[0].clockSpeed = freq;
                                }
                                stdout = (0, child_process_1.execSync)('vcgencmd measure_volts sdram_p 2>/dev/null', util.execOptsLinux);
                                lines = stdout.toString().split('\n');
                                const voltage = Number.parseFloat(util.getValue(lines, 'volt', '=', true)) || 0;
                                if (voltage) {
                                    result[0].voltageConfigured = voltage;
                                    result[0].voltageMin = voltage;
                                    result[0].voltageMax = voltage;
                                }
                            }
                        }
                        catch {
                            util.noop();
                        }
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            if (platform._darwin) {
                (0, child_process_1.exec)('system_profiler SPMemoryDataType', (error, stdout) => {
                    if (!error) {
                        const allLines = stdout.toString().split('\n');
                        const eccStatus = util.getValue(allLines, 'ecc', ':', true).toLowerCase();
                        let devices = stdout.toString().split('        BANK ');
                        let hasBank = true;
                        if (devices.length === 1) {
                            devices = stdout.toString().split('        DIMM');
                            hasBank = false;
                        }
                        devices.shift();
                        for (const device of devices) {
                            const lines = device.split('\n');
                            const bank = (hasBank ? 'BANK ' : 'DIMM') + lines[0].trim().split('/')[0];
                            const size = Number.parseInt(util.getValue(lines, '          Size'), 10);
                            if (size) {
                                result.push({
                                    size: size * 1024 * 1024 * 1024,
                                    bank,
                                    type: util.getValue(lines, '          Type:'),
                                    ecc: eccStatus ? eccStatus === 'enabled' : null,
                                    clockSpeed: Number.parseInt(util.getValue(lines, '          Speed:'), 10),
                                    formFactor: '',
                                    manufacturer: getManufacturerDarwin(util.getValue(lines, '          Manufacturer:')),
                                    partNum: util.getValue(lines, '          Part Number:'),
                                    serialNum: util.getValue(lines, '          Serial Number:'),
                                    voltageConfigured: null,
                                    voltageMin: null,
                                    voltageMax: null,
                                });
                            }
                            else {
                                result.push({
                                    size: 0,
                                    bank,
                                    type: 'Empty',
                                    ecc: null,
                                    clockSpeed: 0,
                                    formFactor: '',
                                    manufacturer: '',
                                    partNum: '',
                                    serialNum: '',
                                    voltageConfigured: null,
                                    voltageMin: null,
                                    voltageMax: null,
                                });
                            }
                        }
                    }
                    if (result.length === 0) {
                        const lines = stdout.toString().split('\n');
                        const size = Number.parseInt(util.getValue(lines, '      Memory:'), 10);
                        const type = util.getValue(lines, '      Type:');
                        const manufacturerId = util.getValue(lines, '      Manufacturer:');
                        if (size && type) {
                            result.push({
                                size: size * 1024 * 1024 * 1024,
                                bank: '0',
                                type,
                                ecc: false,
                                clockSpeed: null,
                                formFactor: 'SOC',
                                manufacturer: getManufacturerDarwin(manufacturerId),
                                partNum: '',
                                serialNum: '',
                                voltageConfigured: null,
                                voltageMin: null,
                                voltageMax: null,
                            });
                        }
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            if (platform._sunos) {
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
            if (platform._windows) {
                // https://www.dmtf.org/sites/default/files/standards/documents/DSP0134_3.4.0a.pdf
                const memoryTypes = 'Unknown|Other|DRAM|Synchronous DRAM|Cache DRAM|EDO|EDRAM|VRAM|SRAM|RAM|ROM|FLASH|EEPROM|FEPROM|EPROM|CDRAM|3DRAM|SDRAM|SGRAM|RDRAM|DDR|DDR2|DDR2 FB-DIMM|Reserved|DDR3|FBD2|DDR4|LPDDR|LPDDR2|LPDDR3|LPDDR4|Logical non-volatile device|HBM|HBM2|DDR5|LPDDR5'.split('|');
                const FormFactors = 'Unknown|Other|SIP|DIP|ZIP|SOJ|Proprietary|SIMM|DIMM|TSOP|PGA|RIMM|SODIMM|SRIMM|SMD|SSMP|QFP|TQFP|SOIC|LCC|PLCC|BGA|FPBGA|LGA'.split('|');
                try {
                    util
                        .powerShell('Get-CimInstance Win32_PhysicalMemory | select DataWidth,TotalWidth,Capacity,BankLabel,MemoryType,SMBIOSMemoryType,ConfiguredClockSpeed,Speed,FormFactor,Manufacturer,PartNumber,SerialNumber,ConfiguredVoltage,MinVoltage,MaxVoltage,Tag | fl', options)
                        .then((stdout) => {
                        if (stdout) {
                            const devices = stdout.toString().split(/\n\s*\n/);
                            devices.shift();
                            for (const device of devices) {
                                const lines = device.split('\r\n');
                                const dataWidth = util.toInt(util.getValue(lines, 'DataWidth', ':'));
                                const totalWidth = util.toInt(util.getValue(lines, 'TotalWidth', ':'));
                                const size = Number.parseInt(util.getValue(lines, 'Capacity', ':'), 10) || 0;
                                const tag = util.getValue(lines, 'Tag', ':');
                                const tagInt = util.splitByNumber(tag);
                                if (size) {
                                    result.push({
                                        size,
                                        bank: util.getValue(lines, 'BankLabel', ':') + (tagInt[1] ? '/' + tagInt[1] : ''), // BankLabel
                                        type: memoryTypes[Number.parseInt(util.getValue(lines, 'MemoryType', ':'), 10) ||
                                            Number.parseInt(util.getValue(lines, 'SMBIOSMemoryType', ':'), 10)],
                                        ecc: dataWidth && totalWidth ? totalWidth > dataWidth : false,
                                        clockSpeed: Number.parseInt(util.getValue(lines, 'ConfiguredClockSpeed', ':'), 10) ||
                                            Number.parseInt(util.getValue(lines, 'Speed', ':'), 10) ||
                                            0,
                                        formFactor: FormFactors[Number.parseInt(util.getValue(lines, 'FormFactor', ':'), 10) || 0],
                                        manufacturer: util.getValue(lines, 'Manufacturer', ':'),
                                        partNum: util.getValue(lines, 'PartNumber', ':'),
                                        serialNum: util.getValue(lines, 'SerialNumber', ':'),
                                        voltageConfigured: (Number.parseInt(util.getValue(lines, 'ConfiguredVoltage', ':'), 10) || 0) /
                                            1000,
                                        voltageMin: (Number.parseInt(util.getValue(lines, 'MinVoltage', ':'), 10) || 0) / 1000,
                                        voltageMax: (Number.parseInt(util.getValue(lines, 'MaxVoltage', ':'), 10) || 0) / 1000,
                                    });
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
        });
    });
}
