// ==================================================================================
// graphics.ts
// ----------------------------------------------------------------------------------
// Description:   System Information - library
//                for Node.js
// Copyright:     (c) 2014 - 2025
// Author:        Sebastian Hildebrandt
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 7. Graphics (controller, display)
// ----------------------------------------------------------------------------------

import { exec, execSync } from 'child_process';
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';

import * as util from './util';
import {
  execOptsLinux,
  execOptsWin,
  isPrototypePolluted,
  isRaspberry,
  noop,
  plistParser,
  plistReader,
  toInt,
  WINDIR,
} from './util';
import type { Platform } from './util/platform';
import { getPlatformFlagsFromOptions } from './util/platform';

let _nvidiaSmiPath = '';

// Define interfaces for return types
export interface IGraphicsController {
  vendor: string;
  model: string;
  deviceName?: string;
  bus?: string;
  busAddress?: string;
  vram: number | null;
  vramDynamic: boolean;
  pciID?: string;
  subVendor?: string;
  vendorId?: string;
  deviceId?: string;
  external?: boolean;
  cores?: number | null;
  metalVersion?: string;
  driverVersion?: string;
  subDeviceId?: string | null;
  name?: string;
  pciBus?: string;
  fanSpeed?: number;
  memoryTotal?: number;
  memoryUsed?: number;
  memoryFree?: number;
  utilizationGpu?: number;
  utilizationMemory?: number;
  temperatureGpu?: number;
  temperatureMemory?: number;
  powerDraw?: number;
  powerLimit?: number;
  clockCore?: number;
  clockMemory?: number;
}

export interface IGraphicsDisplay {
  vendor: string;
  vendorId?: string;
  model: string;
  productionYear?: number | null;
  serial?: string | null;
  deviceName: string;
  displayId?: string | null;
  main: boolean;
  builtin: boolean;
  connection: string | null;
  sizeX: number | null;
  sizeY: number | null;
  pixelDepth: number | null;
  resolutionX: number | null;
  resolutionY: number | null;
  currentResX: number | null;
  currentResY: number | null;
  positionX: number;
  positionY: number;
  currentRefreshRate: number | null;
}

export interface IGraphicsResult {
  controllers: IGraphicsController[];
  displays: IGraphicsDisplay[];
}

// Type for NVIDIA device information
interface INvidiaDevice {
  driverVersion?: string;
  subDeviceId?: string;
  name?: string;
  pciBus?: string;
  fanSpeed?: number;
  memoryTotal?: number;
  memoryUsed?: number;
  memoryFree?: number;
  utilizationGpu?: number;
  utilizationMemory?: number;
  temperatureGpu?: number;
  temperatureMemory?: number;
  powerDraw?: number;
  powerLimit?: number;
  clockCore?: number;
  clockMemory?: number;
}

// Options interface
export interface IGraphicsOptions {
  platform?: string;
  winrm?: any;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  [key: string]: any;
}

// Video connection types
const videoTypes: Record<string, string> = {
  '-2': 'UNINITIALIZED',
  '-1': 'OTHER',
  '0': 'HD15',
  '1': 'SVIDEO',
  '2': 'Composite video',
  '3': 'Component video',
  '4': 'DVI',
  '5': 'HDMI',
  '6': 'LVDS',
  '8': 'D_JPN',
  '9': 'SDI',
  '10': 'DP',
  '11': 'DP embedded',
  '12': 'UDI',
  '13': 'UDI embedded',
  '14': 'SDTVDONGLE',
  '15': 'MIRACAST',
  '2147483648': 'INTERNAL',
};

// These need to be let variables since they're updated in Windows controller parsing
const _resolutionX = 0;
const _resolutionY = 0;
const _pixelDepth = 0;
const _refreshRate = 0;

// Platform specific properties
let _platform = process.platform;
let _linux = false;
let _darwin = false;
let _windows = false;
let _freebsd = false;
let _openbsd = false;
let _netbsd = false;
let _sunos = false;

/**
 * Set platform to test for
 * @param platform Platform string
 */
function setPlatform(platform: string): void {
  _platform = (platform || process.platform) as Platform;
  _linux = _platform === 'linux' || _platform === 'android';
  _darwin = _platform === 'darwin';
  _windows = _platform === 'win32';
  _freebsd = _platform === 'freebsd';
  _openbsd = _platform === 'openbsd';
  _netbsd = _platform === 'netbsd';
  _sunos = _platform === 'sunos';
}

/**
 * Get vendor from model string
 * @param model Model string
 * @returns Vendor string if found
 */
function getVendorFromModel(model: string): string {
  const manufacturers = [
    { pattern: '^LG.+', manufacturer: 'LG' },
    { pattern: '^BENQ.+', manufacturer: 'BenQ' },
    { pattern: '^ASUS.+', manufacturer: 'Asus' },
    { pattern: '^DELL.+', manufacturer: 'Dell' },
    { pattern: '^SAMSUNG.+', manufacturer: 'Samsung' },
    { pattern: '^VIEWSON.+', manufacturer: 'ViewSonic' },
    { pattern: '^SONY.+', manufacturer: 'Sony' },
    { pattern: '^ACER.+', manufacturer: 'Acer' },
    { pattern: '^AOC.+', manufacturer: 'AOC Monitors' },
    { pattern: '^HP.+', manufacturer: 'HP' },
    { pattern: '^EIZO.?', manufacturer: 'Eizo' },
    { pattern: '^PHILIPS.?', manufacturer: 'Philips' },
    { pattern: '^IIYAMA.?', manufacturer: 'Iiyama' },
    { pattern: '^SHARP.?', manufacturer: 'Sharp' },
    { pattern: '^NEC.?', manufacturer: 'NEC' },
    { pattern: '^LENOVO.?', manufacturer: 'Lenovo' },
    { pattern: 'COMPAQ.?', manufacturer: 'Compaq' },
    { pattern: 'APPLE.?', manufacturer: 'Apple' },
    { pattern: 'INTEL.?', manufacturer: 'Intel' },
    { pattern: 'AMD.?', manufacturer: 'AMD' },
    { pattern: 'NVIDIA.?', manufacturer: 'NVDIA' },
  ];

  let result = '';

  if (model) {
    model = model.toUpperCase();

    for (const manufacturer of manufacturers) {
      const re = new RegExp(manufacturer.pattern);

      if (re.test(model)) {
        result = manufacturer.manufacturer;
      }
    }
  }

  return result;
}

