// ==================================================================================
// printer.ts
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

import { exec } from 'child_process';

import * as util from '../util';
import { getPlatformFlagsFromOptions } from '../util/platform';

interface IPrinter {
  id: number | null;
  name: string | null;
  model: string | null;
  uri: string | null;
  uuid: string | null;
  status: string | null;
  local: boolean;
  default: boolean | null;
  shared: boolean;
  location?: string | null;
  ipAddress?: string | null;
  driverName?: string | null;
  portHostAddress?: string | null;
  portDescription?: string | null;
  engine?: string;
  engineVersion?: string;
}

interface IPrinterOptions {
  platform?: string;
  [key: string]: any;
}

type PrinterCallback = (data: IPrinter[]) => void;

// Windows printer status codes
const winPrinterStatus: Record<number, string> = {
  1: 'Other',
  2: 'Unknown',
  3: 'Idle',
  4: 'Printing',
  5: 'Warmup',
  6: 'Stopped Printing',
  7: 'Offline',
};

function parseLinuxCupsHeader(lines: string[]): { cupsVersion?: string } {
  const result: { cupsVersion?: string } = {};

  if (lines && lines.length > 0 && lines[0].indexOf(' CUPS v') > 0) {
    const parts = lines[0].split(' CUPS v');
    result.cupsVersion = parts[1];
  }

  return result;
}

function parseLinuxCupsPrinter(lines: string[]): IPrinter {
  const printerId = util.getValue(lines, 'PrinterId', ' ');

  return {
    id: printerId ? Number.parseInt(printerId, 10) : null,
    name: util.getValue(lines, 'Info', ' '),
    model: lines.length > 0 && lines[0] ? lines[0].split(' ')[0] : '',
    uri: util.getValue(lines, 'DeviceURI', ' '),
    uuid: util.getValue(lines, 'UUID', ' '),
    status: util.getValue(lines, 'State', ' '),
    local: util.getValue(lines, 'Location', ' ').toLowerCase().startsWith('local'),
    default: null,
    shared: util.getValue(lines, 'Shared', ' ').toLowerCase().startsWith('yes'),
  };
}

function getStatusFromLine(lines: string[]): string | null {
  if (lines.length === 0 || !lines[0]) {
    return null;
  }

  if (lines[0].indexOf(' idle') > 0) {
    return 'idle';
  }

  if (lines[0].indexOf(' printing') > 0) {
    return 'printing';
  }

  return 'unknown';
}

function parseLinuxLpstatPrinter(lines: string[], id: number): IPrinter {
  return {
    id,
    name: util.getValue(lines, 'Description', ':', true),
    model: lines.length > 0 && lines[0] ? lines[0].split(' ')[0] : '',
    uri: null,
    uuid: null,
    status: getStatusFromLine(lines),
    local: util.getValue(lines, 'Location', ':', true).toLowerCase().startsWith('local'),
    default: null,
    shared: util.getValue(lines, 'Shared', ' ').toLowerCase().startsWith('yes'),
  };
}

interface IDarwinPrinterObject {
  _name: string;
  uri: string;
  status: string;
  printserver: string;
  default: string;
  shared: string;
  [key: string]: any;
}

function parseDarwinPrinters(printerObject: IDarwinPrinterObject, id: number): IPrinter {
  const uriParts = printerObject.uri.split('/');

  return {
    id,
    name: printerObject._name,
    model: uriParts.length > 0 ? uriParts.at(-1) || '' : '',
    uri: printerObject.uri,
    uuid: null,
    status: printerObject.status,
    local: printerObject.printserver === 'local',
    default: printerObject.default === 'yes',
    shared: printerObject.shared === 'yes',
  };
}

function parseWindowsPrinters(lines: string[], id: number): IPrinter {
  const status = Number.parseInt(util.getValue(lines, 'PrinterStatus', ':'), 10);

  return {
    id,
    name: util.getValue(lines, 'name', ':'),
    model: util.getValue(lines, 'Model', ':') || util.getValue(lines, 'DriverName', ':'),
    uri: util.getValue(lines, 'PortName', ':'),
    uuid: util.getValue(lines, 'UUID', ':') || null,
    status: winPrinterStatus[status] || null,
    local: util.getValue(lines, 'Local', ':').toUpperCase() === 'TRUE',
    default: util.getValue(lines, 'Default', ':').toUpperCase() === 'TRUE',
    shared: util.getValue(lines, 'Shared', ':').toUpperCase() === 'TRUE',
    location: util.getValue(lines, 'Location', ':'),
    ipAddress: util.getValue(lines, 'IPAddress', ':'),
    driverName: util.getValue(lines, 'DriverName', ':'),
    portHostAddress: util.getValue(lines, 'HostAddress', ':'),
    portDescription: util.getValue(lines, 'Description', ':'),
  };
}

// Process printers without port information
function processPrinters(
  printers: any[],
  result: IPrinter[],
  callback?: PrinterCallback,
  resolve?: (value: IPrinter[]) => void,
): void {
  for (const [i, printerObj] of printers.entries()) {
    const printerLines: string[] = [];

    for (const key in printerObj) {
      if (Object.prototype.hasOwnProperty.call(printerObj, key)) {
        const value = printerObj[key] == null ? '' : printerObj[key].toString();
        printerLines.push(`${key} : ${value}`);
      }
    }

    const printer = parseWindowsPrinters(printerLines, i);

    if (printer.name || printer.model) {
      result.push(printer);
    }
  }

  if (callback) {
    callback(result);
  }

  if (resolve) {
    resolve(result);
  }
}

