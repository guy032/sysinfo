const { promisifyWithData, createWinRMWrapper } = require('./util');

const battery = require('../lib/battery');
const { wifiNetworks: wifiNetworksLib, wifiInterfaces: wifiInterfacesLib, wifiConnections: wifiConnectionsLib } = require('../lib/wifi');
const { audio } = require('../lib/audio');
const { bluetoothDevices } = require('../lib/bluetooth');
const { cpu } = require('../lib/cpu');
const { graphics } = require('../lib/graphics');
const { disksIO, diskLayout, blockDevices, fsSize, fsOpenFiles } = require('../lib/filesystem');
const { inetLatency } = require('../lib/internet');
const { mem, memLayout } = require('../lib/memory');
const { networkInterfaces, networkStats, networkGatewayDefault, networkInterfaceDefault, networkConnections } = require('../lib/network');
const { osInfo, versions, shell, uuid, time } = require('../lib/osinfo');
const { printer } = require('../lib/printer');
const { system, baseboard, chassis, bios } = require('../lib/system');
const { usb } = require('../lib/usb');
const { users } = require('../lib/users');
const { gps } = require('../lib/gps');
const { processes, services } = require('../lib/processes');
const { screenshotViaWinRM } = require('../lib/todo/screenshot');
/**
 * Wraps a function with try-catch block for error handling
 * 
 * @param {Function} fn - The function to wrap with try-catch
 * @returns {Function} A function with try-catch error handling
 */
const withTryCatch = (fn) => {
  return async (...args) => {
    // Extract function name from function or its properties
    let taskName = fn.name || 'unknown';
    if (fn._name) taskName = fn._name;
    if (fn._fnName) taskName = fn._fnName;
    
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      return result;
    } catch (error) {
      return { error: error.message, success: false };
    }
  };
};

// Apply WinRM wrapper and try-catch to wifi functions
const wifiNetworks = withTryCatch(createWinRMWrapper(promisifyWithData(wifiNetworksLib)));
const wifiInterfaces = withTryCatch(createWinRMWrapper(promisifyWithData(wifiInterfacesLib)));
const wifiConnections = withTryCatch(createWinRMWrapper(promisifyWithData(wifiConnectionsLib)));

module.exports = {
  // Battery
  battery: withTryCatch(createWinRMWrapper(promisifyWithData(battery))),

  // Wifi
  wifiNetworks,
  wifiInterfaces,
  wifiConnections,

  // Audio
  audio: withTryCatch(createWinRMWrapper(promisifyWithData(audio))),

  // Bluetooth
  bluetoothDevices: withTryCatch(createWinRMWrapper(promisifyWithData(bluetoothDevices))),

  // CPU
  cpu: withTryCatch(createWinRMWrapper(promisifyWithData(cpu))),

  // Graphics
  graphics: withTryCatch(createWinRMWrapper(promisifyWithData(graphics))),

  // Filesystem
  disksIO: withTryCatch(createWinRMWrapper(promisifyWithData(disksIO))),
  diskLayout: withTryCatch(createWinRMWrapper(promisifyWithData(diskLayout))),
  blockDevices: withTryCatch(createWinRMWrapper(promisifyWithData(blockDevices))),
  fsSize: withTryCatch(createWinRMWrapper(promisifyWithData(fsSize))),
  fsOpenFiles: withTryCatch(createWinRMWrapper(promisifyWithData(fsOpenFiles))),

  // Internet
  inetLatency: withTryCatch(createWinRMWrapper(promisifyWithData(inetLatency))),

  // Memory
  mem: withTryCatch(createWinRMWrapper(promisifyWithData(mem))),
  memLayout: withTryCatch(createWinRMWrapper(promisifyWithData(memLayout))),

  // Network
  networkInterfaces: withTryCatch(createWinRMWrapper(promisifyWithData(networkInterfaces))),
  networkStats: withTryCatch(createWinRMWrapper(promisifyWithData(networkStats))),
  networkGatewayDefault: withTryCatch(createWinRMWrapper(promisifyWithData(networkGatewayDefault))),
  networkInterfaceDefault: withTryCatch(createWinRMWrapper(promisifyWithData(networkInterfaceDefault))),
  networkConnections: withTryCatch(createWinRMWrapper(promisifyWithData(networkConnections))),
  // OS
  osInfo: withTryCatch(createWinRMWrapper(promisifyWithData(osInfo))),
  versions: withTryCatch(createWinRMWrapper(promisifyWithData(versions))),
  shell: withTryCatch(createWinRMWrapper(promisifyWithData(shell))),
  uuid: withTryCatch(createWinRMWrapper(promisifyWithData(uuid))),
  time: withTryCatch(createWinRMWrapper(promisifyWithData(time))),

  // Printer
  printer: withTryCatch(createWinRMWrapper(promisifyWithData(printer))),

  // System
  system: withTryCatch(createWinRMWrapper(promisifyWithData(system))),
  baseboard: withTryCatch(createWinRMWrapper(promisifyWithData(baseboard))),
  chassis: withTryCatch(createWinRMWrapper(promisifyWithData(chassis))),
  bios: withTryCatch(createWinRMWrapper(promisifyWithData(bios))),

  // USB
  usb: withTryCatch(createWinRMWrapper(promisifyWithData(usb))),

  // Users
  users: withTryCatch(createWinRMWrapper(promisifyWithData(users))),

  // GPS
  gps: withTryCatch(createWinRMWrapper(promisifyWithData(gps))),

  // Processes
  processes: withTryCatch(createWinRMWrapper(promisifyWithData(processes))),
  services: withTryCatch(createWinRMWrapper(promisifyWithData(services))),

  // Screenshot
  screenshot: withTryCatch(createWinRMWrapper(promisifyWithData(screenshotViaWinRM))),
};
