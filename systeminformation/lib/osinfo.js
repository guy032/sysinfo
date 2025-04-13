'use strict';
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
  _linux = (_platform === 'linux' || _platform === 'android');
  _darwin = (_platform === 'darwin');
  _windows = (_platform === 'win32');
  _freebsd = (_platform === 'freebsd');
  _openbsd = (_platform === 'openbsd');
  _netbsd = (_platform === 'netbsd');
  _sunos = (_platform === 'sunos');
}

setPlatform(_platform);

// --------------------------
// Get current time and OS uptime

function time(options = {}, callback) {
  if (options.platform) setPlatform(options.platform);
  
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
          workload.push(util.powerShell('$uptime = (Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime; $uptimeSpan = (Get-Date) - $uptime; $uptimeSeconds = [math]::Floor($uptimeSpan.TotalSeconds); Write-Output $uptimeSeconds', options));
          workload.push(util.powerShell('(Get-TimeZone).DisplayName', options));
          workload.push(util.powerShell('(Get-TimeZone).Id', options));

          util.promiseAll(
            workload
          ).then((data) => {
            result = {
              current: parseInt(data.results[0]) / 10000 - 62135596800000, // Convert Windows ticks to Unix timestamp
              uptime: parseInt(data.results[1]),
              timezone: data.results[2],
              timezoneName: data.results[3]
            };
            if (callback) {
              callback(result);
            }
            resolve(result);
          });
        } catch (e) {
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
  if (options.platform) setPlatform(options.platform);

  distro = distro || '';
  distro = distro.toLowerCase();
  let result = _platform;
  if (_windows) {
    result = 'windows';
  }
  else if (distro.indexOf('mac os') !== -1 || distro.indexOf('macos') !== -1) {
    result = 'apple';
  }
  else if (distro.indexOf('arch') !== -1) {
    result = 'arch';
  }
  else if (distro.indexOf('cachy') !== -1) {
    result = 'cachy';
  }
  else if (distro.indexOf('centos') !== -1) {
    result = 'centos';
  }
  else if (distro.indexOf('coreos') !== -1) {
    result = 'coreos';
  }
  else if (distro.indexOf('debian') !== -1) {
    result = 'debian';
  }
  else if (distro.indexOf('deepin') !== -1) {
    result = 'deepin';
  }
  else if (distro.indexOf('elementary') !== -1) {
    result = 'elementary';
  }
  else if (distro.indexOf('endeavour') !== -1) {
    result = 'endeavour';
  }
  else if (distro.indexOf('fedora') !== -1) {
    result = 'fedora';
  }
  else if (distro.indexOf('gentoo') !== -1) {
    result = 'gentoo';
  }
  else if (distro.indexOf('mageia') !== -1) {
    result = 'mageia';
  }
  else if (distro.indexOf('mandriva') !== -1) {
    result = 'mandriva';
  }
  else if (distro.indexOf('manjaro') !== -1) {
    result = 'manjaro';
  }
  else if (distro.indexOf('mint') !== -1) {
    result = 'mint';
  }
  else if (distro.indexOf('mx') !== -1) {
    result = 'mx';
  }
  else if (distro.indexOf('openbsd') !== -1) {
    result = 'openbsd';
  }
  else if (distro.indexOf('freebsd') !== -1) {
    result = 'freebsd';
  }
  else if (distro.indexOf('opensuse') !== -1) {
    result = 'opensuse';
  }
  else if (distro.indexOf('pclinuxos') !== -1) {
    result = 'pclinuxos';
  }
  else if (distro.indexOf('puppy') !== -1) {
    result = 'puppy';
  }
  else if (distro.indexOf('popos') !== -1) {
    result = 'popos';
  }
  else if (distro.indexOf('raspbian') !== -1) {
    result = 'raspbian';
  }
  else if (distro.indexOf('reactos') !== -1) {
    result = 'reactos';
  }
  else if (distro.indexOf('redhat') !== -1) {
    result = 'redhat';
  }
  else if (distro.indexOf('slackware') !== -1) {
    result = 'slackware';
  }
  else if (distro.indexOf('sugar') !== -1) {
    result = 'sugar';
  }
  else if (distro.indexOf('steam') !== -1) {
    result = 'steam';
  }
  else if (distro.indexOf('suse') !== -1) {
    result = 'suse';
  }
  else if (distro.indexOf('mate') !== -1) {
    result = 'ubuntu-mate';
  }
  else if (distro.indexOf('lubuntu') !== -1) {
    result = 'lubuntu';
  }
  else if (distro.indexOf('xubuntu') !== -1) {
    result = 'xubuntu';
  }
  else if (distro.indexOf('ubuntu') !== -1) {
    result = 'ubuntu';
  }
  else if (distro.indexOf('solaris') !== -1) {
    result = 'solaris';
  }
  else if (distro.indexOf('tails') !== -1) {
    result = 'tails';
  }
  else if (distro.indexOf('feren') !== -1) {
    result = 'ferenos';
  }
  else if (distro.indexOf('robolinux') !== -1) {
    result = 'robolinux';
  } else if (_linux && distro) {
    result = distro.toLowerCase().trim().replace(/\s+/g, '-');
  }
  return result;
}