/**
 * Get vendor from ID
 * @param id Vendor ID
 * @returns Vendor name if found
 */
function getVendorFromId(id: string): string {
  const vendors: Record<string, string> = {
    '610': 'Apple',
    '1e6d': 'LG',
    '10ac': 'DELL',
    '4dd9': 'Sony',
    '38a3': 'NEC',
  };

  return vendors[id] || '';
}

/**
 * Convert vendor name to ID
 * @param str Vendor name
 * @returns Vendor ID if found
 */
function vendorToId(str: string): string {
  let result = '';
  str = (str || '').toLowerCase();

  if (str.includes('apple')) {
    result = '0x05ac';
  } else if (str.includes('nvidia')) {
    result = '0x10de';
  } else if (str.includes('intel')) {
    result = '0x8086';
  } else if (str.includes('ati') || str.includes('amd')) {
    result = '0x1002';
  }

  return result;
}

/**
 * Get Metal version from ID
 * @param id Metal ID
 * @returns Metal version if found
 */
function getMetalVersion(id: string): string {
  const families: Record<string, string> = {
    spdisplays_mtlgpufamilymac1: 'mac1',
    spdisplays_mtlgpufamilymac2: 'mac2',
    spdisplays_mtlgpufamilyapple1: 'apple1',
    spdisplays_mtlgpufamilyapple2: 'apple2',
    spdisplays_mtlgpufamilyapple3: 'apple3',
    spdisplays_mtlgpufamilyapple4: 'apple4',
    spdisplays_mtlgpufamilyapple5: 'apple5',
    spdisplays_mtlgpufamilyapple6: 'apple6',
    spdisplays_mtlgpufamilyapple7: 'apple7',
    spdisplays_metalfeaturesetfamily11: 'family1_v1',
    spdisplays_metalfeaturesetfamily12: 'family1_v2',
    spdisplays_metalfeaturesetfamily13: 'family1_v3',
    spdisplays_metalfeaturesetfamily14: 'family1_v4',
    spdisplays_metalfeaturesetfamily21: 'family2_v1',
  };

  return families[id] || '';
}

/**
 * Get NVIDIA SMI path
 * @returns Path to NVIDIA SMI executable
 */
function getNvidiaSmi(): string {
  if (_nvidiaSmiPath) {
    return _nvidiaSmiPath;
  }

  if (_windows) {
    try {
      const basePath = WINDIR + '\\System32\\DriverStore\\FileRepository';
      // find all directories that have an nvidia-smi.exe file
      const candidateDirs = readdirSync(basePath).filter((dir) =>
        readdirSync([basePath, dir].join('/')).includes('nvidia-smi.exe'),
      );
      // use the directory with the most recently created nvidia-smi.exe file
      let targetDir = '';
      let maxTime = 0;

      for (const currentDir of candidateDirs) {
        const nvidiaSmi = statSync([basePath, currentDir, 'nvidia-smi.exe'].join('/'));

        if (!targetDir || nvidiaSmi.ctimeMs > maxTime) {
          targetDir = currentDir;
          maxTime = nvidiaSmi.ctimeMs;
        }
      }

      if (targetDir) {
        _nvidiaSmiPath = [basePath, targetDir, 'nvidia-smi.exe'].join('/');
      }
    } catch {
      noop();
    }
  } else if (_linux) {
    _nvidiaSmiPath = 'nvidia-smi';
  }

  return _nvidiaSmiPath;
}

/**
 * Run NVIDIA SMI command
 * @param options Execution options
 * @returns NVIDIA SMI output as string
 */
function nvidiaSmi(options?: any): string {
  const nvidiaSmiExe = getNvidiaSmi();
  options = options || execOptsWin;

  if (nvidiaSmiExe) {
    const nvidiaSmiOpts =
      '--query-gpu=driver_version,pci.sub_device_id,name,pci.bus_id,fan.speed,memory.total,memory.used,memory.free,utilization.gpu,utilization.memory,temperature.gpu,temperature.memory,power.draw,power.limit,clocks.gr,clocks.mem --format=csv,noheader,nounits';
    const cmd = nvidiaSmiExe + ' ' + nvidiaSmiOpts + (_linux ? '  2>/dev/null' : '');

    if (_linux) {
      options.stdio = ['pipe', 'pipe', 'ignore'];
    }

    try {
      return execSync(cmd, options).toString();
    } catch {
      noop();
    }
  }

  return '';
}

/**
 * Parse a number safely, returning undefined for null/undefined values
 * @param value String value to parse
 * @returns Parsed number or undefined
 */
function safeParseNumber(value: string | undefined | null): number | undefined {
  if ([null, undefined].includes(value as any)) {
    return undefined;
  }

  return Number.parseFloat(value as string);
}

/**
 * Get NVIDIA devices information
 * @returns Array of NVIDIA devices
 */
