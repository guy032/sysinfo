export interface IWifiNetwork {
    ssid: string;
    bssid: string;
    mode: string;
    channel: number | null;
    frequency: number | null;
    signalLevel: number | null;
    quality: number | null;
    security: string[];
    wpaFlags: string[];
    rsnFlags: string[];
}
export interface IWifiConnection {
    id: string | number;
    iface: string;
    model: string | null;
    ssid: string;
    bssid: string | null;
    channel: number | null;
    frequency: number | null;
    type: string | null;
    security: string | null | string[];
    signalLevel: number | null;
    quality: number | null;
    txRate: number | null;
    rxRate?: number | null;
    band?: string | null;
    cipher?: string | null;
    connectionMode?: string | null;
    profile?: string | null;
    networkType?: string | null;
    physicalAddress?: string | null;
    state?: string | null;
}
export interface IWifiInterface {
    id: string | number;
    iface: string;
    model: string | null;
    vendor: string | null;
    mac: string;
}
export interface IWifiOptions {
    winrm?: any;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    platform?: string;
    [key: string]: any;
}
/**
 * Get all available wifi networks
 * @param options Optional parameters
 * @param callback Optional callback function
 * @returns Promise resolving to array of wifi networks
 */
export declare function wifiNetworks(options?: IWifiOptions, callback?: (data: IWifiNetwork[]) => void): Promise<IWifiNetwork[]>;
/**
 * Get active wifi connections
 * @param options Optional parameters
 * @param callback Optional callback function
 * @returns Promise resolving to array of wifi connections
 */
export declare function wifiConnections(options?: IWifiOptions, callback?: (data: IWifiConnection[]) => void): Promise<IWifiConnection[]>;
/**
 * Get wifi interfaces
 * @param options Optional parameters
 * @param callback Optional callback function
 * @returns Promise resolving to array of wifi interfaces
 */
export declare function wifiInterfaces(options?: IWifiOptions, callback?: (data: IWifiInterface[]) => void): Promise<IWifiInterface[]>;
//# sourceMappingURL=wifi.d.ts.map