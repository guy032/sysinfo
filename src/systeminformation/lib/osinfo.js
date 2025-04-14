// @ts-check
// ==================================================================================
// osinfo.js
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

const os = require('os');
const fs = require('fs');
const util = require('./util');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;

let _platform = process.platform;
let _linux, _darwin, _windows, _freebsd, _openbsd, _netbsd, _sunos;

function setPlatform(platform) {
  _platform = platform || process.platform;
  _linux = _platform === 'linux' || _platform === 'android';
  _darwin = _platform === 'darwin';
  _windows = _platform === 'win32';
  _freebsd = _platform === 'freebsd';
  _openbsd = _platform === 'openbsd';
  _netbsd = _platform === 'netbsd';
  _sunos = _platform === 'sunos';
}

setPlatform(_platform);

// --------------------------
// Get current time and OS uptime

function time(options = {}, callback) {
  if (options.platform) {
    setPlatform(options.platform);
  }

  return new Promise((resolve) => {
    process.nextTick(() => {
      let result = {};

      /* if (_darwin || _linux) {
        try {
          const stdout = execSync('date +%Z && date +%z && ls -l /etc/localtime 2>/dev/null', util.execOptsLinux);
          const lines = stdout.toString().split('\r\n');
          if (lines.length > 3 && !lines[0]) {
            lines.shift();
          }
          let timezone = lines[0] || '';
          if (timezone.startsWith('+') || timezone.startsWith('-')) {
            timezone = 'GMT';
          }
          result = {
            current: Date.now(),
            uptime: os.uptime(),
            timezone: lines[1] ? timezone + lines[1] : timezone,
            timezoneName: lines[2] && lines[2].indexOf('/zoneinfo/') > 0 ? (lines[2].split('/zoneinfo/')[1] || '') : ''
          };
          if (callback) {
            callback(result);
          }
          resolve(result);
        } catch (e) {
          util.noop();
          if (callback) {
            callback(result);
          }
          resolve(result);
        }
      } else  */ if (_windows) {
        try {
          const workload = [];
          workload.push(util.powerShell('$date = Get-Date; Write-Output $date.Ticks', options));
          workload.push(
            util.powerShell(
              '$uptime = (Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime; $uptimeSpan = (Get-Date) - $uptime; $uptimeSeconds = [math]::Floor($uptimeSpan.TotalSeconds); Write-Output $uptimeSeconds',
              options,
            ),
          );
          workload.push(util.powerShell('(Get-TimeZone).DisplayName', options));
          workload.push(util.powerShell('(Get-TimeZone).Id', options));

          util.promiseAll(workload).then((data) => {
            result = {
              current: Number.parseInt(data.results[0]) / 10_000 - 62_135_596_800_000, // Convert Windows ticks to Unix timestamp
              uptime: Number.parseInt(data.results[1]),
              timezone: data.results[2],
              timezoneName: data.results[3],
            };

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

exports.time = time;

// --------------------------
// Get logo filename of OS distribution

function getLogoFile(options = {}, distro) {
  if (options.platform) {
    setPlatform(options.platform);
  }

  distro = distro || '';
  distro = distro.toLowerCase();
  let result = _platform;

  if (_windows) {
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
// OS Information

function osInfo(options = {}, callback) {
  if (options.platform) {
    setPlatform(options.platform);
  }

  return new Promise((resolve) => {
    process.nextTick(() => {
      const result = {
        platform: _platform === 'win32' ? 'Windows' : _platform,
        distro: 'unknown',
        release: 'unknown',
        codename: '',
        kernel: '',
        arch: '',
        hostname: '',
        fqdn: '',
        codepage: '',
        logofile: '',
        serial: '',
        build: '',
        servicepack: '',
        uefi: false,
      };

      if (_linux) {
        exec(
          'cat /etc/*-release; cat /usr/lib/os-release; cat /etc/openwrt_release',
          function (error, stdout) {
            /**
             * @namespace
             * @property {string}  DISTRIB_ID
             * @property {string}  NAME
             * @property {string}  DISTRIB_RELEASE
             * @property {string}  VERSION_ID
             * @property {string}  DISTRIB_CODENAME
             */
            const release = {};
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
            isUefiLinux().then((uefi) => {
              result.uefi = uefi;
              uuid().then((data) => {
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

      if (_freebsd || _openbsd || _netbsd) {
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
            const uefi = bootmethod
              ? bootmethod.toLowerCase().includes('uefi')
              : (uefiConf
                ? uefiConf
                : null);
            result.distro = distro || result.distro;
            result.logofile = logofile || result.logofile;
            result.release = release || result.release;
            result.serial = serial || result.serial;
            result.codename = '';
            result.codepage = util.getCodepage();
            result.uefi = uefi || null;

            if (callback) {
              callback(result);
            }

            resolve(result);
          },
        );
      }

      if (_darwin) {
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

      if (_sunos) {
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

      if (_windows) {
        result.logofile = getLogoFile(options);
        result.release = result.kernel;

        try {
          const workload = [];
          workload.push(
            util.powerShell(
              'Get-CimInstance Win32_OperatingSystem | select Caption,SerialNumber,BuildNumber,ServicePackMajorVersion,ServicePackMinorVersion | fl',
              options,
            ),
          );
          workload.push(
            util.powerShell('(Get-CimInstance Win32_ComputerSystem).HypervisorPresent', options),
          );
          workload.push(
            util.powerShell(
              'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SystemInformation]::TerminalServerSession',
              options,
            ),
          );
          util.promiseAll(workload).then((data) => {
            const lines = data.results[0] ? data.results[0].toString().split('\r\n') : [''];
            result.distro = util.getValue(lines, 'Caption', ':').trim();
            result.serial = util.getValue(lines, 'SerialNumber', ':').trim();
            result.build = util.getValue(lines, 'BuildNumber', ':').trim();
            result.servicepack =
              util.getValue(lines, 'ServicePackMajorVersion', ':').trim() +
              '.' +
              util.getValue(lines, 'ServicePackMinorVersion', ':').trim();
            result.codepage = util.getCodepage(options);
            const hyperv = data.results[1] ? data.results[1].toString().toLowerCase() : '';
            result.hypervisor = hyperv.includes('true');
            const term = data.results[2] ? data.results[2].toString() : '';
            result.remoteSession = term.toString().toLowerCase().includes('true');
            isUefiWindows().then((uefi) => {
              result.uefi = uefi;

              if (callback) {
                callback(result);
              }

              resolve(result);
            });
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
}

exports.osInfo = osInfo;

function isUefiLinux() {
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
}

function isUefiWindows() {
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
}

function applications(options = {}, apps, callback) {
  if (options.platform) {
    setPlatform(options.platform);
  }

  return new Promise((resolve) => {
    process.nextTick(() => {
      let apps = [];

      if (_windows) {
        try {
          // First, get all software applications from registry using pagination
          // Fetch applications in batches of 100 until we get less than 100 results
          let allApps = [];
          const batchSize = 100;

          const fetchBatch = (skip) => {
            const powershellScript = `Get-ItemProperty -Path "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*", "HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*", "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*" | Where-Object { $_.DisplayName } | ForEach-Object { [PSCustomObject]@{ Name = $_.DisplayName; Version = $_.DisplayVersion; Publisher = $_.Publisher; InstallDate = $_.InstallDate; InstallSource = $_.InstallSource; UninstallString = $_.UninstallString; InstallLocation = $_.InstallLocation; EstimatedSizeMB = if ($_.EstimatedSize) { [math]::Round($_.EstimatedSize / 1024, 2) } else { $null } } } | Sort-Object Name | Select-Object -Skip ${skip} -First ${batchSize} | ConvertTo-Json -Depth 3 -Compress`;

            return util
              .powerShell(powershellScript, options)
              .then((stdout) => {
                try {
                  const batchApps = JSON.parse(stdout);
                  // Check if we got an array or a single object
                  const appsArray = Array.isArray(batchApps)
                    ? batchApps
                    : (batchApps
                      ? [batchApps]
                      : []);

                  if (appsArray.length > 0) {
                    allApps = allApps.concat(appsArray);

                    // If we got 50 items, there might be more to fetch
                    if (appsArray.length === batchSize) {
                      return fetchBatch(skip + batchSize);
                    }
                  }

                  // We've retrieved all apps, process them

                  apps = allApps;

                  return apps;
                } catch (error) {
                  console.log('Error parsing PowerShell output:', error);

                  return apps;
                }
              })
              .catch((error) => {
                console.log('Error executing PowerShell command:', error);

                return apps;
              });
          };

          // Start fetching batches from index 0
          fetchBatch(0).then((applications) => {
            if (callback) {
              callback(applications);
            }

            resolve(applications);
          });
        } catch {
          if (callback) {
            callback(apps);
          }

          resolve(apps);
        }
      }
    });
  });
}

exports.applications = applications;

function shell(options = {}, callback) {
  if (options.platform) {
    setPlatform(options.platform);
  }

  return new Promise((resolve) => {
    process.nextTick(() => {
      if (_windows) {
        try {
          const result = 'PowerShell';

          if (callback) {
            callback(result);
          }

          resolve(result);
        } catch {
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

exports.shell = shell;

async function getUniqueMacAdresses(options = {}) {
  let macs = [];

  // Use PowerShell for Windows
  if (_windows) {
    try {
      // Get network adapters using PowerShell
      const interfacesCmd =
        'Get-NetAdapter | Select-Object -Property Name, InterfaceDescription, Status, MacAddress | Format-List';
      const interfacesResult = await util.powerShell(interfacesCmd, options);

      // Parse interfaces information
      const interfaceSections = interfacesResult
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
      console.log('Error getting MAC addresses via PowerShell:', error);
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

function uuid(options = {}, callback) {
  if (options.platform) {
    setPlatform(options.platform);
  }

  return new Promise((resolve) => {
    process.nextTick(async () => {
      const result = {
        os: '',
        hardware: '',
        macs: [],
      };
      let parts;

      if (_darwin) {
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

      if (_linux) {
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

      if (_freebsd || _openbsd || _netbsd) {
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

      if (_windows) {
        result.macs = await getUniqueMacAdresses(options);
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
            const lines = stdout.split('\r\n');
            result.hardware = util.getValue(lines, 'uuid', ':').toLowerCase();
            util
              .powerShell(
                `${sysdir}\\reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid`,
                options,
              )
              .then((stdout) => {
                parts = stdout.toString().split('\n\r')[0].split('REG_SZ');
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
}

exports.uuid = uuid;
