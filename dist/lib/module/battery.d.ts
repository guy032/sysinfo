/**
 * Battery information interface
 */
export interface IBatteryData {
    hasBattery: boolean;
    cycleCount: number;
    isCharging: boolean;
    designedCapacity: number;
    maxCapacity: number;
    currentCapacity: number;
    voltage: number;
    capacityUnit: string;
    percent: number;
    timeRemaining: number | null;
    acConnected: boolean;
    type: string;
    model: string;
    manufacturer: string;
    serial: string;
    additionalBatteries?: IBatteryData[];
}
/**
 * Options for battery data retrieval
 */
export interface IBatteryOptions {
    winrm?: any;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    platform?: string;
    [key: string]: any;
}
/**
 * Callback function type for battery data
 */
type IBatteryCallback = (data: IBatteryData) => void;
/**
 * Get battery information
 */
export declare function battery(options?: IBatteryOptions, callback?: IBatteryCallback): Promise<IBatteryData>;
export {};
//# sourceMappingURL=battery.d.ts.map