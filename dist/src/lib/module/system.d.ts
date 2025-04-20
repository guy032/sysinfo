export interface Options {
    platform?: string;
    [key: string]: any;
}
export interface SystemInfo {
    manufacturer: string;
    model: string;
    version: string;
    serial: string;
    uuid: string;
    sku: string;
    virtual: boolean;
    virtualHost?: string;
    type?: string;
    raspberry?: {
        manufacturer: string;
        processor: string;
        type: string;
        revision: string;
    };
}
export interface BiosInfo {
    vendor: string;
    version: string;
    releaseDate: string;
    revision: string;
    serial?: string;
    language?: string;
    features?: string[];
    vendorVersion?: string;
}
export interface BaseboardInfo {
    manufacturer: string;
    model: string;
    version: string;
    serial: string;
    assetTag: string;
    memMax: number | null;
    memSlots: number | null;
}
export interface ChassisInfo {
    manufacturer: string;
    model: string;
    type: string;
    version: string;
    serial: string;
    assetTag: string;
    sku: string;
}
/**
 * Get system information
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to system information
 */
export declare function system(options?: Options, callback?: (data: SystemInfo) => void): Promise<SystemInfo>;
/**
 * Get BIOS information
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to BIOS information
 */
export declare function bios(options?: Options, callback?: (data: BiosInfo) => void): Promise<BiosInfo>;
/**
 * Get baseboard information
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to baseboard information
 */
export declare function baseboard(options?: Options, callback?: (data: BaseboardInfo) => void): Promise<BaseboardInfo>;
/**
 * Get chassis information
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to chassis information
 */
export declare function chassis(options?: Options, callback?: (data: ChassisInfo) => void): Promise<ChassisInfo>;
//# sourceMappingURL=system.d.ts.map