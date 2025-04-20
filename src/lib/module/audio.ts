// ==================================================================================
// audio.ts
// ----------------------------------------------------------------------------------
// Description:   System Information - library
//                for Node.js
// Copyright:     (c) 2014 - 2025
// Author:        Sebastian Hildebrandt
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 16. audio
// ----------------------------------------------------------------------------------

import { exec, execSync } from 'child_process';
import path from 'path';

import * as util from '../util';
import type { PlatformFlags } from '../util/platform';
import { getPlatformFlagsFromOptions } from '../util/platform';

interface IAudioDevice {
  id: string | null;
  name: string | null;
  manufacturer: string | null;
  revision?: string | null;
  driver?: string | null;
  default?: boolean | null;
  channel: string | null;
  type: string | null;
  in?: boolean | null;
  out?: boolean | null;
  status: string | null;
}

interface IAudioPciDevice {
  slotId: string;
  driver: string;
}

function getAudioScriptPath(): string {
  // Calculate the path to the PowerShell script relative to this file
  return path.resolve(__dirname, '../../powershell/audio.ps1');
}

function parseAudioType(str: string, input: boolean | null, output: boolean | null): string | null {
  str = str.toLowerCase();
  let result: string | null = null;

  if (str.includes('input')) {
    result = 'Microphone';
  }

  if (str.includes('display audio')) {
    result = 'Speaker';
  }

  if (str.includes('speak')) {
    result = 'Speaker';
  }

  if (str.includes('laut')) {
    result = 'Speaker';
  }

  if (str.includes('loud')) {
    result = 'Speaker';
  }

  if (str.includes('head')) {
    result = 'Headset';
  }

  if (str.includes('mic')) {
    result = 'Microphone';
  }

  if (str.includes('mikr')) {
    result = 'Microphone';
  }

  if (str.includes('phone')) {
    result = 'Phone';
  }

  if (str.includes('controll')) {
    result = 'Controller';
  }

  if (str.includes('line o')) {
    result = 'Line Out';
  }

  if (str.includes('digital o')) {
    result = 'Digital Out';
  }

  if (str.includes('smart sound technology')) {
    result = 'Digital Signal Processor';
  }

  if (str.includes('high definition audio')) {
    result = 'Sound Driver';
  }

  if (!result && output) {
    result = 'Speaker';
  } else if (!result && input) {
    result = 'Microphone';
  }

  return result;
}

function getLinuxAudioPci(): IAudioPciDevice[] {
  const cmd = 'lspci -v 2>/dev/null';
  const result: IAudioPciDevice[] = [];

  try {
    const parts = execSync(cmd, util.execOptsLinux).toString().split('\n\n');

    for (const element of parts) {
      const lines = element.split('\n');

      if (lines && lines.length > 0 && lines[0].toLowerCase().includes('audio')) {
        const audioDevice: IAudioPciDevice = {
          slotId: lines[0].split(' ')[0],
          driver:
            util.getValue(lines, 'Kernel driver in use', ':', true) ||
            util.getValue(lines, 'Kernel modules', ':', true) ||
            '',
        };

        result.push(audioDevice);
      }
    }

    return result;
  } catch {
    return result;
  }
}

function parseLinuxAudioPciMM(lines: string[], audioPCI: IAudioPciDevice[]): IAudioDevice {
  const result: IAudioDevice = {
    id: null,
    name: null,
    manufacturer: null,
    revision: null,
    driver: null,
    default: null,
    channel: null,
    type: null,
    in: null,
    out: null,
    status: null,
  };

  const slotId = util.getValue(lines, 'Slot');

  const pciMatch = audioPCI.filter((item) => item.slotId === slotId);

  result.id = slotId;
  result.name = util.getValue(lines, 'SDevice');
  result.manufacturer = util.getValue(lines, 'SVendor');
  result.revision = util.getValue(lines, 'Rev');
  result.driver = pciMatch && pciMatch.length === 1 && pciMatch[0].driver ? pciMatch[0].driver : '';
  result.default = null;
  result.channel = 'PCIe';
  result.type = parseAudioType(result.name || '', null, null);
  result.in = null;
  result.out = null;
  result.status = 'online';

  return result;
}

function parseDarwinChannel(str: string): string {
  let result = '';

  if (str.includes('builtin')) {
    result = 'Built-In';
  }

  if (str.includes('extern')) {
    result = 'Audio-Jack';
  }

  if (str.includes('hdmi')) {
    result = 'HDMI';
  }

  if (str.includes('displayport')) {
    result = 'Display-Port';
  }

  if (str.includes('usb')) {
    result = 'USB';
  }

  if (str.includes('pci')) {
    result = 'PCIe';
  }

  return result;
}

interface IDarwinAudioObject {
  _name?: string;
  coreaudio_device_transport?: string;
  coreaudio_device_manufacturer?: string;
  coreaudio_default_audio_input_device?: string;
  coreaudio_default_audio_output_device?: string;
  coreaudio_device_input?: string;
  coreaudio_device_output?: string;
}

interface IDarwinAudioDataType {
  _items: IDarwinAudioObject[];
  [key: string]: any;
}

interface IDarwinAudioData {
  SPAudioDataType: IDarwinAudioDataType[];
  [key: string]: any;
}

