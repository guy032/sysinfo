// ==================================================================================
// bluetooth.ts
// ----------------------------------------------------------------------------------
// Description:   System Information - library
//                for Node.js
// Copyright:     (c) 2014 - 2025
// Author:        Sebastian Hildebrandt
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 17. bluetooth
// ----------------------------------------------------------------------------------
import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import bluetoothVendors from '../../mapping/bluetooth-vendors';
import * as util from '../util';
import { getPlatformFlagsFromOptions } from '../util/platform';
/**
 * Get the path to the PowerShell script
 * @returns The absolute path to the bluetooth PowerShell script
 */
function getBluetoothScriptPath() {
    // Calculate the path to the PowerShell script relative to this file
    return path.resolve(__dirname, '../../powershell/bluetooth.ps1');
}
/**
 * Parse the type of bluetooth device
 */
function parseBluetoothType(str) {
    let result = '';
    const lowerStr = str.toLowerCase();
    if (lowerStr.includes('keyboard')) {
        result = 'Keyboard';
    }
    if (lowerStr.includes('mouse')) {
        result = 'Mouse';
    }
    if (lowerStr.includes('trackpad')) {
        result = 'Trackpad';
    }
    if (lowerStr.includes('speaker')) {
        result = 'Speaker';
    }
    if (lowerStr.includes('headset')) {
        result = 'Headset';
    }
    if (lowerStr.includes('phone')) {
        result = 'Phone';
    }
    if (lowerStr.includes('macbook')) {
        result = 'Computer';
    }
    if (lowerStr.includes('imac')) {
        result = 'Computer';
    }
    if (lowerStr.includes('ipad')) {
        result = 'Tablet';
    }
    if (lowerStr.includes('watch')) {
        result = 'Watch';
    }
    if (lowerStr.includes('headphone')) {
        result = 'Headset';
    }
    // to be continued ...
    return result;
}
/**
 * Parse the manufacturer from the device name
 */
function parseBluetoothManufacturer(str) {
    let result = str.split(' ')[0];
    const lowerStr = str.toLowerCase();
    if (lowerStr.includes('apple')) {
        result = 'Apple';
    }
    if (lowerStr.includes('ipad')) {
        result = 'Apple';
    }
    if (lowerStr.includes('imac')) {
        result = 'Apple';
    }
    if (lowerStr.includes('iphone')) {
        result = 'Apple';
    }
    if (lowerStr.includes('magic mouse')) {
        result = 'Apple';
    }
    if (lowerStr.includes('magic track')) {
        result = 'Apple';
    }
    if (lowerStr.includes('macbook')) {
        result = 'Apple';
    }
    // to be continued ...
    return result;
}
/**
 * Look up vendor name from ID
 */
function parseBluetoothVendor(str) {
    const id = Number.parseInt(str, 10);
    if (!Number.isNaN(id)) {
        return bluetoothVendors[id] || null;
    }
    return null;
}
/**
 * Parse Linux bluetooth info file
 */
