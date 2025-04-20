import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as util from '../util';
import { getPlatformFlagsFromOptions } from '../util/platform';
/**
 * Clean default values from system information
 * @param s String to clean
 * @returns Cleaned string
 */
function cleanDefaults(s) {
    if (!s) {
        return '';
    }
    const cmpStr = s.toLowerCase();
    if (!cmpStr.includes('o.e.m.') && !cmpStr.includes('default string') && cmpStr !== 'default') {
        return s;
    }
    return '';
}
/**
 * Determine macOS chassis type from model string
 * @param model Model string
 * @returns Chassis type
 */
function macOsChassisType(model) {
    model = model.toLowerCase();
    if (model.includes('macbookair') || model.includes('macbook air')) {
        return 'Notebook';
    }
    if (model.includes('macbookpro') || model.includes('macbook pro')) {
        return 'Notebook';
    }
    if (model.includes('macbook')) {
        return 'Notebook';
    }
    if (model.includes('macmini') || model.includes('mac mini')) {
        return 'Desktop';
    }
    if (model.includes('imac')) {
        return 'Desktop';
    }
    if (model.includes('macstudio') || model.includes('mac studio')) {
        return 'Desktop';
    }
    if (model.includes('macpro') || model.includes('mac pro')) {
        return 'Tower';
    }
    return 'Other';
}
/**
 * Get system information
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to system information
 */
