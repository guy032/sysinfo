// ==================================================================================
// osinfo.ts
// ----------------------------------------------------------------------------------
// Description:   System Information - library
//                for Node.js
// Copyright:     (c) 2014 - 2025
// Author:        Sebastian Hildebrandt
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 3. Operating System
// ----------------------------------------------------------------------------------

import { exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import path from 'path';

import * as util from '../util';
import { getPlatformFlags, getPlatformFlagsFromOptions } from '../util/platform';

// Define interfaces for function results
interface TimeData {
  current: number;
  uptime: number;
  timezone: string;
  timezoneName: string;
}

interface OSInfo {
  platform: string;
  distro?: string;
  release?: string;
  codename?: string;
  kernel?: string;
  arch?: string;
  hostname?: string;
  fqdn?: string;
  codepage?: string;
  logofile?: string;
  serial?: string;
  build?: string;
  servicepack?: string;
  uefi?: boolean | null;
  hypervisor?: boolean;
  remoteSession?: boolean;
}

interface ApplicationInfo {
  Name: string;
  Version: string;
  Publisher?: string;
  InstallDate?: string;
  InstallSource?: string;
  UninstallString?: string;
  InstallLocation?: string;
  EstimatedSizeMB?: number;
}

interface UUIDInfo {
  os: string;
  hardware: string;
  macs: string[];
}

interface OsInfoOptions {
  platform?: string;
  [key: string]: any;
}

// Mapping for Windows printer status
type LogoType = string;

// Get the platform flags for default operations
const { _platform, _linux, _darwin, _windows, _freebsd, _openbsd, _netbsd, _sunos } =
  getPlatformFlags();

// --------------------------
// Get current time and OS uptime

function time(options: OsInfoOptions = {}, callback?: (data: TimeData) => void): Promise<TimeData> {
  const platformFlags = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(() => {
      const result: TimeData = {
        current: Date.now(),
        uptime: os.uptime(),
        timezone: '',
        timezoneName: '',
      };

      if (platformFlags._windows) {
        try {
          // Create an array of promises for PowerShell commands
          const commands = [
            '$date = Get-Date; Write-Output $date.Ticks',
            '$uptime = (Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime; $uptimeSpan = (Get-Date) - $uptime; $uptimeSeconds = [math]::Floor($uptimeSpan.TotalSeconds); Write-Output $uptimeSeconds',
            '(Get-TimeZone).DisplayName',
            '(Get-TimeZone).Id',
          ];

          const workload = commands.map((cmd) => util.powerShell(cmd, options));

          util.promiseAll(workload).then((data) => {
            result.current = Number.parseInt(data.results[0], 10) / 10_000 - 62_135_596_800_000; // Convert Windows ticks to Unix timestamp
            result.uptime = Number.parseInt(data.results[1], 10);
            result.timezone = data.results[2];
            result.timezoneName = data.results[3];

            if (callback) {
              callback(result);
            }

            resolve(result);
          });
        } catch {
          if (callback) {
            callback(result);
          }

          resolve(result);
        }
      } else {
        if (callback) {
          callback(result);
        }

        resolve(result);
      }
    });
  });
}

// --------------------------
// Get logo filename of OS distribution