function parseLinuxBluetoothInfo(lines, macAddr1, macAddr2) {
    return {
        device: null,
        name: util.getValue(lines, 'name', '='),
        manufacturer: null,
        macDevice: macAddr1,
        macHost: macAddr2,
        batteryPercent: null,
        type: parseBluetoothType(util.getValue(lines, 'name', '=').toLowerCase()),
        connected: false,
    };
}
function parseDarwinBluetoothDevices(bluetoothObject, macAddr2) {
    const typeStr = ((bluetoothObject.device_minorClassOfDevice_string ||
        bluetoothObject.device_majorClassOfDevice_string ||
        bluetoothObject.device_minorType ||
        '') + (bluetoothObject.device_name || '')).toLowerCase();
    const result = {
        device: bluetoothObject.device_services || '',
        name: bluetoothObject.device_name || '',
        manufacturer: bluetoothObject.device_manufacturer ||
            parseBluetoothVendor(bluetoothObject.device_vendorID || '') ||
            parseBluetoothManufacturer(bluetoothObject.device_name || '') ||
            '',
        macDevice: (bluetoothObject.device_addr || bluetoothObject.device_address || '')
            .toLowerCase()
            .replaceAll('-', ':'),
        macHost: macAddr2,
        batteryPercent: bluetoothObject.device_batteryPercent || null,
        type: parseBluetoothType(typeStr),
        connected: bluetoothObject.device_isconnected === 'attrib_Yes' || false,
    };
    if (bluetoothObject.device_name && bluetoothObject.device_name.includes('Bluetooth')) {
        result.name = bluetoothObject.device_name;
        result.manufacturer =
            bluetoothObject.device_manufacturer ||
                parseBluetoothVendor(bluetoothObject.device_vendorID || '') ||
                parseBluetoothManufacturer(bluetoothObject.device_name) ||
                '';
        // device_type doesn't exist in IDarwinBluetoothObject
        // result.type = parseBluetoothType(bluetoothObject.device_type) || result.type;
    }
    return result;
}
/**
 * Get bluetooth devices information
 */
