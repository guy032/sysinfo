import { exec } from 'child_process';
import fs from 'fs';

import * as util from '../../util';
import { getPlatformFlagsFromOptions } from '../../util/platform';
import { networkInterfaces } from './network-interfaces';

// Define interface for performance data items
interface PerfDataItem {
  name: string;
  rx_bytes: number;
  rx_errors: number;
  rx_dropped: number;
  tx_bytes: number;
  tx_errors: number;
  tx_dropped: number;
}

const _network: Record<
  string,
  {
    rx_bytes?: number;
    tx_bytes?: number;
    rx_sec?: number | null;
    tx_sec?: number | null;
    ms?: number;
    last_ms?: number;
    operstate?: string;
  }
> = {};

function calcNetworkSpeed(
  iface,
  rx_bytes,
  tx_bytes,
  operstate,
  rx_dropped,
  rx_errors,
  tx_dropped,
  tx_errors,
) {
  const result = {
    iface,
    operstate,
    rx_bytes,
    rx_dropped,
    rx_errors,
    tx_bytes,
    tx_dropped,
    tx_errors,
    rx_sec: null as number | null,
    tx_sec: null as number | null,
    ms: 0,
  };

  if (_network[iface] && _network[iface].ms) {
    const cachedNetwork = _network[iface];
    result.ms = Date.now() - cachedNetwork.ms!;
    result.rx_sec =
      rx_bytes - cachedNetwork.rx_bytes! >= 0
        ? (rx_bytes - cachedNetwork.rx_bytes!) / (result.ms / 1000)
        : 0;
    result.tx_sec =
      tx_bytes - cachedNetwork.tx_bytes! >= 0
        ? (tx_bytes - cachedNetwork.tx_bytes!) / (result.ms / 1000)
        : 0;
    _network[iface].rx_bytes = rx_bytes;
    _network[iface].tx_bytes = tx_bytes;
    _network[iface].rx_sec = result.rx_sec;
    _network[iface].tx_sec = result.tx_sec;
    _network[iface].ms = Date.now();
    _network[iface].last_ms = result.ms;
    _network[iface].operstate = operstate;
  } else {
    if (!_network[iface]) {
      _network[iface] = {};
    }

    _network[iface].rx_bytes = rx_bytes;
    _network[iface].tx_bytes = tx_bytes;
    _network[iface].rx_sec = null;
    _network[iface].tx_sec = null;
    _network[iface].ms = Date.now();
    _network[iface].last_ms = 0;
    _network[iface].operstate = operstate;
  }

  return result;
}