function getLogoFile(options: OsInfoOptions = {}, distro?: string): string {
  const platformFlags = getPlatformFlagsFromOptions(options);

  distro = distro || '';
  distro = distro.toLowerCase();
  let result = platformFlags._platform as string;

  if (platformFlags._windows) {
    result = 'windows';
  } else if (distro.includes('mac os') || distro.includes('macos')) {
    result = 'apple';
  } else if (distro.includes('arch')) {
    result = 'arch';
  } else if (distro.includes('cachy')) {
    result = 'cachy';
  } else if (distro.includes('centos')) {
    result = 'centos';
  } else if (distro.includes('coreos')) {
    result = 'coreos';
  } else if (distro.includes('debian')) {
    result = 'debian';
  } else if (distro.includes('deepin')) {
    result = 'deepin';
  } else if (distro.includes('elementary')) {
    result = 'elementary';
  } else if (distro.includes('endeavour')) {
    result = 'endeavour';
  } else if (distro.includes('fedora')) {
    result = 'fedora';
  } else if (distro.includes('gentoo')) {
    result = 'gentoo';
  } else if (distro.includes('mageia')) {
    result = 'mageia';
  } else if (distro.includes('mandriva')) {
    result = 'mandriva';
  } else if (distro.includes('manjaro')) {
    result = 'manjaro';
  } else if (distro.includes('mint')) {
    result = 'mint';
  } else if (distro.includes('mx')) {
    result = 'mx';
  } else if (distro.includes('openbsd')) {
    result = 'openbsd';
  } else if (distro.includes('freebsd')) {
    result = 'freebsd';
  } else if (distro.includes('opensuse')) {
    result = 'opensuse';
  } else if (distro.includes('pclinuxos')) {
    result = 'pclinuxos';
  } else if (distro.includes('puppy')) {
    result = 'puppy';
  } else if (distro.includes('popos')) {
    result = 'popos';
  } else if (distro.includes('raspbian')) {
    result = 'raspbian';
  } else if (distro.includes('reactos')) {
    result = 'reactos';
  } else if (distro.includes('redhat')) {
    result = 'redhat';
  } else if (distro.includes('slackware')) {
    result = 'slackware';
  } else if (distro.includes('sugar')) {
    result = 'sugar';
  } else if (distro.includes('steam')) {
    result = 'steam';
  } else if (distro.includes('suse')) {
    result = 'suse';
  } else if (distro.includes('mate')) {
    result = 'ubuntu-mate';
  } else if (distro.includes('lubuntu')) {
    result = 'lubuntu';
  } else if (distro.includes('xubuntu')) {
    result = 'xubuntu';
  } else if (distro.includes('ubuntu')) {
    result = 'ubuntu';
  } else if (distro.includes('solaris')) {
    result = 'solaris';
  } else if (distro.includes('tails')) {
    result = 'tails';
  } else if (distro.includes('feren')) {
    result = 'ferenos';
  } else if (distro.includes('robolinux')) {
    result = 'robolinux';
  } else if (_linux && distro) {
    result = distro.toLowerCase().trim().replaceAll(/\s+/g, '-');
  }

  return result;
}

// --------------------------
// Check if system is UEFI or BIOS - Linux
const isUefiLinux = function (): Promise<boolean> {
  return new Promise((resolve) => {
    process.nextTick(() => {
      fs.stat('/sys/firmware/efi', function (err) {
        if (!err) {
          return resolve(true);
        }

        exec('dmesg | grep -E "EFI v"', function (error, stdout) {
          if (!error) {
            const lines = stdout.toString().split('\n');

            return resolve(lines.length > 0);
          }

          return resolve(false);
        });
      });
    });
  });
};

// --------------------------
// Check if system is UEFI or BIOS - Windows
const isUefiWindows = function (): Promise<boolean> {
  return new Promise((resolve) => {
    process.nextTick(() => {
      try {
        exec(
          'findstr /C:"Detected boot environment" "%windir%\\Panther\\setupact.log"',
          util.execOptsWin,
          function (error, stdout) {
            if (!error) {
              const line = stdout.toString().split('\n\r')[0];

              return resolve(line.toLowerCase().includes('efi'));
            }

            exec('echo %firmware_type%', util.execOptsWin, function (error, stdout) {
              if (!error) {
                const line = stdout.toString() || '';

                return resolve(line.toLowerCase().includes('efi'));
              }

              return resolve(false);
            });
          },
        );
      } catch {
        return resolve(false);
      }
    });
  });
};

