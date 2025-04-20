"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.files = exports.services = exports.processes = exports.gps = exports.users = exports.usb = exports.bios = exports.chassis = exports.baseboard = exports.system = exports.printer = exports.time = exports.uuid = exports.shell = exports.applications = exports.osInfo = exports.networkStats = exports.networkConnections = exports.networkGatewayDefault = exports.networkInterfaceDefault = exports.networkInterfaces = exports.memLayout = exports.mem = exports.inetLatency = exports.fsStats = exports.fsOpenFiles = exports.fsSize = exports.blockDevices = exports.diskLayout = exports.disksIO = exports.graphics = exports.cpu = exports.bluetoothDevices = exports.audio = exports.battery = exports.wifiConnections = exports.wifiInterfaces = exports.wifiNetworks = void 0;
const audio_1 = require("../lib/module/audio");
// Import system information modules with unique names
const battery_1 = require("../lib/module/battery");
const bluetooth_1 = require("../lib/module/bluetooth");
const cpu_1 = require("../lib/module/cpu");
const files_1 = require("../lib/module/files");
const filesystem_1 = require("../lib/module/filesystem");
const gps_1 = require("../lib/module/gps");
const graphics_1 = require("../lib/module/graphics");
const internet_1 = require("../lib/module/internet");
const memory_1 = require("../lib/module/memory");
const network_1 = require("../lib/module/network");
const osinfo_1 = require("../lib/module/osinfo");
const printer_1 = require("../lib/module/printer");
const processes_1 = require("../lib/module/processes");
const services_1 = require("../lib/module/services");
const system_1 = require("../lib/module/system");
// import { screenshotViaWinRM } from '../lib/module/todo/screenshot';
const usb_1 = require("../lib/module/usb");
const users_1 = require("../lib/module/users");
const wifi_1 = require("../lib/module/wifi");
const util_1 = require("./util");
/**
 * Wraps a function with try-catch block for error handling
 *
 * @param fn - The function to wrap with try-catch
 * @returns A function with try-catch error handling
 */
const withTryCatch = (fn) => async (...args) => {
    // Extract function name from function or its properties
    let taskName = fn.name || 'unknown';
    if (fn._name) {
        taskName = fn._name;
    }
    if (fn._fnName) {
        taskName = fn._fnName;
    }
    try {
        return await fn(...args);
    }
    catch (error) {
        return { error: error.message, success: false };
    }
};
/**
 * Helper function to create properly wrapped system information functions
 *
 * @param libFunction - The library function to wrap
 * @returns A function wrapped with withTryCatch, createWinRMWrapper, and promisifyWithData
 */
const createSystemInfoFunction = (libFunction) => withTryCatch((0, util_1.createWinRMWrapper)((0, util_1.promisifyWithData)(libFunction)));
// Group functions by category and use the helper function to create them
// Wifi
exports.wifiNetworks = createSystemInfoFunction(wifi_1.wifiNetworks);
exports.wifiInterfaces = createSystemInfoFunction(wifi_1.wifiInterfaces);
exports.wifiConnections = createSystemInfoFunction(wifi_1.wifiConnections);
// Battery
exports.battery = createSystemInfoFunction(battery_1.battery);
// Audio
exports.audio = createSystemInfoFunction(audio_1.audio);
// Bluetooth
exports.bluetoothDevices = createSystemInfoFunction(bluetooth_1.bluetoothDevices);
// CPU
exports.cpu = createSystemInfoFunction(cpu_1.cpu);
// Graphics
exports.graphics = createSystemInfoFunction(graphics_1.graphics);
// Filesystem
exports.disksIO = createSystemInfoFunction(filesystem_1.disksIO);
exports.diskLayout = createSystemInfoFunction(filesystem_1.diskLayout);
exports.blockDevices = createSystemInfoFunction(filesystem_1.blockDevices);
exports.fsSize = createSystemInfoFunction(filesystem_1.fsSize);
exports.fsOpenFiles = createSystemInfoFunction(filesystem_1.fsOpenFiles);
exports.fsStats = createSystemInfoFunction(filesystem_1.fsStats);
// Internet
exports.inetLatency = createSystemInfoFunction(internet_1.inetLatency);
// Memory
exports.mem = createSystemInfoFunction(memory_1.mem);
exports.memLayout = createSystemInfoFunction(memory_1.memLayout);
// Network
exports.networkInterfaces = createSystemInfoFunction(network_1.networkInterfaces);
exports.networkInterfaceDefault = createSystemInfoFunction(network_1.networkInterfaceDefault);
exports.networkGatewayDefault = createSystemInfoFunction(network_1.networkGatewayDefault);
exports.networkConnections = createSystemInfoFunction(network_1.networkConnections);
exports.networkStats = createSystemInfoFunction(network_1.networkStats);
// OS
exports.osInfo = createSystemInfoFunction(osinfo_1.osInfo);
exports.applications = createSystemInfoFunction(osinfo_1.applications);
exports.shell = createSystemInfoFunction(osinfo_1.shell);
exports.uuid = createSystemInfoFunction(osinfo_1.uuid);
exports.time = createSystemInfoFunction(osinfo_1.time);
// Printer
exports.printer = createSystemInfoFunction(printer_1.printer);
// System
exports.system = createSystemInfoFunction(system_1.system);
exports.baseboard = createSystemInfoFunction(system_1.baseboard);
exports.chassis = createSystemInfoFunction(system_1.chassis);
exports.bios = createSystemInfoFunction(system_1.bios);
// USB
exports.usb = createSystemInfoFunction(usb_1.usb);
// Users
exports.users = createSystemInfoFunction(users_1.users);
// GPS
exports.gps = createSystemInfoFunction(gps_1.gps);
// Processes
exports.processes = createSystemInfoFunction(processes_1.processes);
exports.services = createSystemInfoFunction(services_1.services);
// Files
exports.files = createSystemInfoFunction(files_1.files);
// Screenshot
// export const screenshot = createSystemInfoFunction(screenshotViaWinRM);
