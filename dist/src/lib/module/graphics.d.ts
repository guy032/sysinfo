export interface IGraphicsController {
    vendor: string;
    model: string;
    deviceName?: string;
    bus?: string;
    busAddress?: string;
    vram: number | null;
    vramDynamic: boolean;
    pciID?: string;
    subVendor?: string;
    vendorId?: string;
    deviceId?: string;
    external?: boolean;
    cores?: number | null;
    metalVersion?: string;
    driverVersion?: string;
    subDeviceId?: string | null;
    name?: string;
    pciBus?: string;
    fanSpeed?: number;
    memoryTotal?: number;
    memoryUsed?: number;
    memoryFree?: number;
    utilizationGpu?: number;
    utilizationMemory?: number;
    temperatureGpu?: number;
    temperatureMemory?: number;
    powerDraw?: number;
    powerLimit?: number;
    clockCore?: number;
    clockMemory?: number;
}
export interface IGraphicsDisplay {
    vendor: string;
    vendorId?: string;
    model: string;
    productionYear?: number | null;
    serial?: string | null;
    deviceName: string;
    displayId?: string | null;
    main: boolean;
    builtin: boolean;
    connection: string | null;
    sizeX: number | null;
    sizeY: number | null;
    pixelDepth: number | null;
    resolutionX: number | null;
    resolutionY: number | null;
    currentResX: number | null;
    currentResY: number | null;
    positionX: number;
    positionY: number;
    currentRefreshRate: number | null;
}
export interface IGraphicsResult {
    controllers: IGraphicsController[];
    displays: IGraphicsDisplay[];
}
export interface IGraphicsOptions {
    platform?: string;
    winrm?: any;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    [key: string]: any;
}
/**
 * Main function to get graphics information
 * @param options Options for function
 * @param callback Optional callback function
 * @returns Promise resolving to graphics information
 */
export declare function graphics(options?: IGraphicsOptions, callback?: (data: IGraphicsResult) => void): Promise<IGraphicsResult>;
//# sourceMappingURL=graphics.d.ts.map