// --------------------------
// Get unique MAC addresses
async function getUniqueMacAddresses(options: OsInfoOptions = {}): Promise<string[]> {
  let macs: string[] = [];
  const platformFlags = getPlatformFlagsFromOptions(options);

  // Use PowerShell for Windows
  if (platformFlags._windows) {
    try {
      // Get network adapters using PowerShell
      const interfacesCmd =
        'Get-NetAdapter | Select-Object -Property Name, InterfaceDescription, Status, MacAddress | Format-List';
      const interfacesResult = await util.powerShell(interfacesCmd, options);
      const interfacesStr = Array.isArray(interfacesResult)
        ? interfacesResult.join('\n')
        : interfacesResult;

      // Parse interfaces information
      const interfaceSections = interfacesStr
        .toString()
        .split(/\r?\n\s*\r?\n/)
        .filter((section) => section.trim());

      for (const section of interfaceSections) {
        const lines = section.split(/\r?\n/).filter((line) => line.trim());
        let macAddress = '';

        for (const line of lines) {
          const parts = line.split(':');

          if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();

            if (key === 'MacAddress') {
              macAddress = value.toLowerCase();

              if (macAddress && macAddress !== '00:00:00:00:00:00' && !macs.includes(macAddress)) {
                macs.push(macAddress);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting MAC addresses via PowerShell:', error);
    }
  }

  // Sort MAC addresses
  macs = macs.sort(function (a, b) {
    if (a < b) {
      return -1;
    }

    if (a > b) {
      return 1;
    }

    return 0;
  });

  return macs;
}

// --------------------------
// Get detailed UUID information
const uuid = function (
  options: OsInfoOptions = {},
  callback?: (data: UUIDInfo) => void,
): Promise<UUIDInfo> {
  const platformFlags = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(async () => {
      const result: UUIDInfo = {
        os: '',
        hardware: '',
        macs: [],
      };

      if (platformFlags._darwin) {
        exec('system_profiler SPHardwareDataType -json', function (error, stdout) {
          if (!error) {
            try {
              const jsonObj = JSON.parse(stdout.toString());

              if (jsonObj.SPHardwareDataType && jsonObj.SPHardwareDataType.length > 0) {
                const spHardware = jsonObj.SPHardwareDataType[0];
                result.os = spHardware.platform_UUID.toLowerCase();
                result.hardware = spHardware.serial_number;
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
      }

      if (platformFlags._linux) {
        const cmd = `echo -n "os: "; cat /var/lib/dbus/machine-id 2> /dev/null ||
cat /etc/machine-id 2> /dev/null; echo;
echo -n "hardware: "; cat /sys/class/dmi/id/product_uuid 2> /dev/null; echo;`;
        exec(cmd, function (error, stdout) {
          const lines = stdout.toString().split('\n');
          result.os = util.getValue(lines, 'os').toLowerCase();
          result.hardware = util.getValue(lines, 'hardware').toLowerCase();

          if (!result.hardware) {
            const lines = fs
              .readFileSync('/proc/cpuinfo', { encoding: 'utf8' })
              .toString()
              .split('\n');
            const serial = util.getValue(lines, 'serial');
            result.hardware = serial || '';
          }

          if (callback) {
            callback(result);
          }

          resolve(result);
        });
      }

      if (platformFlags._freebsd || platformFlags._openbsd || platformFlags._netbsd) {
        exec('sysctl -i kern.hostid kern.hostuuid', function (error, stdout) {
          const lines = stdout.toString().split('\n');
          result.os = util.getValue(lines, 'kern.hostid', ':').toLowerCase();
          result.hardware = util.getValue(lines, 'kern.hostuuid', ':').toLowerCase();

          if (result.os.includes('unknown')) {
            result.os = '';
          }

          if (result.hardware.includes('unknown')) {
            result.hardware = '';
          }

          if (callback) {
            callback(result);
          }

          resolve(result);
        });
      }

      if (platformFlags._windows) {
        result.macs = await getUniqueMacAddresses(options);
        let sysdir = '%windir%\\System32';

        if (
          process.arch === 'ia32' &&
          Object.prototype.hasOwnProperty.call(process.env, 'PROCESSOR_ARCHITEW6432')
        ) {
          sysdir = '%windir%\\sysnative\\cmd.exe /c %windir%\\System32';
        }

        util
          .powerShell('Get-CimInstance Win32_ComputerSystemProduct | select UUID | fl', options)
          .then((stdout) => {
            // Handle potentially getting a string array
            const stdoutStr = Array.isArray(stdout) ? stdout.join('\n') : stdout;
            const lines = stdoutStr.split('\r\n');
            result.hardware = util.getValue(lines, 'uuid', ':').toLowerCase();

            util
              .powerShell(
                `${sysdir}\\reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid`,
                options,
              )
              .then((stdout) => {
                const stdoutStr = Array.isArray(stdout) ? stdout.join('\n') : stdout;
                const parts = stdoutStr.toString().split('\n\r')[0].split('REG_SZ');
                result.os =
                  parts.length > 1 ? parts[1].replaceAll(/\r+|\n+|\s+/gi, '').toLowerCase() : '';

                if (callback) {
                  callback(result);
                }

                resolve(result);
              });
          });
      }
    });
  });
};

// --------------------------
// OS Information

const osInfo = function (
  options: OsInfoOptions = {},
  callback?: (data: OSInfo) => void,
): Promise<OSInfo> {
  const platformFlags = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(() => {
      const result: OSInfo = {
        platform: platformFlags._platform === 'win32' ? 'Windows' : platformFlags._platform,
        uefi: false,
      };

      if (platformFlags._linux) {
        exec(
          'cat /etc/*-release; cat /usr/lib/os-release; cat /etc/openwrt_release',
          function (error, stdout) {
            interface ReleaseInfo {
              DISTRIB_ID?: string;
              NAME?: string;
              DISTRIB_RELEASE?: string;
              VERSION_ID?: string;
              DISTRIB_CODENAME?: string;
              VERSION_CODENAME?: string;
              PRETTY_NAME?: string;
              VERSION?: string;
              BUILD_ID?: string;
              [key: string]: string | undefined;
            }

            const release: ReleaseInfo = {};
            const lines = stdout.toString().split('\n');

            for (const line of lines) {
              if (line.includes('=')) {
                release[line.split('=')[0].trim().toUpperCase()] = line.split('=')[1].trim();
              }
            }

            result.distro = (release.DISTRIB_ID || release.NAME || 'unknown').replaceAll('"', '');
            result.logofile = getLogoFile(options, result.distro);
            let releaseVersion = (release.VERSION || '').replaceAll('"', '');
            let codename = (release.DISTRIB_CODENAME || release.VERSION_CODENAME || '').replaceAll(
              '"',
              '',
            );
            const prettyName = (release.PRETTY_NAME || '').replaceAll('"', '');

            if (prettyName.indexOf(result.distro + ' ') === 0) {
              releaseVersion = prettyName.replace(result.distro + ' ', '').trim();
            }

            if (releaseVersion.includes('(')) {
              codename = releaseVersion.split('(')[1].replaceAll(/[()]/g, '').trim();
              releaseVersion = releaseVersion.split('(')[0].trim();
            }

            result.release = (
              releaseVersion ||
              release.DISTRIB_RELEASE ||
              release.VERSION_ID ||
              'unknown'
            ).replaceAll('"', '');
            result.codename = codename;
            result.codepage = util.getCodepage();
            result.build = (release.BUILD_ID || '').replaceAll('"', '').trim();

            // Get UEFI info and UUID
            isUefiLinux().then((uefi) => {
              result.uefi = uefi;
              uuid(options).then((data) => {
                result.serial = data.os;

                if (callback) {
                  callback(result);
                }

                resolve(result);
              });
            });
          },
        );
      }

      if (platformFlags._freebsd || platformFlags._openbsd || platformFlags._netbsd) {
        exec(
          'sysctl kern.ostype kern.osrelease kern.osrevision kern.hostuuid machdep.bootmethod kern.geom.confxml',
          function (error, stdout) {
            const lines = stdout.toString().split('\n');
            const distro = util.getValue(lines, 'kern.ostype');
            const logofile = getLogoFile(options, distro);
            const release = util.getValue(lines, 'kern.osrelease').split('-')[0];
            const serial = util.getValue(lines, 'kern.uuid');
            const bootmethod = util.getValue(lines, 'machdep.bootmethod');
            const uefiConf = stdout.toString().includes('<type>efi</type>');

            let uefi: boolean | null = null;

            if (bootmethod) {
              uefi = bootmethod.toLowerCase().includes('uefi');
            } else if (uefiConf) {
              uefi = true;
            }

            result.distro = distro || result.distro;
            result.logofile = logofile || result.logofile;
            result.release = release || result.release;
            result.serial = serial || result.serial;
            result.codename = '';
            result.codepage = util.getCodepage();
            result.uefi = uefi;

            if (callback) {
              callback(result);
            }

            resolve(result);
          },
        );
      }

      if (platformFlags._darwin) {
        exec(
          'sw_vers; sysctl kern.ostype kern.osrelease kern.osrevision kern.uuid',
          function (error, stdout) {
            const lines = stdout.toString().split('\n');
            result.serial = util.getValue(lines, 'kern.uuid');
            result.distro = util.getValue(lines, 'ProductName');
            result.release = (
              util.getValue(lines, 'ProductVersion', ':', true, true) +
              ' ' +
              util.getValue(lines, 'ProductVersionExtra', ':', true, true)
            ).trim();
            result.build = util.getValue(lines, 'BuildVersion');
            result.logofile = getLogoFile(options, result.distro);
            result.codename = 'macOS';
            result.codename = result.release.includes('10.4') ? 'OS X Tiger' : result.codename;
            result.codename = result.release.includes('10.5') ? 'OS X Leopard' : result.codename;
            result.codename = result.release.includes('10.6')
              ? 'OS X Snow Leopard'
              : result.codename;
            result.codename = result.release.includes('10.7') ? 'OS X Lion' : result.codename;
            result.codename = result.release.includes('10.8')
              ? 'OS X Mountain Lion'
              : result.codename;
            result.codename = result.release.includes('10.9') ? 'OS X Mavericks' : result.codename;
            result.codename = result.release.includes('10.10') ? 'OS X Yosemite' : result.codename;
            result.codename = result.release.includes('10.11')
              ? 'OS X El Capitan'
              : result.codename;
            result.codename = result.release.includes('10.12') ? 'Sierra' : result.codename;
            result.codename = result.release.includes('10.13') ? 'High Sierra' : result.codename;
            result.codename = result.release.includes('10.14') ? 'Mojave' : result.codename;
            result.codename = result.release.includes('10.15') ? 'Catalina' : result.codename;
            result.codename = result.release.startsWith('11.') ? 'Big Sur' : result.codename;
            result.codename = result.release.startsWith('12.') ? 'Monterey' : result.codename;
            result.codename = result.release.startsWith('13.') ? 'Ventura' : result.codename;
            result.codename = result.release.startsWith('14.') ? 'Sonoma' : result.codename;
            result.codename = result.release.startsWith('15.') ? 'Sequoia' : result.codename;
            result.uefi = true;
            result.codepage = util.getCodepage();

            if (callback) {
              callback(result);
            }

            resolve(result);
          },
        );
      }

      if (platformFlags._sunos) {
        result.release = result.kernel;
        exec('uname -o', function (error, stdout) {
          const lines = stdout.toString().split('\n');
          result.distro = lines[0];
          result.logofile = getLogoFile(options, result.distro);

          if (callback) {
            callback(result);
          }

          resolve(result);
        });
      }

      if (platformFlags._windows) {
        result.logofile = getLogoFile(options);

        if (result.kernel) {
          result.release = result.kernel;
        }

        try {
          // Get the path to the PowerShell script file
          const scriptPath = path.resolve(__dirname, '../../powershell/osinfo.ps1');

          // Execute the PowerShell script using the centralized utility function
          util
            .executeScript(scriptPath, options)
            .then((stdout) => {
              // Convert to string if it's an array
              const output = Array.isArray(stdout) ? stdout.join('\n') : stdout;

              if (output && output.trim()) {
                try {
                  const data = JSON.parse(output);

                  // Process OS data
                  result.distro = data.caption || 'unknown';
                  result.serial = data.serialNumber || '';
                  result.build = data.buildNumber || '';
                  result.servicepack = `${data.servicePackMajorVersion || '0'}.${data.servicePackMinorVersion || '0'}`;
                  result.codepage = util.getCodepage(options);

                  // Process system data
                  result.hypervisor = data.hypervisorPresent || false;
                  result.remoteSession = data.terminalServerSession || false;
                  result.uefi = data.uefi || false;

                  if (callback) {
                    callback(result);
                  }

                  resolve(result);
                } catch (error) {
                  console.error('Error parsing OS data:', error);

                  // Fallback to default values
                  if (callback) {
                    callback(result);
                  }

                  resolve(result);
                }
              } else {
                if (callback) {
                  callback(result);
                }

                resolve(result);
              }
            })
            .catch(() => {
              if (callback) {
                callback(result);
              }

              resolve(result);
            });
        } catch {
          if (callback) {
            callback(result);
          }

          resolve(result);
        }
      }
    });
  });
};

/**
 * Helper function to fetch all installed applications with pagination
 */
async function fetchAllApplications(options: OsInfoOptions = {}): Promise<ApplicationInfo[]> {
  const allApps: ApplicationInfo[] = [];
  let skip = 0;
  const batchSize = 100;
  let totalCount = 0;
  let hasMoreData = true;

  // Get the script path
  const scriptPath = path.resolve(__dirname, '../../powershell/applications.ps1');

  // Keep fetching until we have all applications
  while (hasMoreData) {
    try {
      // Execute the script with pagination parameters
      options.batch = {
        skip,
        batchSize,
      };
      const batchResult = await util.executeScript(scriptPath, options);

      // Parse the batch results
      const batchData = JSON.parse(Array.isArray(batchResult) ? batchResult.join('') : batchResult);

      // Extract the application items and metadata
      const items = batchData.Items || [];
      totalCount = batchData.TotalCount || 0;

      // Add applications from this batch to our collection
      if (Array.isArray(items)) {
        allApps.push(...items);
      }

      // Determine if we need to fetch more batches
      skip += batchSize;

      if (skip >= totalCount || items.length === 0) {
        hasMoreData = false;
      }
    } catch (error) {
      console.error(`Error fetching applications batch starting at ${skip}:`, error);
      hasMoreData = false; // Stop on error
      break;
    }
  }

  return allApps;
}

// --------------------------
// Get installed applications
function applications(
  options: OsInfoOptions = {},
  callback?: (data: ApplicationInfo[]) => void,
): Promise<ApplicationInfo[]> {
  const platformFlags = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(async () => {
      const apps: ApplicationInfo[] = [];

      if (platformFlags._windows) {
        try {
          const devices = await fetchAllApplications(options);

          if (callback) {
            callback(devices);
          }

          resolve(devices);
        } catch (error) {
          console.error('Error retrieving applications:', error);

          if (callback) {
            callback(apps);
          }

          resolve(apps);
        }
      } else {
        // For non-Windows platforms, just return empty array
        if (callback) {
          callback(apps);
        }

        resolve(apps);
      }
    });
  });
}

// --------------------------
// Get shell
function shell(options: OsInfoOptions = {}, callback?: (data: string) => void): Promise<string> {
  const platformFlags = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(() => {
      if (platformFlags._windows) {
        try {
          const result = 'PowerShell';

          if (callback) {
            callback(result);
          }

          resolve(result);
        } catch {
          const result = 'PowerShell';

          if (callback) {
            callback(result);
          }

          resolve(result);
        }
      } else {
        let result = '';
        exec('echo $SHELL', function (error, stdout) {
          if (!error) {
            result = stdout.toString().split('\n')[0];
          }

          if (callback) {
            callback(result);
          }

          resolve(result);
        });
      }
    });
  });
}

export {
  ApplicationInfo,
  applications,
  OSInfo,
  osInfo,
  OsInfoOptions,
  shell,
  time,
  TimeData,
  uuid,
  UUIDInfo,
};