function printer(options: IPrinterOptions = {}, callback?: PrinterCallback): Promise<IPrinter[]> {
  const platformFlags = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(() => {
      const result: IPrinter[] = [];

      if (
        platformFlags._linux ||
        platformFlags._freebsd ||
        platformFlags._openbsd ||
        platformFlags._netbsd
      ) {
        const cmd = 'cat /etc/cups/printers.conf 2>/dev/null';

        exec(cmd, (error, stdout) => {
          // printers.conf
          if (!error) {
            const parts = stdout.toString().split('<Printer ');
            const printerHeader = parseLinuxCupsHeader(parts[0].split('\n'));

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
            if (platformFlags._linux) {
              const linuxCmd = 'export LC_ALL=C; lpstat -lp 2>/dev/null; unset LC_ALL';

              // lpstat
              exec(linuxCmd, (error, stdout) => {
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

      if (platformFlags._darwin) {
        const cmd = 'system_profiler SPPrintersDataType -json';

        exec(cmd, (error, stdout) => {
          if (!error) {
            try {
              interface DarwinPrinterResult {
                SPPrintersDataType?: IDarwinPrinterObject[];
              }

              const outObj = JSON.parse(stdout.toString()) as DarwinPrinterResult;

              if (outObj.SPPrintersDataType && outObj.SPPrintersDataType.length > 0) {
                for (let i = 0; i < outObj.SPPrintersDataType.length; i++) {
                  const printer = parseDarwinPrinters(outObj.SPPrintersDataType[i], i);
                  result.push(printer);
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
      }

      if (platformFlags._windows) {
        // Enhanced PowerShell command to get more printer details - single line version
        const psScript = `Get-CimInstance Win32_Printer | ForEach-Object { $p = $_; $portName = $p.PortName; $ip = $null; $loc = $p.Location; $model = $p.Caption; if ($loc -match 'http://([0-9.]+)') { $ip = $matches[1]; }; if (-not $ip -and ($portName -match '^(IP|TCP)' -or $portName -match '^WSD-')) { $pp = Get-CimInstance Win32_TCPIPPrinterPort -Filter "Name='$portName'"; if ($pp -and $pp.HostAddress) { $ip = $pp.HostAddress; } }; $driverName = $p.DriverName; $drv = $null; if ($driverName) { $drv = Get-CimInstance Win32_PrinterDriver | Where-Object { $_.Name -match [regex]::Escape($driverName) } | Select-Object -First 1 }; [PSCustomObject]@{ PrinterStatus=$p.PrinterStatus; Name=$p.Name; DriverName=$p.DriverName; Model=$model; Local=$p.Local; Default=$p.Default; Shared=$p.Shared; PortName=$portName; Location=$loc; IPAddress=$ip } } | ConvertTo-Json -Depth 3 -Compress`;

        // Get detailed port information
        const portScript = `Get-CimInstance Win32_TCPIPPrinterPort | ForEach-Object { [PSCustomObject]@{ Name=$_.Name; Protocol=$_.Protocol; HostAddress=$_.HostAddress; PortMonitor=$_.PortMonitor; Description=$_.Description; SNMPEnabled=$_.SNMPEnabled; LPREnabled=$_.LPREnabled } } | ConvertTo-Json -Depth 1 -Compress`;

        // First get printer information
        util.powerShell(psScript, options).then((stdout) => {
          if (stdout) {
            try {
              let printers = JSON.parse(stdout.toString());

              // Ensure printers is an array
              if (!Array.isArray(printers)) {
                printers = printers ? [printers] : [];
              }

              // Now get port information
              util
                .powerShell(portScript, options)
                .then((portStdout) => {
                  // Create a map of port details by port name
                  const portMap: Record<string, any> = {};

                  if (portStdout) {
                    try {
                      let ports = JSON.parse(portStdout.toString());

                      if (!Array.isArray(ports)) {
                        ports = ports ? [ports] : [];
                      }

                      for (const port of ports) {
                        if (port.Name) {
                          portMap[port.Name] = port;
                        }
                      }
                    } catch (error) {
                      console.error('Error parsing port data:', error);
                    }
                  }

                  // Process printer information combined with port details
                  for (const [i, printerObj] of printers.entries()) {
                    // Add port details to printer object if available
                    if (printerObj.PortName && portMap[printerObj.PortName]) {
                      const portDetails = portMap[printerObj.PortName];
                      Object.assign(printerObj, portDetails);

                      // If IP address wasn't found earlier, get it from port details
                      if (!printerObj.IPAddress && portDetails.HostAddress) {
                        printerObj.IPAddress = portDetails.HostAddress;
                      }
                    }

                    // Convert printer object to lines format for parser
                    const printerLines: string[] = [];

                    for (const key in printerObj) {
                      if (Object.prototype.hasOwnProperty.call(printerObj, key)) {
                        const value = printerObj[key] == null ? '' : printerObj[key].toString();
                        printerLines.push(`${key} : ${value}`);
                      }
                    }

                    const printer = parseWindowsPrinters(printerLines, i);

                    if (printer.name || printer.model) {
                      result.push(printer);
                    }
                  }

                  if (callback) {
                    callback(result);
                  }

                  resolve(result);
                })
                .catch((error) => {
                  console.error('Error fetching port information:', error);

                  // Continue with just printer information if port info fails
                  processPrinters(printers, result, callback, resolve);
                });
            } catch (error) {
              console.error('Error parsing printer data:', error);
              console.error(stdout);

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

      if (platformFlags._sunos) {
        resolve(result);
      }
    });
  });
}

export { IPrinter, IPrinterOptions, printer };
