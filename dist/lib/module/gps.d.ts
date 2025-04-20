/**
 * GPS location data interface
 */
export interface IGpsData {
    latitude?: number;
    longitude?: number;
    status?: string;
    accuracy?: number | null;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    timestamp?: string;
    error?: boolean;
    message?: string;
    [key: string]: any;
}
/**
 * Options for GPS retrieval
 */
export interface IGpsOptions {
    winrm?: any;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    platform?: string;
    [key: string]: any;
}
/**
 * Callback function type for GPS data
 */
type IGpsCallback = (data: IGpsData) => void;
/**
 * Get current GPS/location of the system
 *
 * @param {IGpsOptions} options - options for WinRM if used remotely
 * @param {IGpsCallback} callback - callback function
 * @returns {Promise<IGpsData>} - GPS data containing latitude and longitude
 */
export declare function gps(options?: IGpsOptions, callback?: IGpsCallback): Promise<IGpsData>;
export {};
//# sourceMappingURL=gps.d.ts.map