function nvidiaDevices(): INvidiaDevice[] {
  const stdout = nvidiaSmi();

  if (!stdout) {
    return [];
  }

  const gpus = stdout.split('\n').filter(Boolean);
  let results = gpus.map((gpu) => {
    const splittedData = gpu
      .split(', ')
      .map((value) => (value.includes('N/A') ? undefined : value));

    return splittedData.length === 16
      ? {
          driverVersion: splittedData[0],
          subDeviceId: splittedData[1],
          name: splittedData[2],
          pciBus: splittedData[3],
          fanSpeed: safeParseNumber(splittedData[4]),
          memoryTotal: safeParseNumber(splittedData[5]),
          memoryUsed: safeParseNumber(splittedData[6]),
          memoryFree: safeParseNumber(splittedData[7]),
          utilizationGpu: safeParseNumber(splittedData[8]),
          utilizationMemory: safeParseNumber(splittedData[9]),
          temperatureGpu: safeParseNumber(splittedData[10]),
          temperatureMemory: safeParseNumber(splittedData[11]),
          powerDraw: safeParseNumber(splittedData[12]),
          powerLimit: safeParseNumber(splittedData[13]),
          clockCore: safeParseNumber(splittedData[14]),
          clockMemory: safeParseNumber(splittedData[15]),
        }
      : {};
  });
  results = results.filter((item) => 'pciBus' in item);

  return results;
}

/**
 * Merge NVIDIA controller data with base controller
 * @param controller Base controller object
 * @param nvidia NVIDIA device information
 * @returns Merged controller object
 */
function mergeControllerNvidia(
  controller: IGraphicsController,
  nvidia: INvidiaDevice,
): IGraphicsController {
  if (nvidia.driverVersion) {
    controller.driverVersion = nvidia.driverVersion;
  }

  if (nvidia.subDeviceId) {
    controller.subDeviceId = nvidia.subDeviceId;
  }

  if (nvidia.name) {
    controller.name = nvidia.name;
  }

  if (nvidia.pciBus) {
    controller.pciBus = nvidia.pciBus;
  }

  if (nvidia.fanSpeed) {
    controller.fanSpeed = nvidia.fanSpeed;
  }

  if (nvidia.memoryTotal) {
    controller.memoryTotal = nvidia.memoryTotal;
    controller.vram = nvidia.memoryTotal;
    controller.vramDynamic = false;
  }

  if (nvidia.memoryUsed) {
    controller.memoryUsed = nvidia.memoryUsed;
  }

  if (nvidia.memoryFree) {
    controller.memoryFree = nvidia.memoryFree;
  }

  if (nvidia.utilizationGpu) {
    controller.utilizationGpu = nvidia.utilizationGpu;
  }

  if (nvidia.utilizationMemory) {
    controller.utilizationMemory = nvidia.utilizationMemory;
  }

  if (nvidia.temperatureGpu) {
    controller.temperatureGpu = nvidia.temperatureGpu;
  }

  if (nvidia.temperatureMemory) {
    controller.temperatureMemory = nvidia.temperatureMemory;
  }

  if (nvidia.powerDraw) {
    controller.powerDraw = nvidia.powerDraw;
  }

  if (nvidia.powerLimit) {
    controller.powerLimit = nvidia.powerLimit;
  }

  if (nvidia.clockCore) {
    controller.clockCore = nvidia.clockCore;
  }

  if (nvidia.clockMemory) {
    controller.clockMemory = nvidia.clockMemory;
  }

  return controller;
}

/**
 * Parse graphics information from macOS
 * @param graphicsArr Array of graphics data
 * @returns Graphics result object
 */
function parseLinesDarwin(graphicsArr: any[]): IGraphicsResult {
  const res: IGraphicsResult = {
    controllers: [],
    displays: [],
  };

  try {
    for (const item of graphicsArr) {
      // controllers
      let bus = '';

      if ((item.sppci_bus || '').includes('builtin')) {
        bus = 'Built-In';
      } else if ((item.sppci_bus || '').includes('pcie')) {
        bus = 'PCIe';
      }

      const vram =
        (Number.parseInt(item.spdisplays_vram || '', 10) || 0) *
        ((item.spdisplays_vram || '').includes('GB') ? 1024 : 1);
      const vramDyn =
        (Number.parseInt(item.spdisplays_vram_shared || '', 10) || 0) *
        ((item.spdisplays_vram_shared || '').includes('GB') ? 1024 : 1);
      const metalVersion = getMetalVersion(
        item.spdisplays_metal || item.spdisplays_metalfamily || '',
      );
      res.controllers.push({
        vendor: getVendorFromModel(item.spdisplays_vendor || '') || item.spdisplays_vendor || '',
        model: item.sppci_model || '',
        bus,
        vramDynamic: bus === 'Built-In',
        vram: vram || vramDyn || null,
        deviceId: item['spdisplays_device-id'] || '',
        vendorId:
          item['spdisplays_vendor-id'] ||
          vendorToId((item.spdisplays_vendor || '') + (item.sppci_model || '')),
        external: item.sppci_device_type === 'spdisplays_egpu',
        cores: item.sppci_cores || null,
        metalVersion,
      });

      // displays
      if (item.spdisplays_ndrvs && item.spdisplays_ndrvs.length > 0) {
        for (const displayItem of item.spdisplays_ndrvs) {
          const connectionType = displayItem.spdisplays_connection_type || '';
          const currentResolutionParts = (displayItem._spdisplays_resolution || '').split('@');
          const currentResolution = currentResolutionParts[0].split('x');
          const pixelParts = (displayItem._spdisplays_pixels || '').split('x');
          const pixelDepthString = displayItem.spdisplays_depth || '';
          const serial =
            displayItem['_spdisplays_display-serial-number'] ||
            displayItem['_spdisplays_display-serial-number2'] ||
            null;
          res.displays.push({
            vendor:
              getVendorFromId(displayItem['_spdisplays_display-vendor-id'] || '') ||
              getVendorFromModel(displayItem._name || ''),
            vendorId: displayItem['_spdisplays_display-vendor-id'] || '',
            model: displayItem._name || '',
            productionYear: displayItem['_spdisplays_display-year'] || null,
            serial: serial === '0' ? null : serial,
            displayId: displayItem._spdisplays_displayID || null,
            deviceName: '',
            main: displayItem.spdisplays_main
              ? displayItem.spdisplays_main === 'spdisplays_yes'
              : false,
            builtin: (displayItem.spdisplays_display_type || '').includes('built-in'),
            connection: (() => {
              if (connectionType.includes('_internal')) {
                return 'Internal';
              }

              if (connectionType.includes('_displayport')) {
                return 'Display Port';
              }

              if (connectionType.includes('_hdmi')) {
                return 'HDMI';
              }

              return null;
            })(),
            sizeX: null,
            sizeY: null,
            pixelDepth: (() => {
              if (pixelDepthString === 'CGSThirtyBitColor') {
                return 30;
              }

              if (pixelDepthString === 'CGSThirtytwoBitColor') {
                return 32;
              }

              if (pixelDepthString === 'CGSTwentyfourBitColor') {
                return 24;
              }

              return null;
            })(),
            resolutionX: pixelParts.length > 1 ? Number.parseInt(pixelParts[0], 10) : null,
            resolutionY: pixelParts.length > 1 ? Number.parseInt(pixelParts[1], 10) : null,
            currentResX:
              currentResolution.length > 1 ? Number.parseInt(currentResolution[0], 10) : null,
            currentResY:
              currentResolution.length > 1 ? Number.parseInt(currentResolution[1], 10) : null,
            positionX: 0,
            positionY: 0,
            currentRefreshRate:
              currentResolutionParts.length > 1
                ? Number.parseInt(currentResolutionParts[1], 10)
                : null,
          });
        }
      }
    }

    return res;
  } catch {
    return res;
  }
}

