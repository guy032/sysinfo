"use strict";
// ==================================================================================
// usb.ts
// ----------------------------------------------------------------------------------
// Description:   System Information - library
//                for Node.js
// Copyright:     (c) 2014 - 2025
// Author:        Sebastian Hildebrandt
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 16. usb
// ----------------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.usb = usb;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const path_1 = tslib_1.__importDefault(require("path"));
const util = tslib_1.__importStar(require("../util"));
const platform_1 = require("../util/platform");
function getLinuxUsbType(type, name) {
    let result = type;
    const str = (name + ' ' + type).toLowerCase();
    if (str.includes('camera')) {
        result = 'Camera';
    }
    else if (str.includes('hub')) {
        result = 'Hub';
    }
    else if (str.includes('keybrd')) {
        result = 'Keyboard';
    }
    else if (str.includes('keyboard')) {
        result = 'Keyboard';
    }
    else if (str.includes('mouse')) {
        result = 'Mouse';
    }
    else if (str.includes('stora')) {
        result = 'Storage';
    }
    else if (str.includes('microp')) {
        result = 'Microphone';
    }
    else if (str.includes('headset')) {
        result = 'Audio';
    }
    else if (str.includes('audio')) {
        result = 'Audio';
    }
    return result;
}
function parseLinuxUsb(usb) {
    const result = {
        bus: null,
        deviceId: null,
        id: null,
        name: null,
        type: '',
        removable: null,
        vendor: null,
        manufacturer: null,
        maxPower: null,
        serialNumber: null,
    };
    const lines = usb.split('\n');
    if (lines && lines.length > 0 && lines[0].includes('Device')) {
        const parts = lines[0].split(' ');
        result.bus = Number.parseInt(parts[0], 10);
        result.deviceId = parts[2] ? Number.parseInt(parts[2], 10) : null;
    }
    else {
        result.bus = null;
        result.deviceId = null;
    }
    const idVendor = util.getValue(lines, 'idVendor', ' ', true).trim();
    const vendorParts = idVendor.split(' ');
    vendorParts.shift();
    const vendor = vendorParts.join(' ');
    const idProduct = util.getValue(lines, 'idProduct', ' ', true).trim();
    const productParts = idProduct.split(' ');
    productParts.shift();
    const product = productParts.join(' ');
    const interfaceClass = util.getValue(lines, 'bInterfaceClass', ' ', true).trim();
    const interfaceClassParts = interfaceClass.split(' ');
    interfaceClassParts.shift();
    const usbType = interfaceClassParts.join(' ');
    const iManufacturer = util.getValue(lines, 'iManufacturer', ' ', true).trim();
    const iManufacturerParts = iManufacturer.split(' ');
    iManufacturerParts.shift();
    const manufacturer = iManufacturerParts.join(' ');
    const iSerial = util.getValue(lines, 'iSerial', ' ', true).trim();
    const iSerialParts = iSerial.split(' ');
    iSerialParts.shift();
    const serial = iSerialParts.join(' ');
    const maxPower = util.getValue(lines, 'MaxPower', ' ', true);
    let maxPowerNum = null;
    if (maxPower) {
        const maxPowerMatch = maxPower.match(/(\d+)/);
        if (maxPowerMatch) {
            maxPowerNum = Number.parseInt(maxPowerMatch[1], 10);
        }
    }
    result.id =
        (idVendor.startsWith('0x') ? idVendor.split(' ')[0].slice(2, 10) : '') +
            ':' +
            (idProduct.startsWith('0x') ? idProduct.split(' ')[0].slice(2, 10) : '');
    result.name = product;
    result.type = getLinuxUsbType(usbType, product);
    result.removable = null;
    result.vendor = vendor;
    result.manufacturer = manufacturer;
    result.maxPower = maxPowerNum;
    result.serialNumber = serial;
    return result;
}
function getDarwinUsbType(name) {
    let result = '';
    if (name.includes('camera')) {
        result = 'Camera';
    }
    else if (name.includes('touch bar')) {
        result = 'Touch Bar';
    }
    else if (name.includes('controller')) {
        result = 'Controller';
    }
    else if (name.includes('headset')) {
        result = 'Audio';
    }
    else if (name.includes('keyboard')) {
        result = 'Keyboard';
    }
    else if (name.includes('trackpad')) {
        result = 'Trackpad';
    }
    else if (name.includes('sensor')) {
        result = 'Sensor';
    }
    else if (name.includes('bthusb')) {
        result = 'Bluetooth';
    }
    else if (name.includes('bth')) {
        result = 'Bluetooth';
    }
    else if (name.includes('rfcomm')) {
        result = 'Bluetooth';
    }
    else if (name.includes('usbhub')) {
        result = 'Hub';
    }
    else if (name.includes(' hub')) {
        result = 'Hub';
    }
    else if (name.includes('mouse')) {
        result = 'Mouse';
    }
    else if (name.includes('microp')) {
        result = 'Microphone';
    }
    else if (name.includes('removable')) {
        result = 'Storage';
    }
    return result;
}
function parseDarwinUsb(usb) {
    const result = {
        bus: null,
        deviceId: null,
        id: null,
        name: null,
        type: '',
        removable: null,
        vendor: null,
        manufacturer: null,
        maxPower: null,
        serialNumber: null,
    };
    usb = usb.replaceAll(' |', '');
    usb = usb.trim();
    const lines = usb.split('\n');
    lines.shift();
    try {
        for (let i = 0; i < lines.length; i++) {
            lines[i] = lines[i].trim();
            lines[i] = lines[i].replaceAll('=', ':');
            if (lines[i] !== '{' && lines[i] !== '}' && lines[i + 1] && lines[i + 1].trim() !== '}') {
                lines[i] = lines[i] + ',';
            }
            lines[i] = lines[i].replace(':Yes,', ':"Yes",');
            lines[i] = lines[i].replace(': Yes,', ': "Yes",');
            lines[i] = lines[i].replace(': Yes', ': "Yes"');
            lines[i] = lines[i].replace(':No,', ':"No",');
            lines[i] = lines[i].replace(': No,', ': "No",');
            lines[i] = lines[i].replace(': No', ': "No"');
            // In this case (("com.apple.developer.driverkit.transport.usb"))
            lines[i] = lines[i].replace('((', '').replace('))', '');
            // In case we have <923c11> we need make it "<923c11>" for correct JSON parse
            const match = /<(\w+)>/.exec(lines[i]);
            if (match) {
                const number = match[0];
                lines[i] = lines[i].replace(number, `"${number}"`);
            }
        }
        const usbObj = JSON.parse(lines.join('\n'));
        const removableDrive = (usbObj['Built-In'] ? usbObj['Built-In'].toLowerCase() !== 'yes' : true) &&
            (usbObj['non-removable'] ? usbObj['non-removable'].toLowerCase() === 'no' : true);
        result.id = usbObj['USB Address'] || null;
        result.name = usbObj.kUSBProductString || usbObj['USB Product Name'] || null;
        result.type = getDarwinUsbType((usbObj.kUSBProductString || usbObj['USB Product Name'] || '').toLowerCase() +
            (removableDrive ? ' removable' : ''));
        result.removable = usbObj['non-removable']
            ? usbObj['non-removable'].toLowerCase() === 'no'
            : true;
        result.vendor = usbObj.kUSBVendorString || usbObj['USB Vendor Name'] || null;
        result.manufacturer = usbObj.kUSBVendorString || usbObj['USB Vendor Name'] || null;
        result.serialNumber = usbObj.kUSBSerialNumberString || null;
        if (result.name) {
            return result;
        }
        return null;
    }
    catch {
        return null;
    }
}
function getUsbScriptPath() {
    // Calculate the path to the PowerShell script relative to this file
    return path_1.default.resolve(__dirname, '../../powershell/usb.ps1');
}
function getWindowsUsbTypeCreation(creationclass, name) {
    let result = '';
    if (name.includes('storage')) {
        result = 'Storage';
    }
    else if (name.includes('speicher')) {
        result = 'Storage';
    }
    else if (creationclass.includes('usbhub')) {
        result = 'Hub';
    }
    else if (creationclass.includes('storage')) {
        result = 'Storage';
    }
    else if (creationclass.includes('usbcontroller')) {
        result = 'Controller';
    }
    else if (creationclass.includes('keyboard')) {
        result = 'Keyboard';
    }
    else if (creationclass.includes('pointing')) {
        result = 'Mouse';
    }
    else if (creationclass.includes('microp')) {
        result = 'Microphone';
    }
    else if (creationclass.includes('disk')) {
        result = 'Storage';
    }
    return result;
}
function parseWindowsUsb(lines, id) {
    const usbType = getWindowsUsbTypeCreation(util.getValue(lines.split('\n'), 'CreationClassName', ':').toLowerCase(), util.getValue(lines.split('\n'), 'name', ':').toLowerCase());
    if (usbType) {
        const result = {
            bus: null,
            deviceId: (() => {
                const deviceIdStr = util.getValue(lines.split('\n'), 'deviceid', ':');
                return deviceIdStr ? Number.parseInt(deviceIdStr, 10) || null : null;
            })(),
            id: id.toString(),
            name: util.getValue(lines.split('\n'), 'name', ':'),
            type: usbType,
            removable: null,
            vendor: null,
            manufacturer: util.getValue(lines.split('\n'), 'Manufacturer', ':'),
            maxPower: null,
            serialNumber: null,
        };
        return result;
    }
    return null;
}
function usb(options = {}, callback) {
    const platform = (0, platform_1.getPlatformFlagsFromOptions)(options);
    return new Promise((resolve) => {
        process.nextTick(() => {
            const result = [];
            if (platform._linux) {
                const cmd = 'export LC_ALL=C; lsusb -v 2>/dev/null; unset LC_ALL';
                (0, child_process_1.exec)(cmd, { maxBuffer: 1024 * 1024 * 128 }, (error, stdout) => {
                    if (!error) {
                        const parts = ('\n\n' + stdout.toString()).split('\n\nBus ');
                        for (let i = 1; i < parts.length; i++) {
                            const usb = parseLinuxUsb(parts[i]);
                            result.push(usb);
                        }
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            if (platform._darwin) {
                const cmd = 'ioreg -p IOUSB -c AppleUSBRootHubDevice -w0 -l';
                (0, child_process_1.exec)(cmd, { maxBuffer: 1024 * 1024 * 128 }, (error, stdout) => {
                    if (!error) {
                        const parts = stdout.toString().split(' +-o ');
                        for (let i = 1; i < parts.length; i++) {
                            const usb = parseDarwinUsb(parts[i]);
                            if (usb) {
                                result.push(usb);
                            }
                        }
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            if (platform._windows) {
                util
                    .powerShell('Get-CimInstance CIM_LogicalDevice | where { $_.CimClass -match \\"USB\\" } | select Name,CreationClassName,DeviceId,Manufacturer | fl', options)
                    .then((stdout) => {
                    if (stdout) {
                        const parts = stdout.toString().split(/\n\s*\n/);
                        for (const [i, part] of parts.entries()) {
                            const usb = parseWindowsUsb(part, i);
                            if (usb && result.filter((x) => x.deviceId === usb.deviceId).length === 0) {
                                result.push(usb);
                            }
                        }
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            if (platform._sunos || platform._freebsd || platform._openbsd || platform._netbsd) {
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
        });
    });
}
