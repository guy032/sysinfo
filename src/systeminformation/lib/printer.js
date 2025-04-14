'use strict';
// @ts-check
// ==================================================================================
// printers.js
// ----------------------------------------------------------------------------------
// Description:   System Information - library
//                for Node.js
// Copyright:     (c) 2014 - 2025
// Author:        Sebastian Hildebrandt
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 15. printers
// ----------------------------------------------------------------------------------

const exec = require('child_process').exec;
const util = require('./util');

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

const winPrinterStatus = {
  1: 'Other',
  2: 'Unknown',
  3: 'Idle',
  4: 'Printing',
  5: 'Warmup',
  6: 'Stopped Printing',
  7: 'Offline',
};

function parseLinuxCupsHeader(lines) {
  const result = {};
  if (lines && lines.length) {
    if (lines[0].indexOf(' CUPS v') > 0) {
      const parts = lines[0].split(' CUPS v');
      result.cupsVersion = parts[1];
    }
  }
  return result;
}

function parseLinuxCupsPrinter(lines) {
  const result = {};
  const printerId = util.getValue(lines, 'PrinterId', ' ');
  result.id = printerId ? parseInt(printerId, 10) : null;
  result.name = util.getValue(lines, 'Info', ' ');
  result.model = lines.length > 0 && lines[0] ? lines[0].split(' ')[0] : '';
  result.uri = util.getValue(lines, 'DeviceURI', ' ');
  result.uuid = util.getValue(lines, 'UUID', ' ');
  result.status = util.getValue(lines, 'State', ' ');
  result.local = util.getValue(lines, 'Location', ' ').toLowerCase().startsWith('local');
  result.default = null;
  result.shared = util.getValue(lines, 'Shared', ' ').toLowerCase().startsWith('yes');

  return result;
}

function parseLinuxLpstatPrinter(lines, id) {
  const result = {};
  result.id = id;
  result.name = util.getValue(lines, 'Description', ':', true);
  result.model = lines.length > 0 && lines[0] ? lines[0].split(' ')[0] : '';
  result.uri = null;
  result.uuid = null;
  result.status = lines.length > 0 && lines[0] ? (lines[0].indexOf(' idle') > 0 ? 'idle' : (lines[0].indexOf(' printing') > 0 ? 'printing' : 'unknown')) : null;
  result.local = util.getValue(lines, 'Location', ':', true).toLowerCase().startsWith('local');
  result.default = null;
  result.shared = util.getValue(lines, 'Shared', ' ').toLowerCase().startsWith('yes');

  return result;
}

function parseDarwinPrinters(printerObject, id) {
  const result = {};
  const uriParts = printerObject.uri.split('/');
  result.id = id;
  result.name = printerObject._name;
  result.model = uriParts.length ? uriParts[uriParts.length - 1] : '';
  result.uri = printerObject.uri;
  result.uuid = null;
  result.status = printerObject.status;
  result.local = printerObject.printserver === 'local';
  result.default = printerObject.default === 'yes';
  result.shared = printerObject.shared === 'yes';

  return result;
}

function parseWindowsPrinters(lines, id) {
  const result = {};
  const status = parseInt(util.getValue(lines, 'PrinterStatus', ':'), 10);

  result.id = id;
  result.name = util.getValue(lines, 'name', ':');
  result.model = util.getValue(lines, 'Model', ':') || util.getValue(lines, 'DriverName', ':');
  result.uri = util.getValue(lines, 'PortName', ':');
  result.uuid = util.getValue(lines, 'UUID', ':') || null;
  result.status = winPrinterStatus[status] ? winPrinterStatus[status] : null;
  result.local = util.getValue(lines, 'Local', ':').toUpperCase() === 'TRUE';
  result.default = util.getValue(lines, 'Default', ':').toUpperCase() === 'TRUE';
  result.shared = util.getValue(lines, 'Shared', ':').toUpperCase() === 'TRUE';
  result.location = util.getValue(lines, 'Location', ':');
  result.ipAddress = util.getValue(lines, 'IPAddress', ':');
  result.driverName = util.getValue(lines, 'DriverName', ':');
  result.portHostAddress = util.getValue(lines, 'HostAddress', ':');
  result.portDescription = util.getValue(lines, 'Description', ':');

  return result;
}

