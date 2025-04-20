export interface CPUOptions {
    platform?: string;
    [key: string]: any;
}
export interface CPUInfo {
    manufacturer: string;
    brand: string;
    vendor: string;
    family: string;
    model: string;
    stepping: string;
    revision: string;
    voltage: string;
    speed: number;
    speedMin: number;
    speedMax: number;
    governor: string;
    cores: number;
    physicalCores: number;
    performanceCores: number;
    efficiencyCores: number;
    processors: number;
    socket: string;
    flags: string;
    virtualization: boolean;
    cache: CPUCache;
    temperature?: CPUTemperature;
    raspberry?: {
        manufacturer: string;
        processor: string;
        type: string;
        revision: string;
    };
}
export interface CPUCache {
    l1d: number | null;
    l1i: number | null;
    l2: number | null;
    l3: number | null;
}
export interface CPUTemperature {
    main: number | null;
    cores: number[];
    max: number | null;
    socket: number[];
    chipset: number | null;
}
export interface CPUFlags {
    flags: string;
}
export interface CurrentLoadInfo {
    avgLoad: number;
    currentLoad: number;
    currentLoadUser: number;
    currentLoadSystem: number;
    currentLoadNice: number;
    currentLoadIdle: number;
    currentLoadIrq: number;
    currentLoadSteal: number;
    currentLoadGuest: number;
    rawCurrentLoad: number;
    rawCurrentLoadUser: number;
    rawCurrentLoadSystem: number;
    rawCurrentLoadNice: number;
    rawCurrentLoadIdle: number;
    rawCurrentLoadIrq: number;
    rawCurrentLoadSteal: number;
    rawCurrentLoadGuest: number;
    cpus: CoreLoadInfo[];
}
export interface CoreLoadInfo {
    load: number;
    loadUser: number;
    loadSystem: number;
    loadNice: number;
    loadIdle: number;
    loadIrq: number;
    loadSteal?: number;
    loadGuest?: number;
    rawLoad: number;
    rawLoadUser: number;
    rawLoadSystem: number;
    rawLoadNice: number;
    rawLoadIdle: number;
    rawLoadIrq: number;
    rawLoadSteal?: number;
    rawLoadGuest?: number;
}
export interface CPUSpeed {
    min: number;
    max: number;
    avg: number;
    cores: number[];
}
/**
 * Get CPU flags
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to CPU flags as string
 */
export declare function cpuFlags(options?: CPUOptions, callback?: (data: string) => void): Promise<string>;
/**
 * Get CPU temperature if sensors are installed
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to CPU temperature information
 */
export declare function cpuTemperature(options?: CPUOptions, callback?: (data: CPUTemperature) => void): Promise<CPUTemperature>;
/**
 * Get CPU cache information
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to CPU cache information
 */
export declare function cpuCache(options?: CPUOptions, callback?: (data: CPUCache) => void): Promise<CPUCache>;
/**
 * Get CPU information
 * @param options Options
 * @param callback Optional callback function
 * @returns Promise resolving to CPU information
 */
export declare function cpu(options?: CPUOptions, callback?: (data: CPUInfo) => void): Promise<CPUInfo>;
/**
 * Get current CPU speed
 * @param callback Optional callback function
 * @returns Promise resolving to CPU speed information
 */
export declare function cpuCurrentSpeed(options?: CPUOptions, callback?: (data: CPUSpeed) => void): Promise<CPUSpeed>;
/**
 * Get current CPU load
 * @param callback Optional callback function
 * @returns Promise resolving to current load
 */
export declare function currentLoad(callback?: (data: CurrentLoadInfo) => void): Promise<CurrentLoadInfo>;
/**
 * Get full CPU load since bootup
 * @param callback Optional callback function
 * @returns Promise resolving to full load
 */
export declare function fullLoad(callback?: (data: number) => void): Promise<number>;
//# sourceMappingURL=cpu.d.ts.map