function parseDarwinAudio(audioObject: IDarwinAudioObject, id: number): IAudioDevice {
  const result: IAudioDevice = {
    id: null,
    name: null,
    manufacturer: null,
    revision: null,
    driver: null,
    default: null,
    channel: null,
    type: null,
    in: null,
    out: null,
    status: null,
  };

  const channelStr = (
    (audioObject.coreaudio_device_transport || '') +
    ' ' +
    (audioObject._name || '')
  ).toLowerCase();

  result.id = id.toString();
  result.name = audioObject._name || null;
  result.manufacturer = audioObject.coreaudio_device_manufacturer || null;
  result.revision = null;
  result.driver = null;
  result.default =
    Boolean(audioObject.coreaudio_default_audio_input_device || '') ||
    Boolean(audioObject.coreaudio_default_audio_output_device || '');
  result.channel = parseDarwinChannel(channelStr);
  result.type = parseAudioType(
    result.name || '',
    Boolean(audioObject.coreaudio_device_input || ''),
    Boolean(audioObject.coreaudio_device_output || ''),
  );
  result.in = Boolean(audioObject.coreaudio_device_input || '');
  result.out = Boolean(audioObject.coreaudio_device_output || '');
  result.status = 'online';

  return result;
}

interface IAudioOptions {
  platform?: string;
  [key: string]: any;
}

type IAudioCallback = (data: IAudioDevice[]) => void;

function audio(options: IAudioOptions = {}, callback?: IAudioCallback): Promise<IAudioDevice[]> {
  // Get platform flags from options
  const platform: PlatformFlags = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(() => {
      const result: IAudioDevice[] = [];

      // Only one platform-specific block should execute
      if (platform._linux || platform._freebsd || platform._openbsd || platform._netbsd) {
        const cmd = 'lspci -vmm 2>/dev/null';

        exec(cmd, (error, stdout) => {
          // PCI
          if (!error) {
            const audioPCI = getLinuxAudioPci();
            const parts = stdout.toString().split('\n\n');

            for (const element of parts) {
              const lines = element.split('\n');

              if (util.getValue(lines, 'class', ':', true).toLowerCase().includes('audio')) {
                const audioPciDevice = parseLinuxAudioPciMM(lines, audioPCI);
                result.push(audioPciDevice);
              }
            }
          }

          if (callback) {
            callback(result);
          }

          resolve(result);
        });
      } else if (platform._darwin) {
        const cmd = 'system_profiler SPAudioDataType -json';

        exec(cmd, (error, stdout) => {
          if (!error) {
            try {
              const outObj = JSON.parse(stdout.toString()) as IDarwinAudioData;

              if (
                outObj.SPAudioDataType &&
                outObj.SPAudioDataType.length > 0 &&
                outObj.SPAudioDataType[0] &&
                outObj.SPAudioDataType[0]._items &&
                outObj.SPAudioDataType[0]._items.length > 0
              ) {
                for (let i = 0; i < outObj.SPAudioDataType[0]._items.length; i++) {
                  const audioDevice = parseDarwinAudio(outObj.SPAudioDataType[0]._items[i], i);
                  result.push(audioDevice);
                }
              }
            } catch {
              util.noop();
            }
          }

          if (callback) {
            callback(result);
          }

          resolve(result);
        });
      } else if (platform._windows) {
        // Get the path to the PowerShell script file
        const scriptPath = getAudioScriptPath();

        // Execute the PowerShell script using the centralized utility function
        util
          .executeScript(scriptPath, options)
          .then((stdout) => {
            try {
              // Handle empty or error response
              if (!stdout || stdout.toString().trim() === '') {
                console.error('Empty response from PowerShell');

                if (callback) {
                  callback(result);
                }

                resolve(result);

                return;
              }

              // Check for error message
              if (stdout.toString().includes('ERROR:')) {
                console.error('PowerShell error:', stdout);

                if (callback) {
                  callback(result);
                }

                resolve(result);

                return;
              }

              // Parse JSON response
              const response = JSON.parse(stdout.toString());
              const devices = response.Devices || [];

              // Process each device
              for (const device of devices) {
                if (device && device.Name) {
                  const deviceAudio: IAudioDevice = {
                    id: device.DeviceID || null,
                    name: device.Name || null,
                    manufacturer: device.Manufacturer || null,
                    channel:
                      device.ConnectionType && device.ConnectionType !== 'Unknown'
                        ? device.ConnectionType
                        : null,
                    type: parseAudioType(
                      String(device.Name || ''),
                      Boolean(device.IsInput) || false,
                      Boolean(device.IsOutput) || false,
                    ),
                    status: device.Status || (device.StatusInfo === 3 ? 'online' : 'offline'),
                  };

                  result.push(deviceAudio);
                }
              }
            } catch (error) {
              console.error('Error parsing audio device JSON:', error);
              console.error('Raw output:', stdout);
            }

            if (callback) {
              callback(result);
            }

            resolve(result);
          })
          .catch((error: Error) => {
            console.error(`Error getting Windows audio data: ${error.message}`);

            if (callback) {
              callback(result);
            }

            resolve(result);
          });
      } else if (platform._sunos) {
        resolve([]);
      } else {
        // Platform not supported
        if (callback) {
          callback(result);
        }

        resolve(result);
      }
    });
  });
}

export { audio };