export function system(options = {}, callback) {
    const platform = getPlatformFlagsFromOptions(options);
    return new Promise((resolve) => {
        process.nextTick(() => {
            const result = {
                manufacturer: '',
                model: '',
                version: '',
                serial: '',
                uuid: '',
                sku: '',
                virtual: false,
            };
            if (platform._linux || platform._freebsd || platform._openbsd || platform._netbsd) {
                exec('export LC_ALL=C; dmidecode -t system 2>/dev/null; unset LC_ALL', function (error, stdout) {
                    let lines = stdout.toString().split('\n');
                    result.manufacturer = cleanDefaults(util.getValue(lines, 'manufacturer'));
                    result.model = cleanDefaults(util.getValue(lines, 'product name'));
                    result.version = cleanDefaults(util.getValue(lines, 'version'));
                    result.serial = cleanDefaults(util.getValue(lines, 'serial number'));
                    result.uuid = cleanDefaults(util.getValue(lines, 'uuid')).toLowerCase();
                    result.sku = cleanDefaults(util.getValue(lines, 'sku number'));
                    // Non-Root values
                    const cmd = `echo -n "product_name: "; cat /sys/devices/virtual/dmi/id/product_name 2>/dev/null; echo;
            echo -n "product_serial: "; cat /sys/devices/virtual/dmi/id/product_serial 2>/dev/null; echo;
            echo -n "product_uuid: "; cat /sys/devices/virtual/dmi/id/product_uuid 2>/dev/null; echo;
            echo -n "product_version: "; cat /sys/devices/virtual/dmi/id/product_version 2>/dev/null; echo;
            echo -n "sys_vendor: "; cat /sys/devices/virtual/dmi/id/sys_vendor 2>/dev/null; echo;`;
                    try {
                        lines = execSync(cmd, util.execOptsLinux).toString().split('\n');
                        result.manufacturer = cleanDefaults(result.manufacturer === ''
                            ? util.getValue(lines, 'sys_vendor')
                            : result.manufacturer);
                        result.model = cleanDefaults(result.model === '' ? util.getValue(lines, 'product_name') : result.model);
                        result.version = cleanDefaults(result.version === '' ? util.getValue(lines, 'product_version') : result.version);
                        result.serial = cleanDefaults(result.serial === '' ? util.getValue(lines, 'product_serial') : result.serial);
                        result.uuid = cleanDefaults(result.uuid === ''
                            ? util.getValue(lines, 'product_uuid').toLowerCase()
                            : result.uuid);
                    }
                    catch {
                        util.noop();
                    }
                    if (!result.serial) {
                        result.serial = '-';
                    }
                    if (!result.manufacturer) {
                        result.manufacturer = '';
                    }
                    if (!result.model) {
                        result.model = 'Computer';
                    }
                    if (!result.version) {
                        result.version = '';
                    }
                    if (!result.sku) {
                        result.sku = '-';
                    }
                    // detect virtual (1)
                    if (result.model.toLowerCase() === 'virtualbox' ||
                        result.model.toLowerCase() === 'kvm' ||
                        result.model.toLowerCase() === 'virtual machine' ||
                        result.model.toLowerCase() === 'bochs' ||
                        result.model.toLowerCase().startsWith('vmware') ||
                        result.model.toLowerCase().startsWith('droplet')) {
                        result.virtual = true;
                        switch (result.model.toLowerCase()) {
                            case 'virtualbox': {
                                result.virtualHost = 'VirtualBox';
                                break;
                            }
                            case 'vmware': {
                                result.virtualHost = 'VMware';
                                break;
                            }
                            case 'kvm': {
                                result.virtualHost = 'KVM';
                                break;
                            }
                            case 'bochs': {
                                result.virtualHost = 'bochs';
                                break;
                            }
                        }
                    }
                    // detect virtual (2)
                    if (result.manufacturer.toLowerCase().startsWith('vmware') ||
                        result.manufacturer.toLowerCase() === 'xen') {
                        result.virtual = true;
                        switch (result.manufacturer.toLowerCase()) {
                            case 'vmware': {
                                result.virtualHost = 'VMware';
                                break;
                            }
                            case 'xen': {
                                result.virtualHost = 'Xen';
                                break;
                            }
                        }
                    }
                    if (!result.virtual) {
                        try {
                            const disksById = execSync('ls -1 /dev/disk/by-id/ 2>/dev/null', util.execOptsLinux).toString();
                            if (disksById.includes('_QEMU_')) {
                                result.virtual = true;
                                result.virtualHost = 'QEMU';
                            }
                            if (disksById.includes('_VBOX_')) {
                                result.virtual = true;
                                result.virtualHost = 'VirtualBox';
                            }
                        }
                        catch {
                            util.noop();
                        }
                    }
                    if (!result.virtual &&
                        (os.release().toLowerCase().includes('microsoft') ||
                            os.release().toLowerCase().endsWith('wsl2'))) {
                        const kernelVersion = Number.parseFloat(os.release().toLowerCase());
                        result.virtual = true;
                        result.manufacturer = 'Microsoft';
                        result.model = 'WSL';
                        result.version = kernelVersion < 4.19 ? '1' : '2';
                    }
                    if ((platform._freebsd || platform._openbsd || platform._netbsd) &&
                        !result.virtualHost) {
                        try {
                            const procInfo = execSync('dmidecode -t 4', util.execOptsLinux);
                            const procLines = procInfo.toString().split('\n');
                            const procManufacturer = util.getValue(procLines, 'manufacturer', ':', true) || '';
                            const procModel = util.getValue(procLines, 'model name', ':', true) || '';
                            switch (procManufacturer.toLowerCase()) {
                                case 'virtualbox': {
                                    result.virtualHost = 'VirtualBox';
                                    break;
                                }
                                case 'vmware': {
                                    result.virtualHost = 'VMware';
                                    break;
                                }
                                case 'kvm': {
                                    result.virtualHost = 'KVM';
                                    break;
                                }
                                case 'bochs': {
                                    result.virtualHost = 'bochs';
                                    break;
                                }
                            }
                        }
                        catch {
                            util.noop();
                        }
                    }
                    // detect docker
                    if (fs.existsSync('/.dockerenv') || fs.existsSync('/.dockerinit')) {
                        result.model = 'Docker Container';
                    }
                    try {
                        const cmd = 'dmesg 2>/dev/null | grep -iE "virtual|hypervisor" | grep -iE "vmware|qemu|kvm|xen" | grep -viE "Nested Virtualization|/virtual/"';
                        const stdout = execSync(cmd, util.execOptsLinux).toString();
                        if (stdout.toString().toLowerCase().includes('vmware')) {
                            result.virtualHost = 'VMware';
                        }
                        if (stdout.toString().toLowerCase().includes('qemu')) {
                            result.virtualHost = 'QEMU';
                        }
                        if (stdout.toString().toLowerCase().includes('xen')) {
                            result.virtualHost = 'Xen';
                        }
                        if (stdout.toString().toLowerCase().includes('kvm')) {
                            result.virtualHost = 'KVM';
                        }
                    }
                    catch {
                        util.noop();
                    }
                    if (result.manufacturer === '' &&
                        result.model === 'Computer' &&
                        result.version === '') {
                        // Check Raspberry Pi
                        fs.readFile('/proc/cpuinfo', function (error, stdout) {
                            if (!error) {
                                const lines = stdout.toString().split('\n');
                                result.model = util.getValue(lines, 'hardware', ':', true).toUpperCase();
                                result.version = util.getValue(lines, 'revision', ':', true).toLowerCase();
                                result.serial = util.getValue(lines, 'serial', ':', true);
                                const model = util.getValue(lines, 'model:', ':', true);
                                // reference values: https://elinux.org/RPi_HardwareHistory
                                // https://www.raspberrypi.org/documentation/hardware/raspberrypi/revision-codes/README.md
                                if (util.isRaspberry(lines)) {
                                    const rPIRevision = util.decodePiCpuinfo(lines);
                                    result.model = rPIRevision.model;
                                    result.version = rPIRevision.revisionCode;
                                    result.manufacturer = 'Raspberry Pi Foundation';
                                    result.raspberry = {
                                        manufacturer: rPIRevision.manufacturer,
                                        processor: rPIRevision.processor,
                                        type: rPIRevision.type,
                                        revision: rPIRevision.revision,
                                    };
                                }
                            }
                            if (callback) {
                                callback(result);
                            }
                            resolve(result);
                        });
                    }
                    else {
                        if (callback) {
                            callback(result);
                        }
                        resolve(result);
                    }
                });
            }
            if (platform._darwin) {
                exec('ioreg -c IOPlatformExpertDevice -d 2', function (error, stdout) {
                    if (!error) {
                        const lines = stdout.toString().replaceAll(/["<>]/g, '').split('\n');
                        const model = util.getAppleModel(util.getValue(lines, 'model', '=', true));
                        result.manufacturer = util.getValue(lines, 'manufacturer', '=', true);
                        result.model = model.key;
                        result.type = macOsChassisType(model.model);
                        result.version = model.version;
                        result.serial = util.getValue(lines, 'ioplatformserialnumber', '=', true);
                        result.sku =
                            util.getValue(lines, 'board-id', '=', true) ||
                                util.getValue(lines, 'target-type', '=', true) ||
                                util.getValue(lines, 'target-sub-type', '=', true);
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
                try {
                    util
                        .powerShell('Get-CimInstance Win32_ComputerSystemProduct | select Name,Vendor,Version,IdentifyingNumber,UUID | fl', options)
                        .then((stdout) => {
                        const lines = stdout ? stdout.toString().split('\r\n') : [];
                        result.manufacturer = util.getValue(lines, 'vendor', ':');
                        result.model = util.getValue(lines, 'name', ':');
                        result.version = util.getValue(lines, 'version', ':');
                        result.serial = util.getValue(lines, 'identifyingnumber', ':');
                        result.uuid = util.getValue(lines, 'uuid', ':').toLowerCase();
                        // detect virtual (1)
                        const model = result.model.toLowerCase();
                        if (model === 'virtualbox' ||
                            model === 'kvm' ||
                            model === 'virtual machine' ||
                            model === 'bochs' ||
                            model.startsWith('vmware') ||
                            model.startsWith('qemu') ||
                            model.startsWith('parallels')) {
                            result.virtual = true;
                            if (model.startsWith('virtualbox')) {
                                result.virtualHost = 'VirtualBox';
                            }
                            if (model.startsWith('vmware')) {
                                result.virtualHost = 'VMware';
                            }
                            if (model.startsWith('kvm')) {
                                result.virtualHost = 'KVM';
                            }
                            if (model.startsWith('bochs')) {
                                result.virtualHost = 'bochs';
                            }
                            if (model.startsWith('qemu')) {
                                result.virtualHost = 'KVM';
                            }
                            if (model.startsWith('parallels')) {
                                result.virtualHost = 'Parallels';
                            }
                        }
                        const manufacturer = result.manufacturer.toLowerCase();
                        if (manufacturer.startsWith('vmware') ||
                            manufacturer.startsWith('qemu') ||
                            manufacturer === 'xen' ||
                            manufacturer.startsWith('parallels')) {
                            result.virtual = true;
                            if (manufacturer.startsWith('vmware')) {
                                result.virtualHost = 'VMware';
                            }
                            if (manufacturer.startsWith('xen')) {
                                result.virtualHost = 'Xen';
                            }
                            if (manufacturer.startsWith('qemu')) {
                                result.virtualHost = 'KVM';
                            }
                            if (manufacturer.startsWith('parallels')) {
                                result.virtualHost = 'Parallels';
                            }
                        }
                        util
                            .powerShell('Get-CimInstance MS_Systeminformation -Namespace "root/wmi" | select systemsku | fl ', options)
                            .then((stdout) => {
                            const lines = stdout ? stdout.toString().split('\r\n') : [];
                            result.sku = util.getValue(lines, 'systemsku', ':');
                            if (result.virtual) {
                                if (callback) {
                                    callback(result);
                                }
                                resolve(result);
                            }
                            else {
                                util
                                    .powerShell('Get-CimInstance Win32_bios | select Version, SerialNumber, SMBIOSBIOSVersion | fl', options)
                                    .then((stdout) => {
                                    const lines = stdout ? stdout.toString().split('\r\n') : [];
                                    if (lines.includes('VRTUAL') ||
                                        lines.includes('A M I ') ||
                                        lines.includes('VirtualBox') ||
                                        lines.includes('VMWare') ||
                                        lines.includes('Xen') ||
                                        lines.includes('Parallels')) {
                                        result.virtual = true;
                                        if (lines.includes('VirtualBox') && !result.virtualHost) {
                                            result.virtualHost = 'VirtualBox';
                                        }
                                        if (lines.includes('VMware') && !result.virtualHost) {
                                            result.virtualHost = 'VMware';
                                        }
                                        if (lines.includes('Xen') && !result.virtualHost) {
                                            result.virtualHost = 'Xen';
                                        }
                                        if (lines.includes('VRTUAL') && !result.virtualHost) {
                                            result.virtualHost = 'Hyper-V';
                                        }
                                        if (lines.includes('A M I') && !result.virtualHost) {
                                            result.virtualHost = 'Virtual PC';
                                        }
                                        if (lines.includes('Parallels') && !result.virtualHost) {
                                            result.virtualHost = 'Parallels';
                                        }
                                    }
                                    if (callback) {
                                        callback(result);
                                    }
                                    resolve(result);
                                });
                            }
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
        });
    });
}
/**
 * Get BIOS information
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to BIOS information
 */
export function bios(options = {}, callback) {
    const platform = getPlatformFlagsFromOptions(options);
    return new Promise((resolve) => {
        process.nextTick(() => {
            const result = {
                vendor: '',
                version: '',
                releaseDate: '',
                revision: '',
            };
            let cmd = '';
            if (platform._linux || platform._freebsd || platform._openbsd || platform._netbsd) {
                cmd =
                    process.arch === 'arm'
                        ? 'cat /proc/cpuinfo | grep Serial'
                        : 'export LC_ALL=C; dmidecode -t bios 2>/dev/null; unset LC_ALL';
                exec(cmd, function (error, stdout) {
                    let lines = stdout.toString().split('\n');
                    result.vendor = util.getValue(lines, 'Vendor') || '';
                    result.version = util.getValue(lines, 'Version') || '';
                    let datetime = util.getValue(lines, 'Release Date') || '';
                    result.releaseDate = util.parseDateTime(datetime).date || '';
                    result.revision = util.getValue(lines, 'BIOS Revision') || '';
                    result.serial = util.getValue(lines, 'SerialNumber');
                    const language = util.getValue(lines, 'Currently Installed Language').split('|')[0];
                    if (language) {
                        result.language = language;
                    }
                    if (lines.length > 0 && stdout.toString().includes('Characteristics:')) {
                        const features = [];
                        for (const line of lines) {
                            if (line.includes(' is supported')) {
                                const feature = line.split(' is supported')[0].trim();
                                features.push(feature);
                            }
                        }
                        result.features = features;
                    }
                    // Non-Root values
                    const cmd = `echo -n "bios_date: "; cat /sys/devices/virtual/dmi/id/bios_date 2>/dev/null; echo;
            echo -n "bios_vendor: "; cat /sys/devices/virtual/dmi/id/bios_vendor 2>/dev/null; echo;
            echo -n "bios_version: "; cat /sys/devices/virtual/dmi/id/bios_version 2>/dev/null; echo;`;
                    try {
                        lines = execSync(cmd, util.execOptsLinux).toString().split('\n');
                        result.vendor = result.vendor || util.getValue(lines, 'bios_vendor') || '';
                        result.version = result.version || util.getValue(lines, 'bios_version') || '';
                        datetime = util.getValue(lines, 'bios_date') || '';
                        result.releaseDate = result.releaseDate || util.parseDateTime(datetime).date || '';
                    }
                    catch {
                        util.noop();
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            if (platform._darwin) {
                result.vendor = 'Apple Inc.';
                exec('system_profiler SPHardwareDataType -json', function (error, stdout) {
                    try {
                        const hardwareData = JSON.parse(stdout.toString());
                        if (hardwareData &&
                            hardwareData.SPHardwareDataType &&
                            hardwareData.SPHardwareDataType.length > 0) {
                            let bootRomVersion = hardwareData.SPHardwareDataType[0].boot_rom_version;
                            bootRomVersion = bootRomVersion ? bootRomVersion.split('(')[0].trim() : null;
                            result.version = bootRomVersion;
                        }
                    }
                    catch {
                        util.noop();
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            if (platform._sunos) {
                result.vendor = 'Sun Microsystems';
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
            if (platform._windows) {
                try {
                    // Use a simpler PowerShell command without complex calculated properties
                    util
                        .powerShell('Get-CimInstance Win32_bios | select Description,Version,Manufacturer,ReleaseDate,BuildNumber,SerialNumber,SMBIOSBIOSVersion | fl', options)
                        .then((stdout) => {
                        const lines = stdout ? stdout.toString().split('\r\n') : [];
                        const description = util.getValue(lines, 'description', ':');
                        const version = util.getValue(lines, 'SMBIOSBIOSVersion', ':');
                        if (description.includes(' Version ')) {
                            // ... Phoenix ROM BIOS PLUS Version 1.10 A04
                            result.vendor = description.split(' Version ')[0].trim();
                            result.version = description.split(' Version ')[1].trim();
                        }
                        else if (description.includes(' Ver: ')) {
                            // ... BIOS Date: 06/27/16 17:50:16 Ver: 1.4.5
                            result.vendor = util.getValue(lines, 'manufacturer', ':');
                            result.version = description.split(' Ver: ')[1].trim();
                        }
                        else {
                            result.vendor = util.getValue(lines, 'manufacturer', ':');
                            result.version = version || util.getValue(lines, 'version', ':');
                        }
                        // Store the manufacturer-specific version number if available
                        const rawVersion = util.getValue(lines, 'version', ':');
                        if (rawVersion && rawVersion !== result.version) {
                            result.vendorVersion = rawVersion;
                        }
                        // Parse ReleaseDate from default format
                        const releaseDate = util.getValue(lines, 'releasedate', ':');
                        if (releaseDate) {
                            try {
                                // Convert from default WMI date format
                                const dateObj = new Date(releaseDate);
                                if (Number.isNaN(dateObj.getTime())) {
                                    result.releaseDate = releaseDate;
                                }
                                else {
                                    // Format as yyyy-MM-dd
                                    const year = dateObj.getFullYear();
                                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                    const day = String(dateObj.getDate()).padStart(2, '0');
                                    result.releaseDate = `${year}-${month}-${day}`;
                                }
                            }
                            catch {
                                result.releaseDate = releaseDate;
                            }
                            result.revision = util.getValue(lines, 'buildnumber', ':');
                            result.serial = cleanDefaults(util.getValue(lines, 'serialnumber', ':'));
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
/**
 * Get baseboard information
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to baseboard information
 */
export function baseboard(options = {}, callback) {
    const platform = getPlatformFlagsFromOptions(options);
    return new Promise((resolve) => {
        process.nextTick(() => {
            const result = {
                manufacturer: '',
                model: '',
                version: '',
                serial: '-',
                assetTag: '-',
                memMax: null,
                memSlots: null,
            };
            let cmd = '';
            if (platform._linux || platform._freebsd || platform._openbsd || platform._netbsd) {
                cmd =
                    process.arch === 'arm'
                        ? 'cat /proc/cpuinfo | grep Serial'
                        : 'export LC_ALL=C; dmidecode -t 2 2>/dev/null; unset LC_ALL';
                // Handle both promises without using multiple Array.push() calls
                const execPromise = util.promisify(exec);
                const getBoardInfo = execPromise(cmd, {}).then((result) => ({
                    stdout: result.stdout,
                    stderr: result.stderr || '',
                }));
                const getMemoryInfo = execPromise('export LC_ALL=C; dmidecode -t memory 2>/dev/null', {}).then((result) => ({ stdout: result.stdout, stderr: result.stderr || '' }));
                // Initialize the array with both promises
                const workload = [getBoardInfo, getMemoryInfo];
                util.promiseAll(workload).then((data) => {
                    let lines = data.results[0] ? data.results[0].stdout.split('\n') : [''];
                    result.manufacturer = cleanDefaults(util.getValue(lines, 'Manufacturer'));
                    result.model = cleanDefaults(util.getValue(lines, 'Product Name'));
                    result.version = cleanDefaults(util.getValue(lines, 'Version'));
                    result.serial = cleanDefaults(util.getValue(lines, 'Serial Number'));
                    result.assetTag = cleanDefaults(util.getValue(lines, 'Asset Tag'));
                    // Non-Root values
                    const cmd = `echo -n "board_asset_tag: "; cat /sys/devices/virtual/dmi/id/board_asset_tag 2>/dev/null; echo;
            echo -n "board_name: "; cat /sys/devices/virtual/dmi/id/board_name 2>/dev/null; echo;
            echo -n "board_serial: "; cat /sys/devices/virtual/dmi/id/board_serial 2>/dev/null; echo;
            echo -n "board_vendor: "; cat /sys/devices/virtual/dmi/id/board_vendor 2>/dev/null; echo;
            echo -n "board_version: "; cat /sys/devices/virtual/dmi/id/board_version 2>/dev/null; echo;`;
                    try {
                        lines = execSync(cmd, util.execOptsLinux).toString().split('\n');
                        result.manufacturer = cleanDefaults(result.manufacturer || util.getValue(lines, 'board_vendor'));
                        result.model = cleanDefaults(result.model || util.getValue(lines, 'board_name'));
                        result.version = cleanDefaults(result.version || util.getValue(lines, 'board_version'));
                        result.serial = cleanDefaults(result.serial || util.getValue(lines, 'board_serial'));
                        result.assetTag = cleanDefaults(result.assetTag || util.getValue(lines, 'board_asset_tag'));
                    }
                    catch {
                        util.noop();
                    }
                    // mem
                    lines = data.results[1] ? data.results[1].stdout.split('\n') : [''];
                    result.memMax =
                        util.toInt(util.getValue(lines, 'Maximum Capacity')) * 1024 * 1024 * 1024 || null;
                    result.memSlots = util.toInt(util.getValue(lines, 'Number Of Devices')) || null;
                    // raspberry
                    if (util.isRaspberry()) {
                        const rpi = util.decodePiCpuinfo();
                        result.manufacturer = rpi.manufacturer;
                        result.model = 'Raspberry Pi';
                        result.serial = rpi.serial;
                        result.version = rpi.type + ' - ' + rpi.revision;
                        result.memMax = os.totalmem();
                        result.memSlots = 0;
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            if (platform._darwin) {
                const execPromise = util.promisify(exec);
                const workload = [
                    execPromise('ioreg -c IOPlatformExpertDevice -d 2', {}).then((result) => ({
                        stdout: result.stdout,
                        stderr: result.stderr || '',
                    })),
                    execPromise('system_profiler SPMemoryDataType', {}).then((result) => ({
                        stdout: result.stdout,
                        stderr: result.stderr || '',
                    })),
                ];
                util.promiseAll(workload).then((data) => {
                    const lines = data.results[0]
                        ? data.results[0].stdout.replaceAll(/["<>]/g, '').split('\n')
                        : [''];
                    result.manufacturer = util.getValue(lines, 'manufacturer', '=', true);
                    result.model = util.getValue(lines, 'model', '=', true);
                    result.version = util.getValue(lines, 'version', '=', true);
                    result.serial = util.getValue(lines, 'ioplatformserialnumber', '=', true);
                    result.assetTag = util.getValue(lines, 'board-id', '=', true);
                    // mem
                    let devices = data.results[1] ? data.results[1].stdout.split('        BANK ') : [''];
                    if (devices.length === 1) {
                        devices = data.results[1] ? data.results[1].stdout.split('        DIMM') : [''];
                    }
                    devices.shift();
                    result.memSlots = devices.length;
                    if (os.arch() === 'arm64') {
                        result.memSlots = 0;
                        result.memMax = os.totalmem();
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
                try {
                    const win10plus = Number.parseInt(os.release(), 10) >= 10;
                    const maxCapacityAttribute = win10plus ? 'MaxCapacityEx' : 'MaxCapacity';
                    // Initialize with proper type and both items at once
                    const workload = [
                        util.powerShell('Get-CimInstance Win32_baseboard | select Model,Manufacturer,Product,Version,SerialNumber,PartNumber,SKU | fl', options),
                        util.powerShell(`Get-CimInstance Win32_physicalmemoryarray | select ${maxCapacityAttribute}, MemoryDevices | fl`, options),
                    ];
                    util.promiseAll(workload).then((data) => {
                        let lines = data.results[0] ? data.results[0].toString().split('\r\n') : [''];
                        result.manufacturer = cleanDefaults(util.getValue(lines, 'manufacturer', ':'));
                        result.model = cleanDefaults(util.getValue(lines, 'model', ':'));
                        if (!result.model) {
                            result.model = cleanDefaults(util.getValue(lines, 'product', ':'));
                        }
                        result.version = cleanDefaults(util.getValue(lines, 'version', ':'));
                        result.serial = cleanDefaults(util.getValue(lines, 'serialnumber', ':'));
                        result.assetTag = cleanDefaults(util.getValue(lines, 'partnumber', ':'));
                        if (!result.assetTag) {
                            result.assetTag = cleanDefaults(util.getValue(lines, 'sku', ':'));
                        }
                        // memphysical
                        lines = data.results[1] ? data.results[1].toString().split('\r\n') : [''];
                        result.memMax =
                            util.toInt(util.getValue(lines, maxCapacityAttribute, ':')) *
                                (win10plus ? 1024 : 1) || null;
                        result.memSlots = util.toInt(util.getValue(lines, 'MemoryDevices', ':')) || null;
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
/**
 * Get chassis information
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to chassis information
 */
export function chassis(options = {}, callback) {
    const platform = getPlatformFlagsFromOptions(options);
    const chassisTypes = [
        'Other',
        'Unknown',
        'Desktop',
        'Low Profile Desktop',
        'Pizza Box',
        'Mini Tower',
        'Tower',
        'Portable',
        'Laptop',
        'Notebook',
        'Hand Held',
        'Docking Station',
        'All in One',
        'Sub Notebook',
        'Space-Saving',
        'Lunch Box',
        'Main System Chassis',
        'Expansion Chassis',
        'SubChassis',
        'Bus Expansion Chassis',
        'Peripheral Chassis',
        'Storage Chassis',
        'Rack Mount Chassis',
        'Sealed-Case PC',
        'Multi-System Chassis',
        'Compact PCI',
        'Advanced TCA',
        'Blade',
        'Blade Enclosure',
        'Tablet',
        'Convertible',
        'Detachable',
        'IoT Gateway ',
        'Embedded PC',
        'Mini PC',
        'Stick PC',
    ];
    return new Promise((resolve) => {
        process.nextTick(() => {
            const result = {
                manufacturer: '',
                model: '',
                type: '',
                version: '',
                serial: '-',
                assetTag: '-',
                sku: '',
            };
            if (platform._linux || platform._freebsd || platform._openbsd || platform._netbsd) {
                const cmd = `echo -n "chassis_asset_tag: "; cat /sys/devices/virtual/dmi/id/chassis_asset_tag 2>/dev/null; echo;
            echo -n "chassis_serial: "; cat /sys/devices/virtual/dmi/id/chassis_serial 2>/dev/null; echo;
            echo -n "chassis_type: "; cat /sys/devices/virtual/dmi/id/chassis_type 2>/dev/null; echo;
            echo -n "chassis_vendor: "; cat /sys/devices/virtual/dmi/id/chassis_vendor 2>/dev/null; echo;
            echo -n "chassis_version: "; cat /sys/devices/virtual/dmi/id/chassis_version 2>/dev/null; echo;`;
                exec(cmd, function (error, stdout) {
                    const lines = stdout.toString().split('\n');
                    result.manufacturer = cleanDefaults(util.getValue(lines, 'chassis_vendor'));
                    const ctype = Number.parseInt(util.getValue(lines, 'chassis_type').replaceAll(/\D/g, ''), 10);
                    result.type = cleanDefaults(ctype && !Number.isNaN(ctype) && ctype < chassisTypes.length
                        ? chassisTypes[ctype - 1]
                        : '');
                    result.version = cleanDefaults(util.getValue(lines, 'chassis_version'));
                    result.serial = cleanDefaults(util.getValue(lines, 'chassis_serial'));
                    result.assetTag = cleanDefaults(util.getValue(lines, 'chassis_asset_tag'));
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            if (platform._darwin) {
                exec('ioreg -c IOPlatformExpertDevice -d 2', function (error, stdout) {
                    if (!error) {
                        const lines = stdout.toString().replaceAll(/["<>]/g, '').split('\n');
                        const model = util.getAppleModel(util.getValue(lines, 'model', '=', true));
                        result.manufacturer = util.getValue(lines, 'manufacturer', '=', true);
                        result.model = model.key;
                        result.type = macOsChassisType(model.model);
                        result.version = model.version;
                        result.serial = util.getValue(lines, 'ioplatformserialnumber', '=', true);
                        result.assetTag =
                            util.getValue(lines, 'board-id', '=', true) ||
                                util.getValue(lines, 'target-type', '=', true);
                        result.sku = util.getValue(lines, 'target-sub-type', '=', true);
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
                try {
                    util
                        .powerShell('Get-CimInstance Win32_SystemEnclosure | select Model,Manufacturer,ChassisTypes,Version,SerialNumber,PartNumber,SKU,SMBIOSAssetTag | fl', options)
                        .then((stdout) => {
                        const lines = stdout ? stdout.toString().split('\r\n') : [];
                        result.manufacturer = cleanDefaults(util.getValue(lines, 'manufacturer', ':'));
                        result.model = cleanDefaults(util.getValue(lines, 'model', ':'));
                        const ctype = Number.parseInt(util.getValue(lines, 'ChassisTypes', ':').replaceAll(/\D/g, ''), 10);
                        result.type =
                            ctype && !Number.isNaN(ctype) && ctype < chassisTypes.length
                                ? chassisTypes[ctype - 1]
                                : '';
                        result.version = cleanDefaults(util.getValue(lines, 'version', ':'));
                        result.serial = cleanDefaults(util.getValue(lines, 'serialnumber', ':'));
                        result.assetTag = cleanDefaults(util.getValue(lines, 'partnumber', ':'));
                        if (!result.assetTag) {
                            result.assetTag = cleanDefaults(util.getValue(lines, 'SMBIOSAssetTag', ':'));
                        }
                        result.sku = cleanDefaults(util.getValue(lines, 'sku', ':'));
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
