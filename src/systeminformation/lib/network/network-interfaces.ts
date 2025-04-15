import * as util from '../util';
import { getPlatformFlagsFromOptions } from '../util/platform';

// Define interfaces for return types
export interface NetworkInterfaceInfo {
  iface: string;
  ifaceName: string;
  default: boolean;
  ip4: string;
  ip4subnet: string;
  ip6: string;
  ip6subnet: string;
  mac: string;
  internal: boolean;
  virtual: boolean;
  operstate: string;
  type: string;
  duplex: string;
  mtu: number;
  speed: number;
  dhcp: boolean;
  dnsSuffix: string;
  ieee8021xAuth: string;
  ieee8021xState: string;
  carrierChanges: number;
}

/**
 * Get network interfaces information
 * @param options Optional parameters
 * @param callback Optional callback function
 * @returns Promise resolving to network interfaces
 */
export function networkInterfaces(
  options: any = {},
  callback?: ((ifaces: NetworkInterfaceInfo[] | NetworkInterfaceInfo) => void) | string | boolean,
): Promise<NetworkInterfaceInfo[]> {
  const platform = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(() => {
      if (options.winrm && platform._windows) {
        try {
          // Get network interfaces and their properties
          const interfacesCmd =
            'Get-NetAdapter | Select-Object -Property Name, InterfaceDescription, Status, MacAddress, LinkSpeed | Format-List';
          const ipAddressCmd =
            'Get-NetIPAddress | Select-Object InterfaceAlias, IPAddress, PrefixLength | Format-List';

          Promise.all([
            util.powerShell(interfacesCmd, options),
            util.powerShell(ipAddressCmd, options),
          ])
            .then(([interfacesResult, ipAddressResult]) => {
              // Parse interfaces information
              const interfaces: NetworkInterfaceInfo[] = [];
              const interfaceSections = interfacesResult
                .toString()
                .split(/\r?\n\s*\r?\n/)
                .filter((section: string) => section.trim());

              for (const section of interfaceSections) {
                const lines = section.split(/\r?\n/).filter((line: string) => line.trim());
                const interfaceInfo: Partial<NetworkInterfaceInfo> = {
                  ip4: '',
                  ip4subnet: '',
                  ip6: '',
                  ip6subnet: '',
                  dhcp: true,
                  dnsSuffix: '',
                  default: false,
                  operstate: '',
                  speed: 0,
                  type: '',
                  duplex: '',
                  mtu: 0,
                  carrierChanges: 0,
                  ieee8021xAuth: '',
                  ieee8021xState: '',
                  virtual: false,
                  internal: false,
                };

                for (const line of lines) {
                  const parts = line.split(':');

                  if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join(':').trim();

                    if (key === 'Name') {
                      interfaceInfo.iface = value;
                    }

                    if (key === 'InterfaceDescription') {
                      interfaceInfo.ifaceName = value;
                    }

                    if (key === 'Status') {
                      interfaceInfo.operstate = value.toLowerCase() === 'up' ? 'up' : 'down';
                    }

                    if (key === 'MacAddress') {
                      interfaceInfo.mac = value.toLowerCase();
                    }

                    if (key === 'LinkSpeed') {
                      const speedMatch = value.match(/(\d+)/);
                      interfaceInfo.speed = speedMatch ? Number.parseInt(speedMatch[1], 10) : 0;
                    }
                  }
                }

                if (interfaceInfo.iface) {
                  interfaceInfo.internal = interfaceInfo.iface.toLowerCase().includes('loopback');
                  interfaceInfo.virtual = interfaceInfo.iface.toLowerCase().includes('virtual');
                  interfaceInfo.type =
                    interfaceInfo.iface?.toLowerCase().includes('wi-fi') ||
                    interfaceInfo.ifaceName?.toLowerCase().includes('wireless')
                      ? 'wireless'
                      : 'wired';

                  interfaces.push(interfaceInfo as NetworkInterfaceInfo);
                }
              }

              const ifaces = interfaces;

              // Parse IP address information
              const ipSections = ipAddressResult
                .toString()
                .split(/\r?\n\s*\r?\n/)
                .filter((section: string) => section.trim());

              for (const section of ipSections) {
                const lines = section.split(/\r?\n/).filter((line: string) => line.trim());
                const ipInfo = {
                  alias: '',
                  address: '',
                  prefixLength: '',
                };

                for (const line of lines) {
                  const parts = line.split(':');

                  if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join(':').trim();

                    if (key === 'InterfaceAlias') {
                      ipInfo.alias = value;
                    }

                    if (key === 'IPAddress') {
                      ipInfo.address = value;
                    }

                    if (key === 'PrefixLength') {
                      ipInfo.prefixLength = value;
                    }
                  }
                }

                if (ipInfo.alias && ipInfo.address) {
                  // Find the corresponding interface and add IP info
                  const matchingInterface = interfaces.find(
                    (iface) => iface.iface === ipInfo.alias,
                  );

                  if (matchingInterface) {
                    if (ipInfo.address.includes(':')) {
                      matchingInterface.ip6 = ipInfo.address;
                      matchingInterface.ip6subnet = ipInfo.prefixLength;
                    } else {
                      matchingInterface.ip4 = ipInfo.address;
                      matchingInterface.ip4subnet = ipInfo.prefixLength;
                    }
                  }
                }
              }

              // Get default interface
              let defaultInterface = '';

              try {
                const defaultCmd =
                  'Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Select-Object -First 1 | Select-Object InterfaceAlias | Format-List';
                util
                  .powerShell(defaultCmd, options)
                  .then((defaultResult) => {
                    const defaultLines = defaultResult
                      .toString()
                      .split(/\r?\n/)
                      .filter((line: string) => line.trim());

                    for (const line of defaultLines) {
                      const parts = line.split(':');

                      if (parts.length >= 2 && parts[0].trim() === 'InterfaceAlias') {
                        defaultInterface = parts[1].trim();
                        break;
                      }
                    }

                    // Mark default interface
                    for (const iface of interfaces) {
                      iface.default = iface.iface === defaultInterface;
                    }

                    const result: NetworkInterfaceInfo[] | NetworkInterfaceInfo = interfaces;

                    if (callback && typeof callback === 'function') {
                      callback(result);
                    }

                    resolve(result);
                  })
                  .catch((error) => {
                    console.error('Error getting default interface:', error);
                    // Still resolve with interfaces without marking default
                    const result: NetworkInterfaceInfo[] | NetworkInterfaceInfo = interfaces;

                    if (callback && typeof callback === 'function') {
                      callback(result);
                    }

                    resolve(result);
                  });
              } catch (error) {
                console.error('Error determining default interface:', error);
                // Resolve with interfaces without marking default
                const result: NetworkInterfaceInfo[] | NetworkInterfaceInfo = interfaces;

                if (callback && typeof callback === 'function') {
                  callback(result);
                }

                resolve(result);
              }
            })
            .catch((error) => {
              console.error('Error getting network interfaces over WinRM:', error);

              // Fallback for error cases
              if (callback && typeof callback === 'function') {
                callback([]);
              }

              resolve([]);
            });
        } catch (error) {
          console.error('Error getting network interfaces over WinRM:', error);

          // Fallback for error cases
          if (callback && typeof callback === 'function') {
            callback([]);
          }

          resolve([]);
        }
      } else {
        // Fallback for non-WinRM and non-Windows
        if (callback && typeof callback === 'function') {
          callback([]);
        }

        resolve([]);
      }
    });
  });
}
