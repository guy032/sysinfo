"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaticInfo = getStaticInfo;
exports.getDynamicInfo = getDynamicInfo;
exports.getAllInfo = getAllInfo;
const tslib_1 = require("tslib");
const nodejs_winrm_1 = tslib_1.__importDefault(require("nodejs-winrm"));
const lib_1 = require("./src/promise/lib");
/**
 * Get all static system information
 * Static information includes hardware details, system configuration, installed applications, etc.
 *
 * @param options - WinRM connection options
 * @returns Promise with static system information
 */
async function getStaticInfo(options) {
    const results = {};
    // Create options object with winrm library
    const fullOptions = { ...options, winrm: nodejs_winrm_1.default };
    // Hardware information
    const baseboardInfo = await (0, lib_1.baseboard)(fullOptions);
    const biosInfo = await (0, lib_1.bios)(fullOptions);
    const chassisInfo = await (0, lib_1.chassis)(fullOptions);
    const cpuInfo = await (0, lib_1.cpu)(fullOptions);
    const diskLayoutInfo = await (0, lib_1.diskLayout)(fullOptions);
    const graphicsInfo = await (0, lib_1.graphics)(fullOptions);
    const memLayoutInfo = await (0, lib_1.memLayout)(fullOptions);
    const systemInfo = await (0, lib_1.system)(fullOptions);
    const usbInfo = await (0, lib_1.usb)(fullOptions);
    // OS information
    const osInfoData = await (0, lib_1.osInfo)(fullOptions);
    const applicationsInfo = await (0, lib_1.applications)(fullOptions);
    const shellInfo = await (0, lib_1.shell)(fullOptions);
    const uuidInfo = await (0, lib_1.uuid)(fullOptions);
    const timeInfo = await (0, lib_1.time)(fullOptions);
    // Network hardware information
    const networkInterfacesInfo = await (0, lib_1.networkInterfaces)(fullOptions);
    const wifiInterfacesInfo = await (0, lib_1.wifiInterfaces)(fullOptions);
    const wifiNetworksInfo = await (0, lib_1.wifiNetworks)(fullOptions);
    // User information
    const usersInfo = await (0, lib_1.users)(fullOptions);
    // Printer information
    const printerInfo = await (0, lib_1.printer)(fullOptions);
    // Combine all static information
    results.baseboard = baseboardInfo;
    results.bios = biosInfo;
    results.chassis = chassisInfo;
    results.cpu = cpuInfo;
    results.diskLayout = diskLayoutInfo;
    results.graphics = graphicsInfo;
    results.memLayout = memLayoutInfo;
    results.system = systemInfo;
    results.usb = usbInfo;
    results.osInfo = osInfoData;
    results.applications = applicationsInfo;
    results.shell = shellInfo;
    results.uuid = uuidInfo;
    results.time = timeInfo;
    results.networkInterfaces = networkInterfacesInfo;
    results.wifiInterfaces = wifiInterfacesInfo;
    results.wifiNetworks = wifiNetworksInfo;
    results.users = usersInfo;
    results.printer = printerInfo;
    return results;
}
/**
 * Get all dynamic system information
 * Dynamic information includes processes, network connections, memory usage, etc.
 *
 * @param options - WinRM connection options
 * @returns Promise with dynamic system information
 */
async function getDynamicInfo(options) {
    const results = {};
    // Create options object with winrm library
    const fullOptions = { ...options, winrm: nodejs_winrm_1.default };
    // Process and service information
    const processesInfo = await (0, lib_1.processes)(fullOptions);
    const servicesInfo = await (0, lib_1.services)(fullOptions);
    // Memory usage
    const memInfo = await (0, lib_1.mem)(fullOptions);
    // Network information
    const networkConnectionsInfo = await (0, lib_1.networkConnections)(fullOptions);
    const networkGatewayDefaultInfo = await (0, lib_1.networkGatewayDefault)(fullOptions);
    const networkInterfaceDefaultInfo = await (0, lib_1.networkInterfaceDefault)(fullOptions);
    const networkStatsInfo = await (0, lib_1.networkStats)(fullOptions);
    const wifiConnectionsInfo = await (0, lib_1.wifiConnections)(fullOptions);
    // Internet information
    const inetLatencyInfo = await (0, lib_1.inetLatency)(fullOptions);
    // File system information
    const blockDevicesInfo = await (0, lib_1.blockDevices)(fullOptions);
    const fsSizeInfo = await (0, lib_1.fsSize)(fullOptions);
    const fsStatsInfo = await (0, lib_1.fsStats)(fullOptions);
    const fsOpenFilesInfo = await (0, lib_1.fsOpenFiles)(fullOptions);
    // Battery information
    const batteryInfo = await (0, lib_1.battery)(fullOptions);
    // Audio information
    const audioInfo = await (0, lib_1.audio)(fullOptions);
    // Bluetooth information
    const bluetoothDevicesInfo = await (0, lib_1.bluetoothDevices)(fullOptions);
    // GPS information
    const gpsInfo = await (0, lib_1.gps)(fullOptions);
    // Combine all dynamic information
    results.processes = processesInfo;
    results.services = servicesInfo;
    results.mem = memInfo;
    results.networkConnections = networkConnectionsInfo;
    results.networkGatewayDefault = networkGatewayDefaultInfo;
    results.networkInterfaceDefault = networkInterfaceDefaultInfo;
    results.networkStats = networkStatsInfo;
    results.wifiConnections = wifiConnectionsInfo;
    results.inetLatency = inetLatencyInfo;
    results.blockDevices = blockDevicesInfo;
    results.fsSize = fsSizeInfo;
    results.fsStats = fsStatsInfo;
    results.fsOpenFiles = fsOpenFilesInfo;
    results.battery = batteryInfo;
    results.audio = audioInfo;
    results.bluetoothDevices = bluetoothDevicesInfo;
    results.gps = gpsInfo;
    return results;
}
/**
 * Get all system information (both static and dynamic)
 *
 * @param options - WinRM connection options
 * @returns Promise with all system information
 */
async function getAllInfo(options) {
    const staticInfo = await getStaticInfo(options);
    const dynamicInfo = await getDynamicInfo(options);
    // Combine static and dynamic information
    return {
        ...staticInfo,
        ...dynamicInfo,
    };
}
