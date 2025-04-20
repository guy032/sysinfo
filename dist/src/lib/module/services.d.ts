export interface ProcessesOptions {
    winrm?: any;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    platform?: string;
    [key: string]: any;
}
export interface ServiceInfo {
    name: string;
    running: boolean;
    startmode: string;
    pids?: number[];
    cpu?: number;
    mem?: number;
    path?: string;
}
/**
 * Get services information
 * @param options - Options for retrieving service information
 * @param srv - Comma separated service names or * for all services
 * @param callback - Optional callback function
 * @returns Promise resolving to an array of service information
 */
export declare function services(options?: ProcessesOptions, srv?: string | ((data: ServiceInfo[]) => void), callback?: (data: ServiceInfo[]) => void): Promise<ServiceInfo[]>;
//# sourceMappingURL=services.d.ts.map