/**
 * Parse Linux controller information
 * @param lines Array of output lines
 * @returns Array of graphics controllers
 */
function parseLinesLinuxControllers(lines: string[]): IGraphicsController[] {
  const controllers: IGraphicsController[] = [];
  let currentController: IGraphicsController = {
    vendor: '',
    subVendor: '',
    model: '',
    bus: '',
    busAddress: '',
    vram: null,
    vramDynamic: false,
    pciID: '',
  };
  let isGraphicsController = false;
  // PCI bus IDs
  let pciIDs: string[] = [];

  try {
    pciIDs = execSync(
      'export LC_ALL=C; dmidecode -t 9 2>/dev/null; unset LC_ALL | grep "Bus Address: "',
      execOptsLinux,
    )
      .toString()
      .split('\n');

    for (let i = 0; i < pciIDs.length; i++) {
      pciIDs[i] = pciIDs[i].replace('Bus Address:', '').replace('0000:', '').trim();
    }

    pciIDs = pciIDs.filter((el) => el != null && el);
  } catch {
    noop();
  }

  let i = 1;

  for (const line of lines) {
    let subsystem = '';

    if (i < lines.length && lines[i]) {
      // get next line;
      subsystem = lines[i];

      if (subsystem.indexOf(':') > 0) {
        subsystem = subsystem.split(':')[1];
      }
    }

    if (line.trim() !== '') {
      if (line[0] !== ' ' && line[0] !== '\t') {
        // first line of new entry
        const isExternal = pciIDs.includes(line.split(' ')[0]);
        let vgapos = line.toLowerCase().indexOf(' vga ');
        const _3dcontrollerpos = line.toLowerCase().indexOf('3d controller');

        if (vgapos !== -1 || _3dcontrollerpos !== -1) {
          // VGA
          if (_3dcontrollerpos !== -1 && vgapos === -1) {
            vgapos = _3dcontrollerpos;
          }

          if (
            currentController.vendor ||
            currentController.model ||
            currentController.bus ||
            currentController.vram !== null ||
            currentController.vramDynamic
          ) {
            // already a controller found
            controllers.push(currentController);
            currentController = {
              vendor: '',
              model: '',
              bus: '',
              busAddress: '',
              vram: null,
              vramDynamic: false,
            };
          }

          const pciIDCandidate = line.split(' ')[0];

          if (/[\dA-Fa-f]{2}:[\dA-Fa-f]{2}\.[\dA-Fa-f]/.test(pciIDCandidate)) {
            currentController.busAddress = pciIDCandidate;
          }

          isGraphicsController = true;
          const endpos = line.search(/\[[\da-f]{4}:[\da-f]{4}]|$/);
          const parts = line.slice(vgapos, endpos - vgapos).split(':');
          currentController.busAddress = line.slice(0, Math.max(0, vgapos)).trim();

          if (parts.length > 1) {
            parts[1] = parts[1].trim();

            if (parts[1].toLowerCase().includes('corporation')) {
              currentController.vendor = parts[1]
                .slice(0, Math.max(0, parts[1].toLowerCase().indexOf('corporation') + 11))
                .trim();
              currentController.model = parts[1]
                .slice(parts[1].toLowerCase().indexOf('corporation') + 11, 200)
                .split('(')[0]
                .trim();
              currentController.bus = pciIDs.length > 0 && isExternal ? 'PCIe' : 'Onboard';
              currentController.vram = null;
              currentController.vramDynamic = false;
            } else if (parts[1].toLowerCase().includes(' inc.')) {
              if ((parts[1].match(/]/g) || []).length > 1) {
                currentController.vendor = parts[1]
                  .slice(0, Math.max(0, parts[1].toLowerCase().indexOf(']') + 1))
                  .trim();
                currentController.model = parts[1]
                  .slice(parts[1].toLowerCase().indexOf(']') + 1, 200)
                  .trim()
                  .split('(')[0]
                  .trim();
              } else {
                currentController.vendor = parts[1]
                  .slice(0, Math.max(0, parts[1].toLowerCase().indexOf(' inc.') + 5))
                  .trim();
                currentController.model = parts[1]
                  .slice(parts[1].toLowerCase().indexOf(' inc.') + 5, 200)
                  .trim()
                  .split('(')[0]
                  .trim();
              }

              currentController.bus = pciIDs.length > 0 && isExternal ? 'PCIe' : 'Onboard';
              currentController.vram = null;
              currentController.vramDynamic = false;
            } else if (parts[1].toLowerCase().includes(' ltd.')) {
              if ((parts[1].match(/]/g) || []).length > 1) {
                currentController.vendor = parts[1]
                  .slice(0, Math.max(0, parts[1].toLowerCase().indexOf(']') + 1))
                  .trim();
                currentController.model = parts[1]
                  .slice(parts[1].toLowerCase().indexOf(']') + 1, 200)
                  .trim()
                  .split('(')[0]
                  .trim();
              } else {
                currentController.vendor = parts[1]
                  .slice(0, Math.max(0, parts[1].toLowerCase().indexOf(' ltd.') + 5))
                  .trim();
                currentController.model = parts[1]
                  .slice(parts[1].toLowerCase().indexOf(' ltd.') + 5, 200)
                  .trim()
                  .split('(')[0]
                  .trim();
              }
            }

            if (currentController.model && subsystem.includes(currentController.model)) {
              const subVendor = subsystem.split(currentController.model)[0].trim();

              if (subVendor) {
                currentController.subVendor = subVendor;
              }
            }
          } else {
            isGraphicsController = false;
          }
        } else {
          isGraphicsController = false;
        }
      }

      if (isGraphicsController) {
        // within VGA details
        const parts = line.split(':');

        if (
          parts.length > 1 &&
          parts[0].replaceAll(/ +/g, '').toLowerCase().includes('devicename') &&
          parts[1].toLowerCase().includes('onboard')
        ) {
          currentController.bus = 'Onboard';
        }

        if (
          parts.length > 1 &&
          parts[0].replaceAll(/ +/g, '').toLowerCase().includes('region') &&
          parts[1].toLowerCase().includes('memory')
        ) {
          const memparts = parts[1].split('=');

          if (memparts.length > 1) {
            currentController.vram = Number.parseInt(memparts[1], 10);
          }
        }
      }
    }

    i++;
  }

  if (
    currentController.vendor ||
    currentController.model ||
    currentController.bus ||
    currentController.busAddress ||
    currentController.vram !== null ||
    currentController.vramDynamic
  ) {
    // already a controller found
    controllers.push(currentController);
  }

  return controllers;
}

