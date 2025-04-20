import { audio as audioLib } from '../lib/module/audio';
// Import system information modules with unique names
import { battery as batteryLib } from '../lib/module/battery';
import { bluetoothDevices as bluetoothDevicesLib } from '../lib/module/bluetooth';
import { cpu as cpuLib } from '../lib/module/cpu';
import { files as filesLib } from '../lib/module/files';
import { blockDevices as blockDevicesLib, diskLayout as diskLayoutLib, disksIO as disksIOLib, fsOpenFiles as fsOpenFilesLib, fsSize as fsSizeLib, fsStats as fsStatsLib, } from '../lib/module/filesystem';
import { gps as gpsLib } from '../lib/module/gps';
import { graphics as graphicsLib } from '../lib/module/graphics';
import { inetLatency as inetLatencyLib } from '../lib/module/internet';
import { mem as memLib, memLayout as memLayoutLib } from '../lib/module/memory';
import { networkConnections as networkConnectionsLib, networkGatewayDefault as networkGatewayDefaultLib, networkInterfaceDefault as networkInterfaceDefaultLib, networkInterfaces as networkInterfacesLib, networkStats as networkStatsLib, } from '../lib/module/network';
import { applications as applicationsLib, osInfo as osInfoLib, shell as shellLib, time as timeLib, uuid as uuidLib, } from '../lib/module/osinfo';
import { printer as printerLib } from '../lib/module/printer';
import { processes as processesLib } from '../lib/module/processes';
import { services as servicesLib } from '../lib/module/services';
import { baseboard as baseboardLib, bios as biosLib, chassis as chassisLib, system as systemLib, } from '../lib/module/system';
import { screenshotViaWinRM } from '../lib/module/todo/screenshot';
import { usb as usbLib } from '../lib/module/usb';
import { users as usersLib } from '../lib/module/users';
import { wifiConnections as wifiConnectionsLib, wifiInterfaces as wifiInterfacesLib, wifiNetworks as wifiNetworksLib, } from '../lib/module/wifi';
import { createWinRMWrapper, promisifyWithData } from './util';
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
const createSystemInfoFunction = (libFunction) => withTryCatch(createWinRMWrapper(promisifyWithData(libFunction)));
// Group functions by category and use the helper function to create them
// Wifi
export const wifiNetworks = createSystemInfoFunction(wifiNetworksLib);
export const wifiInterfaces = createSystemInfoFunction(wifiInterfacesLib);
export const wifiConnections = createSystemInfoFunction(wifiConnectionsLib);
// Battery
export const battery = createSystemInfoFunction(batteryLib);
// Audio
export const audio = createSystemInfoFunction(audioLib);
// Bluetooth
export const bluetoothDevices = createSystemInfoFunction(bluetoothDevicesLib);
// CPU
export const cpu = createSystemInfoFunction(cpuLib);
// Graphics
export const graphics = createSystemInfoFunction(graphicsLib);
// Filesystem
export const disksIO = createSystemInfoFunction(disksIOLib);
export const diskLayout = createSystemInfoFunction(diskLayoutLib);
export const blockDevices = createSystemInfoFunction(blockDevicesLib);
export const fsSize = createSystemInfoFunction(fsSizeLib);
export const fsOpenFiles = createSystemInfoFunction(fsOpenFilesLib);
export const fsStats = createSystemInfoFunction(fsStatsLib);
// Internet
export const inetLatency = createSystemInfoFunction(inetLatencyLib);
// Memory
export const mem = createSystemInfoFunction(memLib);
export const memLayout = createSystemInfoFunction(memLayoutLib);
// Network
export const networkInterfaces = createSystemInfoFunction(networkInterfacesLib);
export const networkInterfaceDefault = createSystemInfoFunction(networkInterfaceDefaultLib);
export const networkGatewayDefault = createSystemInfoFunction(networkGatewayDefaultLib);
export const networkConnections = createSystemInfoFunction(networkConnectionsLib);
export const networkStats = createSystemInfoFunction(networkStatsLib);
// OS
export const osInfo = createSystemInfoFunction(osInfoLib);
export const applications = createSystemInfoFunction(applicationsLib);
export const shell = createSystemInfoFunction(shellLib);
export const uuid = createSystemInfoFunction(uuidLib);
export const time = createSystemInfoFunction(timeLib);
// Printer
export const printer = createSystemInfoFunction(printerLib);
// System
export const system = createSystemInfoFunction(systemLib);
export const baseboard = createSystemInfoFunction(baseboardLib);
export const chassis = createSystemInfoFunction(chassisLib);
export const bios = createSystemInfoFunction(biosLib);
// USB
export const usb = createSystemInfoFunction(usbLib);
// Users
export const users = createSystemInfoFunction(usersLib);
// GPS
export const gps = createSystemInfoFunction(gpsLib);
// Processes
export const processes = createSystemInfoFunction(processesLib);
export const services = createSystemInfoFunction(servicesLib);
// Files
export const files = createSystemInfoFunction(filesLib);
// Screenshot
export const screenshot = createSystemInfoFunction(screenshotViaWinRM);
