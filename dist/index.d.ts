export interface WinRMOptions {
    host: string;
    port: number;
    username: string;
    password: string;
}
export type SystemInfoResult = Record<string, any>;
/**
 * Get all static system information
 * Static information includes hardware details, system configuration, installed applications, etc.
 *
 * @param options - WinRM connection options
 * @returns Promise with static system information
 */
export declare function getStaticInfo(options: WinRMOptions): Promise<SystemInfoResult>;
/**
 * Get all dynamic system information
 * Dynamic information includes processes, network connections, memory usage, etc.
 *
 * @param options - WinRM connection options
 * @returns Promise with dynamic system information
 */
export declare function getDynamicInfo(options: WinRMOptions): Promise<SystemInfoResult>;
/**
 * Get all system information (both static and dynamic)
 *
 * @param options - WinRM connection options
 * @returns Promise with all system information
 */
export declare function getAllInfo(options: WinRMOptions): Promise<SystemInfoResult>;
//# sourceMappingURL=index.d.ts.map