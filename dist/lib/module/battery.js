// ==================================================================================
// battery.ts
// ----------------------------------------------------------------------------------
// Description:   System Information - library
//                for Node.js
// Copyright:     (c) 2014 - 2025
// Author:        Sebastian Hildebrandt
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 6. Battery
// ----------------------------------------------------------------------------------
import { exec } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import * as util from '../util';
import { getPlatformFlagsFromOptions } from '../util/platform';
/**
 * Get the path to the PowerShell script
 * @returns The absolute path to the battery PowerShell script
 */
function getBatteryScriptPath() {
    // Calculate the path to the PowerShell script relative to this file
    return path.resolve(__dirname, '../../powershell/battery.ps1');
}
/**
 * Helper function to handle callback and promise resolution
 */
function handleResult(result, resolve, callback) {
    if (callback) {
        callback(result);
    }
    resolve(result);
}
/**
 * Parse Windows battery data
 */
function parseWinBatteryPart(lines, designedCapacity, fullChargeCapacity) {
    const result = {};
    const status = util.getValue(lines, 'BatteryStatus', ':').trim();
    // 1 = "Discharging"
    // 2 = "On A/C"
    // 3 = "Fully Charged"
    // 4 = "Low"
    // 5 = "Critical"
    // 6 = "Charging"
    // 7 = "Charging High"
    // 8 = "Charging Low"
    // 9 = "Charging Critical"
    // 10 = "Undefined"
    // 11 = "Partially Charged"
    if (status >= '0') {
        const statusValue = status ? Number.parseInt(status, 10) : 0;
        result.status = statusValue;
        result.hasBattery = true;
        result.maxCapacity =
            fullChargeCapacity || Number.parseInt(util.getValue(lines, 'DesignCapacity', ':') || '0', 10);
        result.designedCapacity = Number.parseInt(util.getValue(lines, 'DesignCapacity', ':') || designedCapacity.toString(), 10);
        result.voltage = Number.parseInt(util.getValue(lines, 'DesignVoltage', ':') || '0', 10) / 1000;
        result.capacityUnit = 'mWh';
        result.percent = Number.parseInt(util.getValue(lines, 'EstimatedChargeRemaining', ':') || '0', 10);
        result.currentCapacity = Math.round((Number(result.maxCapacity) * Number(result.percent)) / 100);
        result.isCharging =
            (statusValue >= 6 && statusValue <= 9) ||
                statusValue === 11 ||
                (statusValue !== 3 && statusValue !== 1 && (result.percent ?? 0) < 100);
        result.acConnected = result.isCharging || statusValue === 2;
        result.model = util.getValue(lines, 'DeviceID', ':');
    }
    else {
        result.status = -1;
    }
    return result;
}
/**
 * Get battery information
 */