/**
 * Parse Linux clinfo output
 * @param controllers Existing controllers array
 * @param lines Array of clinfo output lines
 * @returns Array of graphics controllers
 */
function parseLinesLinuxClinfo(
  controllers: IGraphicsController[],
  lines: string[],
): IGraphicsController[] {
  const fieldPattern = /\[([^\]]+)]\s+(\w+)\s+(.*)/;
  const devices: Record<string, Record<string, string>> = {};

  for (const line of lines) {
    const field = fieldPattern.exec(line.trim());

    if (field) {
      if (!devices[field[1]]) {
        devices[field[1]] = {};
      }

      devices[field[1]][field[2]] = field[3];
    }
  }

  for (const deviceId in devices) {
    if (Object.prototype.hasOwnProperty.call(devices, deviceId)) {
      const device = devices[deviceId];

      if (device.CL_DEVICE_TYPE === 'CL_DEVICE_TYPE_GPU') {
        let busAddress;

        if (device.CL_DEVICE_TOPOLOGY_AMD) {
          const bdf = device.CL_DEVICE_TOPOLOGY_AMD.match(/[\dA-Za-z]+:\d+\.\d+/);

          if (bdf) {
            busAddress = bdf[0];
          }
        } else if (device.CL_DEVICE_PCI_BUS_ID_NV && device.CL_DEVICE_PCI_SLOT_ID_NV) {
          const bus = Number.parseInt(device.CL_DEVICE_PCI_BUS_ID_NV, 10);
          const slot = Number.parseInt(device.CL_DEVICE_PCI_SLOT_ID_NV, 10);

          if (!Number.isNaN(bus) && !Number.isNaN(slot)) {
            // eslint-disable-next-line no-bitwise
            const b = bus & 0xff;
            // eslint-disable-next-line no-bitwise
            const d = (slot >> 3) & 0xff;
            // eslint-disable-next-line no-bitwise
            const f = slot & 0x07;
            busAddress = `${b.toString().padStart(2, '0')}:${d.toString().padStart(2, '0')}.${f}`;
          }
        }

        if (busAddress) {
          let controller = controllers.find((controller) => controller.busAddress === busAddress);

          if (!controller) {
            controller = {
              vendor: '',
              model: '',
              bus: '',
              busAddress,
              vram: null,
              vramDynamic: false,
            };
            controllers.push(controller);
          }

          controller.vendor = device.CL_DEVICE_VENDOR;

          controller.model = device.CL_DEVICE_BOARD_NAME_AMD || device.CL_DEVICE_NAME;

          const memory = Number.parseInt(device.CL_DEVICE_GLOBAL_MEM_SIZE, 10);

          if (!Number.isNaN(memory)) {
            controller.vram = Math.round(memory / 1024 / 1024);
          }
        }
      }
    }
  }

  return controllers;
}

/**
 * Parse Linux EDID information
 * @param edid EDID string
 * @returns Display information object
 */