function printer(options = {}, callback) {
  if (options.platform) setPlatform(options.platform);

  return new Promise((resolve) => {
    process.nextTick(() => {
      let result = [];
      if (_linux || _freebsd || _openbsd || _netbsd) {
        let cmd = 'cat /etc/cups/printers.conf 2>/dev/null';
        exec(cmd, function (error, stdout) {
          // printers.conf
          if (!error) {
            const parts = stdout.toString().split('<Printer ');
            const printerHeader = parseLinuxCupsHeader(parts[0]);
            for (let i = 1; i < parts.length; i++) {
              const printers = parseLinuxCupsPrinter(parts[i].split('\n'));
              if (printers.name) {
                printers.engine = 'CUPS';
                printers.engineVersion = printerHeader.cupsVersion;
                result.push(printers);
              }
            }
          }
          if (result.length === 0) {
            if (_linux) {
              cmd = 'export LC_ALL=C; lpstat -lp 2>/dev/null; unset LC_ALL';
              // lpstat
              exec(cmd, function (error, stdout) {
                const parts = ('\n' + stdout.toString()).split('\nprinter ');
                for (let i = 1; i < parts.length; i++) {
                  const printers = parseLinuxLpstatPrinter(parts[i].split('\n'), i);
                  result.push(printers);
                }
              });
              if (callback) {
                callback(result);
              }
              resolve(result);
            } else {
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
      }
      if (_darwin) {
        let cmd = 'system_profiler SPPrintersDataType -json';
        exec(cmd, function (error, stdout) {
          if (!error) {
            try {
              const outObj = JSON.parse(stdout.toString());
              if (outObj.SPPrintersDataType && outObj.SPPrintersDataType.length) {
                for (let i = 0; i < outObj.SPPrintersDataType.length; i++) {
                  const printer = parseDarwinPrinters(outObj.SPPrintersDataType[i], i);
                  result.push(printer);
                }
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
      if (_windows) {
        // Enhanced PowerShell command to get more printer details - single line version
        const psScript = `Get-CimInstance Win32_Printer | ForEach-Object { $p = $_; $portName = $p.PortName; $ip = $null; $loc = $p.Location; $model = $p.Caption; if ($loc -match 'http://([0-9.]+)') { $ip = $matches[1]; }; if (-not $ip -and ($portName -match '^(IP|TCP)' -or $portName -match '^WSD-')) { $pp = Get-CimInstance Win32_TCPIPPrinterPort -Filter "Name='$portName'"; if ($pp -and $pp.HostAddress) { $ip = $pp.HostAddress; } }; $driverName = $p.DriverName; $drv = $null; if ($driverName) { $drv = Get-CimInstance Win32_PrinterDriver | Where-Object { $_.Name -match [regex]::Escape($driverName) } | Select-Object -First 1 }; [PSCustomObject]@{ PrinterStatus=$p.PrinterStatus; Name=$p.Name; DriverName=$p.DriverName; Model=$model; Local=$p.Local; Default=$p.Default; Shared=$p.Shared; PortName=$portName; Location=$loc; IPAddress=$ip } } | ConvertTo-Json -Depth 3 -Compress`;
        
        // Get detailed port information
        const portScript = `Get-CimInstance Win32_TCPIPPrinterPort | ForEach-Object { [PSCustomObject]@{ Name=$_.Name; Protocol=$_.Protocol; HostAddress=$_.HostAddress; PortMonitor=$_.PortMonitor; Description=$_.Description; SNMPEnabled=$_.SNMPEnabled; LPREnabled=$_.LPREnabled } } | ConvertTo-Json -Depth 1 -Compress`;
        
        // First get printer information
        util.powerShell(psScript, options).then((stdout, error) => {
          if (!error) {
            try {
              let printers = JSON.parse(stdout.toString());
              // Ensure printers is an array
              if (!Array.isArray(printers)) {
                printers = printers ? [printers] : [];
              }
              
              // Now get port information
              util.powerShell(portScript, options).then((portStdout, portError) => {
                // Create a map of port details by port name
                const portMap = {};
                if (!portError) {
                  try {
                    let ports = JSON.parse(portStdout.toString());
                    if (!Array.isArray(ports)) {
                      ports = ports ? [ports] : [];
                    }
                    
                    ports.forEach(port => {
                      if (port.Name) {
                        portMap[port.Name] = port;
                      }
                    });
                  } catch (e) {
                    console.log('Error parsing port data:', e);
                  }
                }
                
                // Process printer information combined with port details
                printers.forEach((printerObj, i) => {
                  // Add port details to printer object if available
                  if (printerObj.PortName && portMap[printerObj.PortName]) {
                    const portDetails = portMap[printerObj.PortName];
                    printerObj = { ...printerObj, ...portDetails };
                    
                    // If IP address wasn't found earlier, get it from port details
                    if (!printerObj.IPAddress && portDetails.HostAddress) {
                      printerObj.IPAddress = portDetails.HostAddress;
                    }
                  }
                  
                  // Convert printer object to lines format for parser
                  const printerLines = [];
                  for (const key in printerObj) {
                    const value = printerObj[key] !== null ? printerObj[key].toString() : '';
                    printerLines.push(`${key} : ${value}`);
                  }
                  
                  const printer = parseWindowsPrinters(printerLines, i);
                  if (printer.name || printer.model) {
                    result.push(printer);
                  }
                });
                
                if (callback) {
                  callback(result);
                }
                resolve(result);
                
              }).catch(e => {
                console.log('Error fetching port information:', e);
                
                // Continue with just printer information if port info fails
                processPrinters(printers);
              });
              
              // Helper function to process printers without port information
              function processPrinters(printers) {
                printers.forEach((printerObj, i) => {
                  const printerLines = [];
                  for (const key in printerObj) {
                    const value = printerObj[key] !== null ? printerObj[key].toString() : '';
                    printerLines.push(`${key} : ${value}`);
                  }
                  
                  const printer = parseWindowsPrinters(printerLines, i);
                  if (printer.name || printer.model) {
                    result.push(printer);
                  }
                });
                
                if (callback) {
                  callback(result);
                }
                resolve(result);
              }
              
            } catch (e) {
              console.log('Error parsing printer data:', e);
              console.log(stdout);
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
      }
      if (_sunos) {
        resolve(null);
      }
    });
  });
}

exports.printer = printer;