function parseLinesWindowsPerfData(sections): PerfDataItem[] {
  const perfData: PerfDataItem[] = [];

  for (const i in sections) {
    if (Object.prototype.hasOwnProperty.call(sections, i) && sections[i].trim() !== '') {
      const lines = sections[i].trim().split('\r\n');
      perfData.push({
        name: util
          .getValue(lines, 'Name', ':')
          .replaceAll(/[ ()[\]]+/g, '')
          .replaceAll(/#|\//g, '_')
          .toLowerCase(),
        rx_bytes: Number.parseInt(util.getValue(lines, 'BytesReceivedPersec', ':'), 10),
        rx_errors: Number.parseInt(util.getValue(lines, 'PacketsReceivedErrors', ':'), 10),
        rx_dropped: Number.parseInt(util.getValue(lines, 'PacketsReceivedDiscarded', ':'), 10),
        tx_bytes: Number.parseInt(util.getValue(lines, 'BytesSentPersec', ':'), 10),
        tx_errors: Number.parseInt(util.getValue(lines, 'PacketsOutboundErrors', ':'), 10),
        tx_dropped: Number.parseInt(util.getValue(lines, 'PacketsOutboundDiscarded', ':'), 10),
      });
    }
  }

  return perfData;
}

function networkStatsSingle(options, iface) {
  const platform = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(() => {
      let ifaceSanitized = '';
      const s = util.isPrototypePolluted() ? '---' : util.sanitizeShellString(iface);
      const l = util.mathMin(s.length, 2000);

      for (let i = 0; i <= l; i++) {
        if (s[i] !== undefined) {
          ifaceSanitized = ifaceSanitized + s[i];
        }
      }

      let result = {
        iface: ifaceSanitized,
        operstate: 'unknown',
        rx_bytes: 0,
        rx_dropped: 0,
        rx_errors: 0,
        tx_bytes: 0,
        tx_dropped: 0,
        tx_errors: 0,
        rx_sec: null as number | null,
        tx_sec: null as number | null,
        ms: 0,
      };

      let operstate = 'unknown';
      let rx_bytes = 0;
      let tx_bytes = 0;
      let rx_dropped = 0;
      let rx_errors = 0;
      let tx_dropped = 0;
      let tx_errors = 0;

      let cmd, lines, stats;

      if (
        !_network[ifaceSanitized] ||
        (_network[ifaceSanitized] && !_network[ifaceSanitized].ms) ||
        (_network[ifaceSanitized] &&
          _network[ifaceSanitized].ms &&
          Date.now() - _network[ifaceSanitized].ms! >= 500)
      ) {
        if (platform._linux) {
          if (fs.existsSync('/sys/class/net/' + ifaceSanitized)) {
            cmd =
              'cat /sys/class/net/' +
              ifaceSanitized +
              '/operstate; ' +
              'cat /sys/class/net/' +
              ifaceSanitized +
              '/statistics/rx_bytes; ' +
              'cat /sys/class/net/' +
              ifaceSanitized +
              '/statistics/tx_bytes; ' +
              'cat /sys/class/net/' +
              ifaceSanitized +
              '/statistics/rx_dropped; ' +
              'cat /sys/class/net/' +
              ifaceSanitized +
              '/statistics/rx_errors; ' +
              'cat /sys/class/net/' +
              ifaceSanitized +
              '/statistics/tx_dropped; ' +
              'cat /sys/class/net/' +
              ifaceSanitized +
              '/statistics/tx_errors; ';
            exec(cmd, function (error, stdout) {
              if (!error) {
                lines = stdout.toString().split('\n');
                operstate = lines[0].trim();
                rx_bytes = Number.parseInt(lines[1], 10);
                tx_bytes = Number.parseInt(lines[2], 10);
                rx_dropped = Number.parseInt(lines[3], 10);
                rx_errors = Number.parseInt(lines[4], 10);
                tx_dropped = Number.parseInt(lines[5], 10);
                tx_errors = Number.parseInt(lines[6], 10);

                result = calcNetworkSpeed(
                  ifaceSanitized,
                  rx_bytes,
                  tx_bytes,
                  operstate,
                  rx_dropped,
                  rx_errors,
                  tx_dropped,
                  tx_errors,
                );
              }

              resolve(result);
            });
          } else {
            resolve(result);
          }
        }

        if (platform._freebsd || platform._openbsd || platform._netbsd) {
          cmd = 'netstat -ibndI ' + ifaceSanitized; // lgtm [js/shell-command-constructed-from-input]
          exec(cmd, function (error, stdout) {
            if (!error) {
              lines = stdout.toString().split('\n');

              for (let i = 1; i < lines.length; i++) {
                const line = lines[i].replaceAll(/ +/g, ' ').split(' ');

                if (line && line[0] && line[7] && line[10]) {
                  rx_bytes = rx_bytes + Number.parseInt(line[7], 10);

                  if (line[6].trim() !== '-') {
                    rx_dropped = rx_dropped + Number.parseInt(line[6], 10);
                  }

                  if (line[5].trim() !== '-') {
                    rx_errors = rx_errors + Number.parseInt(line[5], 10);
                  }

                  tx_bytes = tx_bytes + Number.parseInt(line[10], 10);

                  if (line[12].trim() !== '-') {
                    tx_dropped = tx_dropped + Number.parseInt(line[12], 10);
                  }

                  if (line[9].trim() !== '-') {
                    tx_errors = tx_errors + Number.parseInt(line[9], 10);
                  }

                  operstate = 'up';
                }
              }

              result = calcNetworkSpeed(
                ifaceSanitized,
                rx_bytes,
                tx_bytes,
                operstate,
                rx_dropped,
                rx_errors,
                tx_dropped,
                tx_errors,
              );
            }

            resolve(result);
          });
        }

        if (platform._darwin) {
          cmd = 'ifconfig ' + ifaceSanitized + ' | grep "status"'; // lgtm [js/shell-command-constructed-from-input]
          exec(cmd, function (error, stdout) {
            result.operstate = (stdout.toString().split(':')[1] || '').trim();
            result.operstate = (result.operstate || '').toLowerCase();
            result.operstate =
              result.operstate === 'active'
                ? 'up'
                : result.operstate === 'inactive'
                  ? 'down'
                  : 'unknown';
            cmd = 'netstat -bdI ' + ifaceSanitized; // lgtm [js/shell-command-constructed-from-input]
            exec(cmd, function (error, stdout) {
              if (!error) {
                lines = stdout.toString().split('\n');

                // if there is less than 2 lines, no information for this interface was found
                if (lines.length > 1 && lines[1].trim() !== '') {
                  // skip header line
                  // use the second line because it is tied to the NIC instead of the ipv4 or ipv6 address
                  stats = lines[1].replaceAll(/ +/g, ' ').split(' ');
                  const offset = stats.length > 11 ? 1 : 0;
                  rx_bytes = Number.parseInt(stats[offset + 5], 10);
                  rx_dropped = Number.parseInt(stats[offset + 10], 10);
                  rx_errors = Number.parseInt(stats[offset + 4], 10);
                  tx_bytes = Number.parseInt(stats[offset + 8], 10);
                  tx_dropped = Number.parseInt(stats[offset + 10], 10);
                  tx_errors = Number.parseInt(stats[offset + 7], 10);
                  result = calcNetworkSpeed(
                    ifaceSanitized,
                    rx_bytes,
                    tx_bytes,
                    result.operstate,
                    rx_dropped,
                    rx_errors,
                    tx_dropped,
                    tx_errors,
                  );
                }
              }

              resolve(result);
            });
          });
        }

        if (platform._windows) {
          const perfData: PerfDataItem[] = [];
          let ifaceName = ifaceSanitized;

          // Function to get network performance data for an interface
          const getNetworkPerformanceData = async () => {
            const stdout = await util.powerShell(
              `Get-CimInstance Win32_PerfRawData_Tcpip_NetworkInterface | Where-Object { $_.Name -match '${ifaceSanitized.replaceAll(/[^\dA-Za-z]/g, '.')}' } | Select-Object Name,BytesReceivedPersec,PacketsReceivedErrors,PacketsReceivedDiscarded,BytesSentPersec,PacketsOutboundErrors,PacketsOutboundDiscarded | fl`,
              options,
            );
            const psections = stdout.toString().split(/\n\s*\n/);

            return parseLinesWindowsPerfData(psections);
          };

          // Make two measurements 5 seconds apart
          const measureNetworkSpeed = async () => {
            const firstMeasurement = await getNetworkPerformanceData();

            if (firstMeasurement.length === 0) {
              return null;
            }

            const first = firstMeasurement[0];
            const firstTimestamp = Date.now();

            // Wait 5 seconds
            await new Promise((resolve) => setTimeout(resolve, 5000));

            const secondMeasurement = await getNetworkPerformanceData();

            if (secondMeasurement.length === 0) {
              return null;
            }

            const second = secondMeasurement[0];
            const secondTimestamp = Date.now();
            const elapsedSec = (secondTimestamp - firstTimestamp) / 1000;

            // Calculate speed
            const rx_sec = (second.rx_bytes - first.rx_bytes) / elapsedSec;
            const tx_sec = (second.tx_bytes - first.tx_bytes) / elapsedSec;

            return {
              iface: ifaceSanitized,
              operstate: 'up',
              rx_bytes: second.rx_bytes,
              rx_dropped: second.rx_dropped,
              rx_errors: second.rx_errors,
              tx_bytes: second.tx_bytes,
              tx_dropped: second.tx_dropped,
              tx_errors: second.tx_errors,
              rx_sec,
              tx_sec,
              ms: secondTimestamp - firstTimestamp,
            };
          };

          // Run the measurements and resolve
          measureNetworkSpeed().then((measuredResult) => {
            if (measuredResult) {
              resolve(measuredResult);
            } else {
              // Fallback to network interfaces lookup if measurements failed
              networkInterfaces(options).then((interfaces) => {
                // Handle both single interface or array of interfaces
                const interfaceArray = Array.isArray(interfaces) ? interfaces : [interfaces];

                let matchFound = false;

                for (const det of interfaceArray) {
                  // Try to find the network interface that matches the requested one
                  const sanitizedIfaceName = det.ifaceName
                    .replaceAll(/[ ()[\]]+/g, '')
                    .replaceAll(/#|\//g, '_')
                    .toLowerCase();

                  const sanitizedRequestedName = ifaceSanitized
                    .replaceAll(/[ ()[\]]+/g, '')
                    .replace('#', '_')
                    .toLowerCase();

                  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(ifaceSanitized);

                  // Special case for matching IP addresses, including subnet
                  let isIpMatch = false;

                  if (isIpAddress && det.ip4) {
                    // Check if it's exactly the same IP
                    if (det.ip4 === ifaceSanitized) {
                      isIpMatch = true;
                    } else {
                      // Check if it's in the same subnet (first 3 octets match)
                      const ifaceSubnet = ifaceSanitized.split('.').slice(0, 3).join('.');
                      const detIpSubnet = det.ip4.split('.').slice(0, 3).join('.');

                      if (ifaceSubnet === detIpSubnet) {
                        isIpMatch = true;
                      }
                    }
                  }

                  const isMatch =
                    det.iface.toLowerCase() === ifaceSanitized.toLowerCase() ||
                    det.mac.toLowerCase() === ifaceSanitized.toLowerCase() ||
                    det.ip4.toLowerCase() === ifaceSanitized.toLowerCase() ||
                    det.ip6.toLowerCase() === ifaceSanitized.toLowerCase() ||
                    sanitizedIfaceName === sanitizedRequestedName ||
                    isIpMatch;

                  if (isMatch) {
                    // Found the interface, but no performance data
                    ifaceName = det.iface;
                    operstate = det.operstate;
                    matchFound = true;
                    break;
                  }
                }

                if (matchFound) {
                  result.operstate = operstate || 'unknown';
                }

                resolve(result);
              });
            }
          });
        }
      } else {
        result.rx_bytes = _network[ifaceSanitized].rx_bytes || 0;
        result.tx_bytes = _network[ifaceSanitized].tx_bytes || 0;
        result.rx_sec = _network[ifaceSanitized].rx_sec || null;
        result.tx_sec = _network[ifaceSanitized].tx_sec || null;
        result.ms = _network[ifaceSanitized].last_ms || 0;
        result.operstate = _network[ifaceSanitized].operstate || 'unknown';
        resolve(result);
      }
    });
  });
}

export async function networkStats(options = {}, callback) {
  return new Promise((resolve) => {
    process.nextTick(async () => {
      const interfaces = await networkInterfaces(options);

      const results = await Promise.all(
        interfaces.map((iface) => networkStatsSingle(options, iface.iface)),
      );

      if (callback) {
        callback(results);
      }

      resolve(results);
    });
  });
}