// --------------------------
// OS Information

function osInfo(options = {}, callback) {
  if (options.platform) setPlatform(options.platform);

  return new Promise((resolve) => {
    process.nextTick(() => {
      let result = {

        platform: (_platform === 'win32' ? 'Windows' : _platform),
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
        uefi: false
      };

      if (_linux) {

        exec('cat /etc/*-release; cat /usr/lib/os-release; cat /etc/openwrt_release', function (error, stdout) {
          /**
           * @namespace
           * @property {string}  DISTRIB_ID
           * @property {string}  NAME
           * @property {string}  DISTRIB_RELEASE
           * @property {string}  VERSION_ID
           * @property {string}  DISTRIB_CODENAME
           */
          let release = {};
          let lines = stdout.toString().split('\n');
          lines.forEach(function (line) {
            if (line.indexOf('=') !== -1) {
              release[line.split('=')[0].trim().toUpperCase()] = line.split('=')[1].trim();
            }
          });
          result.distro = (release.DISTRIB_ID || release.NAME || 'unknown').replace(/"/g, '');
          result.logofile = getLogoFile(options, result.distro);
          let releaseVersion = (release.VERSION || '').replace(/"/g, '');
          let codename = (release.DISTRIB_CODENAME || release.VERSION_CODENAME || '').replace(/"/g, '');
          const prettyName = (release.PRETTY_NAME || '').replace(/"/g, '');
          if (prettyName.indexOf(result.distro + ' ') === 0) {
            releaseVersion = prettyName.replace(result.distro + ' ', '').trim();
          }
          if (releaseVersion.indexOf('(') >= 0) {
            codename = releaseVersion.split('(')[1].replace(/[()]/g, '').trim();
            releaseVersion = releaseVersion.split('(')[0].trim();
          }
          result.release = (releaseVersion || release.DISTRIB_RELEASE || release.VERSION_ID || 'unknown').replace(/"/g, '');
          result.codename = codename;
          result.codepage = util.getCodepage();
          result.build = (release.BUILD_ID || '').replace(/"/g, '').trim();
          isUefiLinux().then(uefi => {
            result.uefi = uefi;
            uuid().then((data) => {
              result.serial = data.os;
              if (callback) {
                callback(result);
              }
              resolve(result);
            });
          });
        });
      }
      if (_freebsd || _openbsd || _netbsd) {

        exec('sysctl kern.ostype kern.osrelease kern.osrevision kern.hostuuid machdep.bootmethod kern.geom.confxml', function (error, stdout) {
          let lines = stdout.toString().split('\n');
          const distro = util.getValue(lines, 'kern.ostype');
          const logofile = getLogoFile(options, distro);
          const release = util.getValue(lines, 'kern.osrelease').split('-')[0];
          const serial = util.getValue(lines, 'kern.uuid');
          const bootmethod = util.getValue(lines, 'machdep.bootmethod');
          const uefiConf = stdout.toString().indexOf('<type>efi</type>') >= 0;
          const uefi = bootmethod ? bootmethod.toLowerCase().indexOf('uefi') >= 0 : (uefiConf ? uefiConf : null);
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
        });
      }
      if (_darwin) {
        exec('sw_vers; sysctl kern.ostype kern.osrelease kern.osrevision kern.uuid', function (error, stdout) {
          let lines = stdout.toString().split('\n');
          result.serial = util.getValue(lines, 'kern.uuid');
          result.distro = util.getValue(lines, 'ProductName');
          result.release = (util.getValue(lines, 'ProductVersion', ':', true, true) + ' ' + util.getValue(lines, 'ProductVersionExtra', ':', true, true)).trim();
          result.build = util.getValue(lines, 'BuildVersion');
          result.logofile = getLogoFile(options, result.distro);
          result.codename = 'macOS';
          result.codename = (result.release.indexOf('10.4') > -1 ? 'OS X Tiger' : result.codename);
          result.codename = (result.release.indexOf('10.5') > -1 ? 'OS X Leopard' : result.codename);
          result.codename = (result.release.indexOf('10.6') > -1 ? 'OS X Snow Leopard' : result.codename);
          result.codename = (result.release.indexOf('10.7') > -1 ? 'OS X Lion' : result.codename);
          result.codename = (result.release.indexOf('10.8') > -1 ? 'OS X Mountain Lion' : result.codename);
          result.codename = (result.release.indexOf('10.9') > -1 ? 'OS X Mavericks' : result.codename);
          result.codename = (result.release.indexOf('10.10') > -1 ? 'OS X Yosemite' : result.codename);
          result.codename = (result.release.indexOf('10.11') > -1 ? 'OS X El Capitan' : result.codename);
          result.codename = (result.release.indexOf('10.12') > -1 ? 'Sierra' : result.codename);
          result.codename = (result.release.indexOf('10.13') > -1 ? 'High Sierra' : result.codename);
          result.codename = (result.release.indexOf('10.14') > -1 ? 'Mojave' : result.codename);
          result.codename = (result.release.indexOf('10.15') > -1 ? 'Catalina' : result.codename);
          result.codename = (result.release.startsWith('11.') ? 'Big Sur' : result.codename);
          result.codename = (result.release.startsWith('12.') ? 'Monterey' : result.codename);
          result.codename = (result.release.startsWith('13.') ? 'Ventura' : result.codename);
          result.codename = (result.release.startsWith('14.') ? 'Sonoma' : result.codename);
          result.codename = (result.release.startsWith('15.') ? 'Sequoia' : result.codename);
          result.uefi = true;
          result.codepage = util.getCodepage();
          if (callback) {
            callback(result);
          }
          resolve(result);
        });
      }
      if (_sunos) {
        result.release = result.kernel;
        exec('uname -o', function (error, stdout) {
          let lines = stdout.toString().split('\n');
          result.distro = lines[0];
          result.logofile = getLogoFile(options, result.distro);
          if (callback) { callback(result); }
          resolve(result);
        });
      }
      if (_windows) {
        result.logofile = getLogoFile(options);
        result.release = result.kernel;
        try {
          const workload = [];
          workload.push(util.powerShell('Get-CimInstance Win32_OperatingSystem | select Caption,SerialNumber,BuildNumber,ServicePackMajorVersion,ServicePackMinorVersion | fl', options));
          workload.push(util.powerShell('(Get-CimInstance Win32_ComputerSystem).HypervisorPresent', options));
          workload.push(util.powerShell('Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SystemInformation]::TerminalServerSession', options));
          util.promiseAll(
            workload
          ).then((data) => {
            let lines = data.results[0] ? data.results[0].toString().split('\r\n') : [''];
            result.distro = util.getValue(lines, 'Caption', ':').trim();
            result.serial = util.getValue(lines, 'SerialNumber', ':').trim();
            result.build = util.getValue(lines, 'BuildNumber', ':').trim();
            result.servicepack = util.getValue(lines, 'ServicePackMajorVersion', ':').trim() + '.' + util.getValue(lines, 'ServicePackMinorVersion', ':').trim();
            result.codepage = util.getCodepage(options);
            const hyperv = data.results[1] ? data.results[1].toString().toLowerCase() : '';
            result.hypervisor = hyperv.indexOf('true') !== -1;
            const term = data.results[2] ? data.results[2].toString() : '';
            result.remoteSession = (term.toString().toLowerCase().indexOf('true') >= 0);
            isUefiWindows().then(uefi => {
              result.uefi = uefi;
              if (callback) {
                callback(result);
              }
              resolve(result);
            });
          });
        } catch (e) {
          if (callback) { callback(result); }
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
        } else {
          exec('dmesg | grep -E "EFI v"', function (error, stdout) {
            if (!error) {
              const lines = stdout.toString().split('\n');
              return resolve(lines.length > 0);
            }
            return resolve(false);
          });
        }
      });
    });
  });
}

function isUefiWindows() {
  return new Promise((resolve) => {
    process.nextTick(() => {
      try {
        exec('findstr /C:"Detected boot environment" "%windir%\\Panther\\setupact.log"', util.execOptsWin, function (error, stdout) {
          if (!error) {
            const line = stdout.toString().split('\n\r')[0];
            return resolve(line.toLowerCase().indexOf('efi') >= 0);
          } else {
            exec('echo %firmware_type%', util.execOptsWin, function (error, stdout) {
              if (!error) {
                const line = stdout.toString() || '';
                return resolve(line.toLowerCase().indexOf('efi') >= 0);
              } else {
                return resolve(false);
              }
            });
          }
        });
      } catch (e) {
        return resolve(false);
      }
    });
  });
}

function versions(options = {}, apps, callback) {
  if (options.platform) setPlatform(options.platform);
  
  return new Promise((resolve) => {
    process.nextTick(() => {
      let apps = [];

      if (_windows) {
        try {
          // First, get all software versions from registry using pagination
          // Fetch applications in batches of 100 until we get less than 100 results
          let allApps = [];
          const batchSize = 100;
          
          const fetchBatch = (skip) => {
            const powershellScript = `Get-ItemProperty -Path "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*", "HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*", "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*" | Where-Object { $_.DisplayName } | ForEach-Object { [PSCustomObject]@{ Name = $_.DisplayName; Version = $_.DisplayVersion; Publisher = $_.Publisher; InstallDate = $_.InstallDate; InstallSource = $_.InstallSource; UninstallString = $_.UninstallString; InstallLocation = $_.InstallLocation; EstimatedSizeMB = if ($_.EstimatedSize) { [math]::Round($_.EstimatedSize / 1024, 2) } else { $null } } } | Sort-Object Name | Select-Object -Skip ${skip} -First ${batchSize} | ConvertTo-Json -Depth 3 -Compress`;

            return util.powerShell(powershellScript, options).then(stdout => {
              try {
                const batchApps = JSON.parse(stdout);
                // Check if we got an array or a single object
                const appsArray = Array.isArray(batchApps) ? batchApps : (batchApps ? [batchApps] : []);
                
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
              } catch (e) {
                console.log('Error parsing PowerShell output:', e);
                return apps;
              }
            }).catch(e => {
              console.log('Error executing PowerShell command:', e);
              return apps;
            });
          };
          
          // Start fetching batches from index 0
          fetchBatch(0).then(versions => {
            if (callback) { callback(versions); }
            resolve(versions);
          });
        } catch (e) {
          if (callback) { callback(apps); }
          resolve(apps);
        }
      }
    });
  });
}

exports.versions = versions;

function shell(options = {}, callback) {
  if (options.platform) setPlatform(options.platform);

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
      const interfacesCmd = 'Get-NetAdapter | Select-Object -Property Name, InterfaceDescription, Status, MacAddress | Format-List';
      const interfacesResult = await util.powerShell(interfacesCmd, options);
      
      // Parse interfaces information
      const interfaceSections = interfacesResult.toString().split(/\r?\n\s*\r?\n/).filter(section => section.trim());
      
      interfaceSections.forEach(section => {
        const lines = section.split(/\r?\n/).filter(line => line.trim());
        let macAddress = '';
        
        lines.forEach(line => {
          const parts = line.split(':');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();
            
            if (key === 'MacAddress') {
              macAddress = value.toLowerCase();
              if (macAddress && macAddress !== '00:00:00:00:00:00' && macs.indexOf(macAddress) === -1) {
                macs.push(macAddress);
              }
            }
          }
        });
      });
    } catch (e) {
      console.log('Error getting MAC addresses via PowerShell:', e);
    }
  }
  
  // Sort MAC addresses
  macs = macs.sort(function (a, b) {
    if (a < b) { return -1; }
    if (a > b) { return 1; }
    return 0;
  });
  
  return macs;
}

function uuid(options = {}, callback) {
  if (options.platform) setPlatform(options.platform);

  return new Promise((resolve) => {
    process.nextTick(async () => {

      let result = {
        os: '',
        hardware: '',
        macs: []
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
            } catch (e) {
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
            const lines = fs.readFileSync('/proc/cpuinfo', { encoding: 'utf8' }).toString().split('\n');
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
          if (result.os.indexOf('unknown') >= 0) { result.os = ''; }
          if (result.hardware.indexOf('unknown') >= 0) { result.hardware = ''; }
          if (callback) {
            callback(result);
          }
          resolve(result);
        });
      }
      if (_windows) {
        result.macs = await getUniqueMacAdresses(options);
        let sysdir = '%windir%\\System32';
        if (process.arch === 'ia32' && Object.prototype.hasOwnProperty.call(process.env, 'PROCESSOR_ARCHITEW6432')) {
          sysdir = '%windir%\\sysnative\\cmd.exe /c %windir%\\System32';
        }
        util.powerShell('Get-CimInstance Win32_ComputerSystemProduct | select UUID | fl', options).then((stdout) => {
          let lines = stdout.split('\r\n');
          result.hardware = util.getValue(lines, 'uuid', ':').toLowerCase();
          util.powerShell(`${sysdir}\\reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid`, options).then((stdout) => {
            parts = stdout.toString().split('\n\r')[0].split('REG_SZ');
            result.os = parts.length > 1 ? parts[1].replace(/\r+|\n+|\s+/ig, '').toLowerCase() : '';
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