function parseLinesLinuxEdid(edid: string): IGraphicsDisplay {
  // Parse EDID
  // --> model
  // --> resolutionx
  // --> resolutiony
  // --> builtin = false
  // --> pixeldepth (?)
  // --> sizex
  // --> sizey
  const result: IGraphicsDisplay = {
    vendor: '',
    model: '',
    deviceName: '',
    main: false,
    builtin: false,
    connection: '',
    sizeX: null,
    sizeY: null,
    pixelDepth: null,
    resolutionX: null,
    resolutionY: null,
    currentResX: null,
    currentResY: null,
    positionX: 0,
    positionY: 0,
    currentRefreshRate: null,
  };

  // find first "Detailed Timing Description"
  let start = 108;

  if (edid.slice(start, start + 6) === '000000') {
    start += 36;
  }

  if (edid.slice(start, start + 6) === '000000') {
    start += 36;
  }

  if (edid.slice(start, start + 6) === '000000') {
    start += 36;
  }

  if (edid.slice(start, start + 6) === '000000') {
    start += 36;
  }

  result.resolutionX = Number.parseInt(
    '0x0' + edid.slice(start + 8, start + 9) + edid.slice(start + 4, start + 6),
    10,
  );
  result.resolutionY = Number.parseInt(
    '0x0' + edid.slice(start + 14, start + 15) + edid.slice(start + 10, start + 12),
    10,
  );
  result.sizeX = Number.parseInt(
    '0x0' + edid.slice(start + 28, start + 29) + edid.slice(start + 24, start + 26),
    10,
  );
  result.sizeY = Number.parseInt(
    '0x0' + edid.slice(start + 29, start + 30) + edid.slice(start + 26, start + 28),
    10,
  );

  // monitor name
  start = edid.indexOf('000000fc00'); // find first "Monitor Description Data"

  if (start >= 0) {
    let model_raw = edid.slice(start + 10, start + 36);

    if (model_raw.includes('0a')) {
      model_raw = model_raw.slice(0, Math.max(0, model_raw.indexOf('0a')));
    }

    try {
      if (model_raw.length > 2) {
        result.model =
          model_raw
            .match(/.{1,2}/g)
            ?.map((v) => String.fromCodePoint(Number.parseInt(v, 16)))
            .join('') || '';
      }
    } catch {
      noop();
    }
  } else {
    result.model = '';
  }

  return result;
}

/**
 * Parse Linux display information
 * @param lines Array of output lines
 * @param depth Color depth
 * @returns Array of display information
 */
function parseLinesLinuxDisplays(lines: string[], depth: number): IGraphicsDisplay[] {
  const displays: IGraphicsDisplay[] = [];
  let currentDisplay: IGraphicsDisplay = {
    vendor: '',
    model: '',
    deviceName: '',
    main: false,
    builtin: false,
    connection: '',
    sizeX: null,
    sizeY: null,
    pixelDepth: null,
    resolutionX: null,
    resolutionY: null,
    currentResX: null,
    currentResY: null,
    positionX: 0,
    positionY: 0,
    currentRefreshRate: null,
  };

  let is_edid = false;
  let is_current = false;
  let edid_raw = '';
  let start = 0;

  for (let i = 1; i < lines.length; i++) {
    // start with second line
    if (lines[i].trim() !== '') {
      if (
        lines[i][0] !== ' ' &&
        lines[i][0] !== '\t' &&
        lines[i].toLowerCase().includes(' connected ')
      ) {
        // first line of new entry
        if (
          currentDisplay.model ||
          currentDisplay.main ||
          currentDisplay.builtin ||
          currentDisplay.connection ||
          currentDisplay.sizeX !== null ||
          currentDisplay.pixelDepth !== null ||
          currentDisplay.resolutionX !== null
        ) {
          // push last display to array
          displays.push(currentDisplay);
          currentDisplay = {
            vendor: '',
            model: '',
            main: false,
            builtin: false,
            connection: '',
            sizeX: null,
            sizeY: null,
            pixelDepth: null,
            resolutionX: null,
            resolutionY: null,
            currentResX: null,
            currentResY: null,
            positionX: 0,
            positionY: 0,
            currentRefreshRate: null,
            deviceName: '',
          };
        }

        const parts = lines[i].split(' ');
        currentDisplay.connection = parts[0];
        currentDisplay.main = lines[i].toLowerCase().includes(' primary ');
        currentDisplay.builtin = parts[0].toLowerCase().includes('edp');
      }

      // try to read EDID information
      if (is_edid) {
        if (lines[i].search(/\S|$/) > start) {
          edid_raw += lines[i].toLowerCase().trim();
        } else {
          // parse EDID
          const edid_decoded = parseLinesLinuxEdid(edid_raw);
          currentDisplay.vendor = edid_decoded.vendor;
          currentDisplay.model = edid_decoded.model;
          currentDisplay.resolutionX = edid_decoded.resolutionX;
          currentDisplay.resolutionY = edid_decoded.resolutionY;
          currentDisplay.sizeX = edid_decoded.sizeX;
          currentDisplay.sizeY = edid_decoded.sizeY;
          currentDisplay.pixelDepth = depth;
          is_edid = false;
        }
      }

      if (lines[i].toLowerCase().includes('edid:')) {
        is_edid = true;
        start = lines[i].search(/\S|$/);
      }

      if (lines[i].toLowerCase().includes('*current')) {
        const parts1 = lines[i].split('(');

        if (parts1 && parts1.length > 1 && parts1[0].includes('x')) {
          const resParts = parts1[0].trim().split('x');
          currentDisplay.currentResX = toInt(resParts[0]);
          currentDisplay.currentResY = toInt(resParts[1]);
        }

        is_current = true;
      }

      if (
        is_current &&
        lines[i].toLowerCase().includes('clock') &&
        lines[i].toLowerCase().includes('hz') &&
        lines[i].toLowerCase().includes('v: height')
      ) {
        const parts1 = lines[i].split('clock');

        if (parts1 && parts1.length > 1 && parts1[1].toLowerCase().includes('hz')) {
          currentDisplay.currentRefreshRate = toInt(parts1[1]);
        }

        is_current = false;
      }
    }
  }

  // push displays
  if (
    currentDisplay.model ||
    currentDisplay.main ||
    currentDisplay.builtin ||
    currentDisplay.connection ||
    currentDisplay.sizeX !== null ||
    currentDisplay.pixelDepth !== null ||
    currentDisplay.resolutionX !== null
  ) {
    // still information there
    displays.push(currentDisplay);
  }

  return displays;
}

/**
 * Parse Windows display information
 * @param ssections Screen sections
 * @param msections Monitor sections
 * @param dsections Display sections
 * @param tsections Technology sections
 * @param isections ID sections
 * @returns Array of display information
 */