export function battery(options = {}, callback) {
    // Get platform flags from options
    const platform = getPlatformFlagsFromOptions(options);
    return new Promise((resolve) => {
        process.nextTick(() => {
            const result = {
                hasBattery: false,
                cycleCount: 0,
                isCharging: false,
                designedCapacity: 0,
                maxCapacity: 0,
                currentCapacity: 0,
                voltage: 0,
                capacityUnit: '',
                percent: 0,
                timeRemaining: null,
                acConnected: true,
                type: '',
                model: '',
                manufacturer: '',
                serial: '',
            };
            if (platform._linux) {
                let battery_path = '';
                if (fs.existsSync('/sys/class/power_supply/BAT1/uevent')) {
                    battery_path = '/sys/class/power_supply/BAT1/';
                }
                else if (fs.existsSync('/sys/class/power_supply/BAT0/uevent')) {
                    battery_path = '/sys/class/power_supply/BAT0/';
                }
                let acConnected = false;
                let acPath = '';
                if (fs.existsSync('/sys/class/power_supply/AC/online')) {
                    acPath = '/sys/class/power_supply/AC/online';
                }
                else if (fs.existsSync('/sys/class/power_supply/AC0/online')) {
                    acPath = '/sys/class/power_supply/AC0/online';
                }
                if (acPath) {
                    const file = fs.readFileSync(acPath);
                    acConnected = file.toString().trim() === '1';
                }
                if (battery_path) {
                    fs.readFile(battery_path + 'uevent', (error, stdout) => {
                        if (error) {
                            handleResult(result, resolve, callback);
                        }
                        else {
                            const lines = stdout.toString().split('\n');
                            result.isCharging =
                                util.getValue(lines, 'POWER_SUPPLY_STATUS', '=').toLowerCase() === 'charging';
                            result.acConnected = acConnected || result.isCharging;
                            result.voltage =
                                Number.parseInt('0' + util.getValue(lines, 'POWER_SUPPLY_VOLTAGE_NOW', '='), 10) /
                                    1_000_000;
                            result.capacityUnit = result.voltage ? 'mWh' : 'mAh';
                            result.cycleCount = Number.parseInt('0' + util.getValue(lines, 'POWER_SUPPLY_CYCLE_COUNT', '='), 10);
                            result.maxCapacity = Math.round((Number.parseInt('0' + util.getValue(lines, 'POWER_SUPPLY_CHARGE_FULL', '=', true, true), 10) /
                                1000) *
                                (result.voltage || 1));
                            const desingedMinVoltage = Number.parseInt('0' + util.getValue(lines, 'POWER_SUPPLY_VOLTAGE_MIN_DESIGN', '='), 10) / 1_000_000;
                            result.designedCapacity = Math.round((Number.parseInt('0' + util.getValue(lines, 'POWER_SUPPLY_CHARGE_FULL_DESIGN', '=', true, true), 10) /
                                1000) *
                                (desingedMinVoltage || result.voltage || 1));
                            result.currentCapacity = Math.round((Number.parseInt('0' + util.getValue(lines, 'POWER_SUPPLY_CHARGE_NOW', '='), 10) /
                                1000) *
                                (result.voltage || 1));
                            if (!result.maxCapacity) {
                                result.maxCapacity =
                                    Number.parseInt('0' + util.getValue(lines, 'POWER_SUPPLY_ENERGY_FULL', '=', true, true), 10) / 1000;
                                result.designedCapacity =
                                    Number.parseInt('0' + util.getValue(lines, 'POWER_SUPPLY_ENERGY_FULL_DESIGN', '=', true, true), 10) / 1000 || result.maxCapacity;
                                result.currentCapacity =
                                    Number.parseInt('0' + util.getValue(lines, 'POWER_SUPPLY_ENERGY_NOW', '='), 10) /
                                        1000;
                            }
                            const percent = util.getValue(lines, 'POWER_SUPPLY_CAPACITY', '=');
                            const energy = Number.parseInt('0' + util.getValue(lines, 'POWER_SUPPLY_ENERGY_NOW', '='), 10);
                            const power = Number.parseInt('0' + util.getValue(lines, 'POWER_SUPPLY_POWER_NOW', '='), 10);
                            const current = Number.parseInt('0' + util.getValue(lines, 'POWER_SUPPLY_CURRENT_NOW', '='), 10);
                            const charge = Number.parseInt('0' + util.getValue(lines, 'POWER_SUPPLY_CHARGE_NOW', '='), 10);
                            result.percent = Number.parseInt('0' + percent, 10);
                            if (result.maxCapacity && result.currentCapacity) {
                                result.hasBattery = true;
                                if (!percent) {
                                    result.percent = (100 * result.currentCapacity) / result.maxCapacity;
                                }
                            }
                            if (result.isCharging) {
                                result.hasBattery = true;
                            }
                            if (energy && power) {
                                result.timeRemaining = Math.floor((energy / power) * 60);
                            }
                            else if (current && charge) {
                                result.timeRemaining = Math.floor((charge / current) * 60);
                            }
                            else if (current && result.currentCapacity) {
                                result.timeRemaining = Math.floor((result.currentCapacity / current) * 60);
                            }
                            result.type = util.getValue(lines, 'POWER_SUPPLY_TECHNOLOGY', '=');
                            result.model = util.getValue(lines, 'POWER_SUPPLY_MODEL_NAME', '=');
                            result.manufacturer = util.getValue(lines, 'POWER_SUPPLY_MANUFACTURER', '=');
                            result.serial = util.getValue(lines, 'POWER_SUPPLY_SERIAL_NUMBER', '=');
                            handleResult(result, resolve, callback);
                        }
                    });
                }
                else {
                    handleResult(result, resolve, callback);
                }
            }
            else if (platform._freebsd || platform._openbsd || platform._netbsd) {
                exec('sysctl -i hw.acpi.battery hw.acpi.acline', (error, stdout) => {
                    if (!error) {
                        const lines = stdout.toString().split('\n');
                        const batteries = Number.parseInt('0' + util.getValue(lines, 'hw.acpi.battery.units'), 10);
                        const percent = Number.parseInt('0' + util.getValue(lines, 'hw.acpi.battery.life'), 10);
                        result.hasBattery = batteries > 0;
                        result.cycleCount = 0;
                        result.isCharging = util.getValue(lines, 'hw.acpi.acline') !== '1';
                        result.acConnected = result.isCharging;
                        result.percent = batteries ? percent : 0;
                    }
                    handleResult(result, resolve, callback);
                });
            }
            else if (platform._darwin) {
                exec('ioreg -n AppleSmartBattery -r | egrep "CycleCount|IsCharging|DesignCapacity|MaxCapacity|CurrentCapacity|DeviceName|BatterySerialNumber|Serial|TimeRemaining|Voltage"; pmset -g batt | grep %', (error, stdout) => {
                    if (stdout) {
                        const lines = stdout
                            .toString()
                            .replaceAll(/ +/g, '')
                            .replaceAll(/"+/g, '')
                            .replaceAll('-', '')
                            .split('\n');
                        result.cycleCount = Number.parseInt('0' + util.getValue(lines, 'cyclecount', '='), 10);
                        result.voltage =
                            Number.parseInt('0' + util.getValue(lines, 'voltage', '='), 10) / 1000;
                        result.capacityUnit = result.voltage ? 'mWh' : 'mAh';
                        result.maxCapacity = Math.round(Number.parseInt('0' + util.getValue(lines, 'applerawmaxcapacity', '='), 10) *
                            (result.voltage || 1));
                        result.currentCapacity = Math.round(Number.parseInt('0' + util.getValue(lines, 'applerawcurrentcapacity', '='), 10) *
                            (result.voltage || 1));
                        result.designedCapacity = Math.round(Number.parseInt('0' + util.getValue(lines, 'DesignCapacity', '='), 10) *
                            (result.voltage || 1));
                        result.manufacturer = 'Apple';
                        result.serial =
                            util.getValue(lines, 'BatterySerialNumber', '=') ||
                                util.getValue(lines, 'Serial', '=');
                        result.model = util.getValue(lines, 'DeviceName', '=');
                        let percent = null;
                        const line = util.getValue(lines, 'internal', 'Battery');
                        const parts = line.split(';');
                        if (parts && parts[0]) {
                            const parts2 = parts[0].split('\t');
                            if (parts2 && parts2[1]) {
                                percent = Number.parseFloat(parts2[1].trim().replaceAll('%', ''));
                            }
                        }
                        if (parts && parts[1]) {
                            result.isCharging = parts[1].trim() === 'charging';
                            result.acConnected = parts[1].trim() !== 'discharging';
                        }
                        else {
                            result.isCharging = util.getValue(lines, 'ischarging', '=').toLowerCase() === 'yes';
                            result.acConnected = result.isCharging;
                        }
                        if (result.maxCapacity && result.currentCapacity) {
                            result.hasBattery = true;
                            result.type = 'Li-ion';
                            result.percent =
                                percent === null
                                    ? Math.round((100 * result.currentCapacity) / result.maxCapacity)
                                    : percent;
                            if (!result.isCharging) {
                                result.timeRemaining =
                                    Number.parseInt('0' + util.getValue(lines, 'TimeRemaining', '='), 10) || null;
                            }
                        }
                    }
                    handleResult(result, resolve, callback);
                });
            }
            else if (platform._sunos) {
                handleResult(result, resolve, callback);
            }
            else if (platform._windows) {
                try {
                    // Get the path to the PowerShell script file
                    const scriptPath = getBatteryScriptPath();
                    // Execute the PowerShell script file
                    util
                        .executeScript(scriptPath, options)
                        .then((stdout) => {
                        try {
                            // Parse the JSON output from the script
                            const batteryData = JSON.parse(stdout.toString());
                            if (batteryData && batteryData.BatteryData) {
                                const batteries = Array.isArray(batteryData.BatteryData)
                                    ? batteryData.BatteryData
                                    : [batteryData.BatteryData];
                                const designCapacities = Array.isArray(batteryData.DesignedCapacity)
                                    ? batteryData.DesignedCapacity
                                    : [batteryData.DesignedCapacity];
                                const fullChargeCapacities = Array.isArray(batteryData.FullChargedCapacity)
                                    ? batteryData.FullChargedCapacity
                                    : [batteryData.FullChargedCapacity];
                                if (batteries.length > 0) {
                                    let first = false;
                                    const additionalBatteries = [];
                                    for (const [i, battery] of batteries.entries()) {
                                        const lines = Object.entries(battery).map(([key, value]) => `${key} : ${value}`);
                                        const designedCapacity = designCapacities && designCapacities.length >= i + 1 && designCapacities[i]
                                            ? util.toInt(designCapacities[i])
                                            : 0;
                                        const fullChargeCapacity = fullChargeCapacities &&
                                            fullChargeCapacities.length >= i + 1 &&
                                            fullChargeCapacities[i]
                                            ? util.toInt(fullChargeCapacities[i])
                                            : 0;
                                        const parsed = parseWinBatteryPart(lines, designedCapacity, fullChargeCapacity);
                                        if (!first && parsed.status && parsed.status > 0 && parsed.status !== 10) {
                                            result.hasBattery = parsed.hasBattery || false;
                                            result.maxCapacity = parsed.maxCapacity || 0;
                                            result.designedCapacity = parsed.designedCapacity || 0;
                                            result.voltage = parsed.voltage || 0;
                                            result.capacityUnit = parsed.capacityUnit || '';
                                            result.percent = parsed.percent || 0;
                                            result.currentCapacity = parsed.currentCapacity || 0;
                                            result.isCharging = parsed.isCharging || false;
                                            result.acConnected = parsed.acConnected || false;
                                            result.model = parsed.model || '';
                                            first = true;
                                        }
                                        else if (parsed.status !== -1) {
                                            additionalBatteries.push({
                                                hasBattery: parsed.hasBattery || false,
                                                maxCapacity: parsed.maxCapacity || 0,
                                                designedCapacity: parsed.designedCapacity || 0,
                                                voltage: parsed.voltage || 0,
                                                capacityUnit: parsed.capacityUnit || '',
                                                percent: parsed.percent || 0,
                                                currentCapacity: parsed.currentCapacity || 0,
                                                isCharging: parsed.isCharging || false,
                                                cycleCount: 0,
                                                timeRemaining: null,
                                                acConnected: parsed.acConnected || false,
                                                model: parsed.model || '',
                                                type: '',
                                                manufacturer: '',
                                                serial: '',
                                            });
                                        }
                                    }
                                    if (!first && additionalBatteries.length > 0) {
                                        Object.assign(result, additionalBatteries[0]);
                                        additionalBatteries.shift();
                                    }
                                    if (additionalBatteries.length > 0) {
                                        result.additionalBatteries = additionalBatteries;
                                    }
                                }
                            }
                        }
                        catch (error) {
                            console.error('Error parsing battery data:', error);
                        }
                        handleResult(result, resolve, callback);
                    })
                        .catch((error) => {
                        console.error('Error executing battery script:', error);
                        handleResult(result, resolve, callback);
                    });
                }
                catch (error) {
                    console.error('Battery script error:', error);
                    handleResult(result, resolve, callback);
                }
            }
            else {
                handleResult(result, resolve, callback);
            }
        });
    });
}
