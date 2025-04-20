import winrm from 'nodejs-winrm';
import { applications, audio, baseboard, battery, bios, blockDevices, bluetoothDevices, chassis, cpu, diskLayout, fsOpenFiles, fsSize, fsStats, gps, graphics, inetLatency, mem, memLayout, networkConnections, networkGatewayDefault, networkInterfaceDefault, networkInterfaces, networkStats, osInfo, printer, processes, services, shell, system, time, usb, users, uuid, wifiConnections, wifiInterfaces, wifiNetworks, } from './src/promise/lib';
/**
 * Get all static system information
 * Static information includes hardware details, system configuration, installed applications, etc.
 *
 * @param options - WinRM connection options
 * @returns Promise with static system information
 */
export async function getStaticInfo(options) {
    const results = {};
    // Create options object with winrm library
    const fullOptions = { ...options, winrm };
    // Hardware information
    const baseboardInfo = await baseboard(fullOptions);
    const biosInfo = await bios(fullOptions);
    const chassisInfo = await chassis(fullOptions);
    const cpuInfo = await cpu(fullOptions);
    const diskLayoutInfo = await diskLayout(fullOptions);
    const graphicsInfo = await graphics(fullOptions);
    const memLayoutInfo = await memLayout(fullOptions);
    const systemInfo = await system(fullOptions);
    const usbInfo = await usb(fullOptions);
    // OS information
    const osInfoData = await osInfo(fullOptions);
    const applicationsInfo = await applications(fullOptions);
    const shellInfo = await shell(fullOptions);
    const uuidInfo = await uuid(fullOptions);
    const timeInfo = await time(fullOptions);
    // Network hardware information
    const networkInterfacesInfo = await networkInterfaces(fullOptions);
    const wifiInterfacesInfo = await wifiInterfaces(fullOptions);
    const wifiNetworksInfo = await wifiNetworks(fullOptions);
    // User information
    const usersInfo = await users(fullOptions);
    // Printer information
    const printerInfo = await printer(fullOptions);
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
export async function getDynamicInfo(options) {
    const results = {};
    // Create options object with winrm library
    const fullOptions = { ...options, winrm };
    // Process and service information
    const processesInfo = await processes(fullOptions);
    const servicesInfo = await services(fullOptions);
    // Memory usage
    const memInfo = await mem(fullOptions);
    // Network information
    const networkConnectionsInfo = await networkConnections(fullOptions);
    const networkGatewayDefaultInfo = await networkGatewayDefault(fullOptions);
    const networkInterfaceDefaultInfo = await networkInterfaceDefault(fullOptions);
    const networkStatsInfo = await networkStats(fullOptions);
    const wifiConnectionsInfo = await wifiConnections(fullOptions);
    // Internet information
    const inetLatencyInfo = await inetLatency(fullOptions);
    // File system information
    const blockDevicesInfo = await blockDevices(fullOptions);
    const fsSizeInfo = await fsSize(fullOptions);
    const fsStatsInfo = await fsStats(fullOptions);
    const fsOpenFilesInfo = await fsOpenFiles(fullOptions);
    // Battery information
    const batteryInfo = await battery(fullOptions);
    // Audio information
    const audioInfo = await audio(fullOptions);
    // Bluetooth information
    const bluetoothDevicesInfo = await bluetoothDevices(fullOptions);
    // GPS information
    const gpsInfo = await gps(fullOptions);
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
export async function getAllInfo(options) {
    const staticInfo = await getStaticInfo(options);
    const dynamicInfo = await getDynamicInfo(options);
    // Combine static and dynamic information
    return {
        ...staticInfo,
        ...dynamicInfo,
    };
}