function parseLinesWindowsDisplaysPowershell(
  ssections: string[],
  msections: string[],
  dsections: string[],
  tsections: string[],
  isections: Array<{
    vendor: string;
    code: string;
    model: string;
    serial: string;
    instanceId: string;
  }>,
): IGraphicsDisplay[] {
  const displays: IGraphicsDisplay[] = [];
  let vendor = '';
  let model = '';
  let deviceID = '';
  let resolutionX = 0;
  let resolutionY = 0;

  if (dsections && dsections.length > 0) {
    const linesDisplay = dsections[0].split('\n');
    vendor = util.getValue(linesDisplay, 'MonitorManufacturer', ':');
    model = util.getValue(linesDisplay, 'Name', ':');
    deviceID = util
      .getValue(linesDisplay, 'PNPDeviceID', ':')
      .replaceAll('&amp;', '&')
      .toLowerCase();
    resolutionX = util.toInt(util.getValue(linesDisplay, 'ScreenWidth', ':'));
    resolutionY = util.toInt(util.getValue(linesDisplay, 'ScreenHeight', ':'));
  }

  for (let i = 0; i < ssections.length; i++) {
    if (ssections[i].trim() !== '') {
      ssections[i] = 'BitsPerPixel ' + ssections[i];
      msections[i] = 'Active ' + msections[i];

      // tsections can be empty OR undefined on earlier versions of powershell (<=2.0)
      // Tag connection type as UNKNOWN by default if this information is missing
      if (tsections.length === 0 || tsections[i] === undefined) {
        tsections[i] = 'Unknown';
      }

      const linesScreen = ssections[i].split('\n');
      const linesMonitor = msections[i].split('\n');
      const linesConnection = tsections[i].split('\n');

      const bitsPerPixel = util.getValue(linesScreen, 'BitsPerPixel');
      const bounds = util
        .getValue(linesScreen, 'Bounds')
        .replace('{', '')
        .replace('}', '')
        .replaceAll('=', ':')
        .split(',');
      const primary = util.getValue(linesScreen, 'Primary');
      const sizeX = util.getValue(linesMonitor, 'MaxHorizontalImageSize');
      const sizeY = util.getValue(linesMonitor, 'MaxVerticalImageSize');
      const instanceName = util.getValue(linesMonitor, 'InstanceName').toLowerCase();
      const videoOutputTechnology = util.getValue(linesConnection, 'VideoOutputTechnology');
      const deviceName = util.getValue(linesScreen, 'DeviceName');

      let displayVendor = '';
      let displayModel = '';

      for (const element of isections) {
        if (
          element.instanceId.toLowerCase().startsWith(instanceName) &&
          vendor.startsWith('(') &&
          model.startsWith('PnP')
        ) {
          displayVendor = element.vendor;
          displayModel = element.model;
        }
      }

      // Get connection type
      let connectionType: string | null = '';

      connectionType =
        videoOutputTechnology && videoTypes[videoOutputTechnology]
          ? videoTypes[videoOutputTechnology]
          : null;

      displays.push({
        vendor: instanceName.startsWith(deviceID) && displayVendor === '' ? vendor : displayVendor,
        model: instanceName.startsWith(deviceID) && displayModel === '' ? model : displayModel,
        deviceName,
        main: primary.toLowerCase() === 'true',
        builtin: videoOutputTechnology === '2147483648',
        connection: (() => {
          if (connectionType?.includes('_internal')) {
            return 'Internal';
          }

          if (connectionType?.includes('_displayport')) {
            return 'Display Port';
          }

          if (connectionType?.includes('_hdmi')) {
            return 'HDMI';
          }

          return null;
        })(),
        resolutionX: util.toInt(util.getValue(bounds, 'Width', ':')),
        resolutionY: util.toInt(util.getValue(bounds, 'Height', ':')),
        sizeX: sizeX ? Number.parseInt(sizeX, 10) : null,
        sizeY: sizeY ? Number.parseInt(sizeY, 10) : null,
        pixelDepth: (() => {
          if (bitsPerPixel) {
            return Number.parseInt(bitsPerPixel, 10);
          }

          return null;
        })(),
        currentResX: util.toInt(util.getValue(bounds, 'Width', ':')),
        currentResY: util.toInt(util.getValue(bounds, 'Height', ':')),
        positionX: util.toInt(util.getValue(bounds, 'X', ':')),
        positionY: util.toInt(util.getValue(bounds, 'Y', ':')),
        currentRefreshRate: null,
      });
    }
  }

  if (ssections.length === 0) {
    displays.push({
      vendor,
      model,
      deviceName: '',
      main: true,
      builtin: false,
      connection: null,
      sizeX: null,
      sizeY: null,
      resolutionX,
      resolutionY,
      pixelDepth: null,
      currentResX: resolutionX,
      currentResY: resolutionY,
      positionX: 0,
      positionY: 0,
      currentRefreshRate: null,
    });
  }

  return displays;
}

/**
 * Get the path to the PowerShell script
 * @returns The absolute path to the graphics PowerShell script
 */
function getGraphicsScriptPath(): string {
  // Calculate the path to the PowerShell script relative to this file
  return path.resolve(__dirname, '../powershell/graphics.ps1');
}

/**
 * Main function to get graphics information
 * @param options Options for function
 * @param callback Optional callback function
 * @returns Promise resolving to graphics information
 */
