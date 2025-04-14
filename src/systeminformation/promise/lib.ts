import { audio as audioLib } from '../lib/audio';
// Import system information modules with unique names
import { battery as batteryLib } from '../lib/battery';
import { cpu as cpuLib } from '../lib/cpu';
import {
  blockDevices as blockDevicesLib,
  diskLayout as diskLayoutLib,
  disksIO as disksIOLib,
  fsOpenFiles as fsOpenFilesLib,
  fsSize as fsSizeLib,
} from '../lib/filesystem';
import { gps as gpsLib } from '../lib/gps';
import { graphics as graphicsLib } from '../lib/graphics';
import { hardwareDevices as hardwareDevicesLib } from '../lib/hardware';
import { inetLatency as inetLatencyLib } from '../lib/internet';
import { mem as memLib, memLayout as memLayoutLib } from '../lib/memory';
import {
  networkConnections as networkConnectionsLib,
  networkGatewayDefault as networkGatewayDefaultLib,
  networkInterfaceDefault as networkInterfaceDefaultLib,
  networkInterfaces as networkInterfacesLib,
  networkStats as networkStatsLib,
} from '../lib/network';
import {
  applications as applicationsLib,
  osInfo as osInfoLib,
  shell as shellLib,
  time as timeLib,
  uuid as uuidLib,
} from '../lib/osinfo';
import { printer as printerLib } from '../lib/printer';
import { processes as processesLib, services as servicesLib } from '../lib/processes';
import {
  baseboard as baseboardLib,
  bios as biosLib,
  chassis as chassisLib,
  system as systemLib,
} from '../lib/system';
import { screenshotViaWinRM } from '../lib/todo/screenshot';
import { usb as usbLib } from '../lib/usb';
import { users as usersLib } from '../lib/users';
import {
  wifiConnections as wifiConnectionsLib,
  wifiInterfaces as wifiInterfacesLib,
  wifiNetworks as wifiNetworksLib,
} from '../lib/wifi';
import { createWinRMWrapper, promisifyWithData } from './util';

/**
 * Type definition for a function that can be wrapped with try-catch
 * Including optional properties that might be set on the function
 */
interface WrapFunction {
  (...args: any[]): Promise<any>;
  name?: string;
  _name?: string;
  _fnName?: string;
}

/**
 * Wraps a function with try-catch block for error handling
 *
 * @param fn - The function to wrap with try-catch
 * @returns A function with try-catch error handling
 */
const withTryCatch =
  (fn: WrapFunction): WrapFunction =>
  async (...args: any[]) => {
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
    } catch (error) {
      return { error: (error as Error).message, success: false };
    }
  };

// Export system information functions
export const wifiNetworks = withTryCatch(createWinRMWrapper(promisifyWithData(wifiNetworksLib)));
export const wifiInterfaces = withTryCatch(
  createWinRMWrapper(promisifyWithData(wifiInterfacesLib)),
);
export const wifiConnections = withTryCatch(
  createWinRMWrapper(promisifyWithData(wifiConnectionsLib)),
);

// Battery
export const battery = withTryCatch(createWinRMWrapper(promisifyWithData(batteryLib)));

// Audio
export const audio = withTryCatch(createWinRMWrapper(promisifyWithData(audioLib)));

// Bluetooth
export const hardwareDevices = withTryCatch(
  createWinRMWrapper(promisifyWithData(hardwareDevicesLib)),
);

// CPU
export const cpu = withTryCatch(createWinRMWrapper(promisifyWithData(cpuLib)));

// Graphics
export const graphics = withTryCatch(createWinRMWrapper(promisifyWithData(graphicsLib)));

// Filesystem
export const disksIO = withTryCatch(createWinRMWrapper(promisifyWithData(disksIOLib)));
export const diskLayout = withTryCatch(createWinRMWrapper(promisifyWithData(diskLayoutLib)));
export const blockDevices = withTryCatch(createWinRMWrapper(promisifyWithData(blockDevicesLib)));
export const fsSize = withTryCatch(createWinRMWrapper(promisifyWithData(fsSizeLib)));
export const fsOpenFiles = withTryCatch(createWinRMWrapper(promisifyWithData(fsOpenFilesLib)));

// Internet
export const inetLatency = withTryCatch(createWinRMWrapper(promisifyWithData(inetLatencyLib)));

// Memory
export const mem = withTryCatch(createWinRMWrapper(promisifyWithData(memLib)));
export const memLayout = withTryCatch(createWinRMWrapper(promisifyWithData(memLayoutLib)));

// Network
export const networkInterfaces = withTryCatch(
  createWinRMWrapper(promisifyWithData(networkInterfacesLib)),
);
export const networkStats = withTryCatch(createWinRMWrapper(promisifyWithData(networkStatsLib)));
export const networkGatewayDefault = withTryCatch(
  createWinRMWrapper(promisifyWithData(networkGatewayDefaultLib)),
);
export const networkInterfaceDefault = withTryCatch(
  createWinRMWrapper(promisifyWithData(networkInterfaceDefaultLib)),
);
export const networkConnections = withTryCatch(
  createWinRMWrapper(promisifyWithData(networkConnectionsLib)),
);

// OS
export const osInfo = withTryCatch(createWinRMWrapper(promisifyWithData(osInfoLib)));
export const applications = withTryCatch(createWinRMWrapper(promisifyWithData(applicationsLib)));
export const shell = withTryCatch(createWinRMWrapper(promisifyWithData(shellLib)));
export const uuid = withTryCatch(createWinRMWrapper(promisifyWithData(uuidLib)));
export const time = withTryCatch(createWinRMWrapper(promisifyWithData(timeLib)));

// Printer
export const printer = withTryCatch(createWinRMWrapper(promisifyWithData(printerLib)));

// System
export const system = withTryCatch(createWinRMWrapper(promisifyWithData(systemLib)));
export const baseboard = withTryCatch(createWinRMWrapper(promisifyWithData(baseboardLib)));
export const chassis = withTryCatch(createWinRMWrapper(promisifyWithData(chassisLib)));
export const bios = withTryCatch(createWinRMWrapper(promisifyWithData(biosLib)));

// USB
export const usb = withTryCatch(createWinRMWrapper(promisifyWithData(usbLib)));

// Users
export const users = withTryCatch(createWinRMWrapper(promisifyWithData(usersLib)));

// GPS
export const gps = withTryCatch(createWinRMWrapper(promisifyWithData(gpsLib)));

// Processes
export const processes = withTryCatch(createWinRMWrapper(promisifyWithData(processesLib)));
export const services = withTryCatch(createWinRMWrapper(promisifyWithData(servicesLib)));

// Screenshot
export const screenshot = withTryCatch(createWinRMWrapper(promisifyWithData(screenshotViaWinRM)));