export function bluetoothDevices(options = {}, callback) {
    // Get platform flags from options
    const platform = getPlatformFlagsFromOptions(options);
    /**
     * Helper function to fetch all Bluetooth devices with pagination
     */
    async function fetchAllDevices() {
        const allDevices = [];
        let skip = 0;
        const batchSize = 100;
        let totalCount = 0;
        let hasMoreData = true;
        // Keep fetching until we have all devices
        while (hasMoreData) {
            try {
                // Get the script path
                const scriptPath = getBluetoothScriptPath();
                // Execute the script with parameters properly passed as separate args
                options.batch = {
                    skip,
                    batchSize,
                };
                const batchResult = await util.executeScript(scriptPath, options);
                // Parse the batch results
                const batchData = JSON.parse(batchResult.toString());
                // Extract the device items and metadata
                const items = batchData.Items || [];
                totalCount = batchData.TotalCount || 0;
                // Add devices from this batch to our collection
                if (Array.isArray(items)) {
                    allDevices.push(...items);
                }
                // Determine if we need to fetch more batches
                skip += batchSize;
                if (skip >= totalCount || items.length === 0) {
                    hasMoreData = false;
                }
            }
            catch (error) {
                console.error(`Error fetching batch starting at ${skip}:`, error);
                hasMoreData = false; // Stop on error
            }
        }
        return allDevices;
    }
    return new Promise((resolve) => {
        process.nextTick(async () => {
            const result = [];
            if (platform._linux) {
                // get files in /var/lib/bluetooth/ recursive
                const btFiles = util.getFilesInPath('/var/lib/bluetooth/');
                for (const element of btFiles) {
                    const filename = path.basename(element);
                    const pathParts = element.split('/');
                    const macAddr1 = pathParts.length >= 6 ? (pathParts.at(-2) ?? null) : null;
                    const macAddr2 = pathParts.length >= 7 ? (pathParts.at(-3) ?? null) : null;
                    if (filename === 'info') {
                        const infoFile = fs.readFileSync(element, { encoding: 'utf8' }).split('\n');
                        result.push(parseLinuxBluetoothInfo(infoFile, macAddr1, macAddr2));
                    }
                }
                // determine "connected" with hcitool con
                try {
                    const hdicon = execSync('hcitool con', util.execOptsLinux).toString().toLowerCase();
                    for (const device of result) {
                        if (device.macDevice &&
                            device.macDevice.length > 10 &&
                            hdicon.includes(device.macDevice.toLowerCase())) {
                            device.connected = true;
                        }
                    }
                }
                catch {
                    util.noop();
                }
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
            else if (platform._darwin) {
                const cmd = 'system_profiler SPBluetoothDataType -json';
                exec(cmd, (error, stdout) => {
                    if (!error) {
                        try {
                            const outObj = JSON.parse(stdout.toString());
                            if (outObj.SPBluetoothDataType &&
                                outObj.SPBluetoothDataType.length > 0 &&
                                outObj.SPBluetoothDataType[0] &&
                                outObj.SPBluetoothDataType[0].device_title &&
                                outObj.SPBluetoothDataType[0].device_title.length > 0) {
                                // missing: host BT Adapter macAddr ()
                                let macAddr2 = null;
                                if (outObj.SPBluetoothDataType[0].local_device_title &&
                                    outObj.SPBluetoothDataType[0].local_device_title.general_address) {
                                    macAddr2 = outObj.SPBluetoothDataType[0].local_device_title.general_address
                                        .toLowerCase()
                                        .replaceAll('-', ':');
                                }
                                for (const element of outObj.SPBluetoothDataType[0].device_title) {
                                    const obj = element;
                                    const objKey = Object.keys(obj);
                                    if (objKey && objKey.length === 1) {
                                        const innerObject = obj[objKey[0]];
                                        innerObject.device_name = objKey[0];
                                        const bluetoothDevice = parseDarwinBluetoothDevices(innerObject, macAddr2);
                                        result.push(bluetoothDevice);
                                    }
                                }
                            }
                            if (outObj.SPBluetoothDataType &&
                                outObj.SPBluetoothDataType.length > 0 &&
                                outObj.SPBluetoothDataType[0] &&
                                outObj.SPBluetoothDataType[0].device_connected &&
                                outObj.SPBluetoothDataType[0].device_connected.length > 0) {
                                const macAddr2 = outObj.SPBluetoothDataType[0].controller_properties &&
                                    outObj.SPBluetoothDataType[0].controller_properties.controller_address
                                    ? outObj.SPBluetoothDataType[0].controller_properties.controller_address
                                        .toLowerCase()
                                        .replaceAll('-', ':')
                                    : null;
                                for (const element of outObj.SPBluetoothDataType[0].device_connected) {
                                    const obj = element;
                                    const objKey = Object.keys(obj);
                                    if (objKey && objKey.length === 1) {
                                        const innerObject = obj[objKey[0]];
                                        innerObject.device_name = objKey[0];
                                        innerObject.device_isconnected = 'attrib_Yes';
                                        const bluetoothDevice = parseDarwinBluetoothDevices(innerObject, macAddr2);
                                        result.push(bluetoothDevice);
                                    }
                                }
                            }
                            if (outObj.SPBluetoothDataType &&
                                outObj.SPBluetoothDataType.length > 0 &&
                                outObj.SPBluetoothDataType[0] &&
                                outObj.SPBluetoothDataType[0].device_not_connected &&
                                outObj.SPBluetoothDataType[0].device_not_connected.length > 0) {
                                const macAddr2 = outObj.SPBluetoothDataType[0].controller_properties &&
                                    outObj.SPBluetoothDataType[0].controller_properties.controller_address
                                    ? outObj.SPBluetoothDataType[0].controller_properties.controller_address
                                        .toLowerCase()
                                        .replaceAll('-', ':')
                                    : null;
                                for (const element of outObj.SPBluetoothDataType[0].device_not_connected) {
                                    const obj = element;
                                    const objKey = Object.keys(obj);
                                    if (objKey && objKey.length === 1) {
                                        const innerObject = obj[objKey[0]];
                                        innerObject.device_name = objKey[0];
                                        innerObject.device_isconnected = 'attrib_No';
                                        const bluetoothDevice = parseDarwinBluetoothDevices(innerObject, macAddr2);
                                        result.push(bluetoothDevice);
                                    }
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
            else if (platform._windows) {
                try {
                    const devices = await fetchAllDevices();
                    if (callback) {
                        callback(devices);
                    }
                    resolve(devices);
                }
                catch (error) {
                    console.error('Bluetooth script error:', error);
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                }
            }
            else if (platform._freebsd || platform._netbsd || platform._openbsd || platform._sunos) {
                resolve([]);
            }
            else {
                // Unsupported platform
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
        });
    });
}