export function graphics(
  options: IGraphicsOptions = {},
  callback?: (data: IGraphicsResult) => void,
): Promise<IGraphicsResult> {
  const platformFlags = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(() => {
      let result: IGraphicsResult = {
        controllers: [],
        displays: [],
      };

      if (platformFlags._darwin) {
        const cmd = 'system_profiler -xml -detailLevel full SPDisplaysDataType';
        exec(cmd, function (error, stdout) {
          if (!error) {
            try {
              const output = stdout.toString();
              result = parseLinesDarwin(plistParser(output)[0]._items);
            } catch {
              noop();
            }
            // More macOS-specific code would follow here
          }

          if (callback) {
            callback(result);
          }

          resolve(result);
        });
      } else if (platformFlags._linux) {
        // Raspberry Pi specific code
        if (isRaspberry()) {
          const cmd =
            "fbset -s 2> /dev/null | grep 'mode \"' ; vcgencmd get_mem gpu 2> /dev/null; tvservice -s 2> /dev/null; tvservice -n 2> /dev/null;";
          exec(cmd, function (error, stdout) {
            if (!error) {
              const lines = stdout.toString().split('\n');

              if (
                lines.length > 3 &&
                lines[0].indexOf('mode "') >= -1 &&
                lines[2].includes('0x12000a')
              ) {
                const parts = lines[0].replace('mode', '').replaceAll('"', '').trim().split('x');

                if (parts.length === 2) {
                  result.displays.push({
                    vendor: '',
                    model: util.getValue(lines, 'device_name', '='),
                    deviceName: '',
                    main: true,
                    builtin: false,
                    connection: 'HDMI',
                    sizeX: null,
                    sizeY: null,
                    pixelDepth: null,
                    resolutionX: Number.parseInt(parts[0], 10),
                    resolutionY: Number.parseInt(parts[1], 10),
                    currentResX: null,
                    currentResY: null,
                    positionX: 0,
                    positionY: 0,
                    currentRefreshRate: null,
                  });
                }
              }

              if (lines.length > 0 && stdout.toString().indexOf('gpu=') >= -1) {
                result.controllers.push({
                  vendor: 'Broadcom',
                  model: util.getRpiGpu() || 'Raspberry Pi GPU',
                  bus: '',
                  vram: Number.parseInt(util.getValue(lines, 'gpu', '=').replace('M', ''), 10),
                  vramDynamic: true,
                });
              }
            }
          });
        }

        // Get controller info
        const cmd = 'lspci -vvv 2>/dev/null';
        exec(cmd, function (error, stdout) {
          if (!error) {
            const lines = stdout.toString().split('\n');

            if (result.controllers.length === 0) {
              result.controllers = parseLinesLinuxControllers(lines);

              const nvidiaData = nvidiaDevices();
              // Match by busAddress
              result.controllers = result.controllers.map((controller) =>
                mergeControllerNvidia(
                  controller,
                  nvidiaData.find(
                    (contr) =>
                      contr.pciBus
                        ?.toLowerCase()
                        .endsWith(controller.busAddress?.toLowerCase() || '') || false,
                  ) || {},
                ),
              );
            }
          }

          // Get OpenCL info
          const clInfoCmd = 'clinfo --raw';
          exec(clInfoCmd, function (error, stdout) {
            if (!error) {
              const lines = stdout.toString().split('\n');
              result.controllers = parseLinesLinuxClinfo(result.controllers, lines);
            }

            // Get display depth
            const depthCmd =
              "xdpyinfo 2>/dev/null | grep 'depth of root window' | awk '{ print $5 }'";
            exec(depthCmd, function (error, stdout) {
              let depth = 0;

              if (!error) {
                const lines = stdout.toString().split('\n');
                depth = Number.parseInt(lines[0], 10) || 0;
              }

              // Get display info
              const displayCmd = 'xrandr --verbose 2>/dev/null';
              exec(displayCmd, function (error, stdout) {
                if (!error) {
                  const lines = stdout.toString().split('\n');
                  result.displays = parseLinesLinuxDisplays(lines, depth);
                }

                if (callback) {
                  callback(result);
                }

                resolve(result);
              });
            });
          });
        });
      } else if (platformFlags._windows) {
        try {
          // Get the path to the PowerShell script
          const scriptPath = getGraphicsScriptPath();

          // Execute the PowerShell script using the centralized utility function
          util
            .executeScript(scriptPath, options)
            .then((stdout) => {
              // Convert to string if it's an array
              const output = Array.isArray(stdout) ? stdout.join('\n') : stdout;

              if (output && output.trim()) {
                try {
                  // Parse the JSON output from the PowerShell script
                  result = JSON.parse(output);
                } catch (error) {
                  console.error('Error parsing Graphics data:', error);
                  console.error('Raw Graphics data:', output);
                }
              } else {
                console.log('Output was empty or only whitespace');
              }

              // Add extended properties from NVIDIA if available
              if (result.controllers && result.controllers.length > 0) {
                const nvidiaData = nvidiaDevices();
                result.controllers = result.controllers.map((controller) => {
                  if (
                    controller.vendor.toLowerCase().includes('nvidia') &&
                    controller.subDeviceId
                  ) {
                    const matchedDevice = nvidiaData.find((device) => {
                      if (!device.subDeviceId) {
                        return false;
                      }

                      // Normalize device IDs for comparison
                      const ctrlId = (controller.subDeviceId || '').toLowerCase();
                      const nvId = device.subDeviceId.toLowerCase().replace(/^0x/, '');

                      return ctrlId === nvId;
                    });

                    if (matchedDevice) {
                      return mergeControllerNvidia(controller, matchedDevice);
                    }
                  }

                  return controller;
                });
              }

              if (callback) {
                callback(result);
              }

              resolve(result);
            })
            .catch((error) => {
              console.error('Graphics command error:', error);

              if (callback) {
                callback(result);
              }

              resolve(result);
            });
        } catch (error) {
          console.error('Graphics command error:', error);

          if (callback) {
            callback(result);
          }

          resolve(result);
        }
      } else if (
        platformFlags._freebsd ||
        platformFlags._openbsd ||
        platformFlags._netbsd ||
        platformFlags._sunos
      ) {
        // Not implemented for these platforms
        if (callback) {
          callback(result);
        }

        resolve(result);
      }
    });
  });
}
