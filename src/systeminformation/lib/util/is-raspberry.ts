import fs from 'fs';

import getValue from './get-value';

// Cache Raspberry Pi CPU info to avoid repeated file reads
let _rpi_cpuinfo: string[] | null = null;

/**
 * Check if system is a Raspberry Pi based on CPU info
 *
 * @param {string[]} [cpuinfo] - CPU info from /proc/cpuinfo or cached info
 * @returns {boolean} True if system is a Raspberry Pi
 */
export function isRaspberry(cpuinfo?: string[]): boolean {
  const PI_MODEL_NO = [
    'BCM2708',
    'BCM2709',
    'BCM2710',
    'BCM2711',
    'BCM2712',
    'BCM2835',
    'BCM2836',
    'BCM2837',
    'BCM2837B0',
  ];

  if (_rpi_cpuinfo !== null) {
    cpuinfo = _rpi_cpuinfo;
  } else if (cpuinfo === undefined) {
    try {
      cpuinfo = fs.readFileSync('/proc/cpuinfo', { encoding: 'utf8' }).toString().split('\n');
      _rpi_cpuinfo = cpuinfo;
    } catch {
      return false;
    }
  }

  const hardware = getValue(cpuinfo, 'hardware');

  return Boolean(hardware) && PI_MODEL_NO.some((model) => hardware.includes(model));
}

export default isRaspberry;
