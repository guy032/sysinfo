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
export declare function networkInterfaces(options?: any, callback?: ((ifaces: NetworkInterfaceInfo[] | NetworkInterfaceInfo) => void) | string | boolean): Promise<NetworkInterfaceInfo[]>;
//# sourceMappingURL=network-interfaces.d.ts.map