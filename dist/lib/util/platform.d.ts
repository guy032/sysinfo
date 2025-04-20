/**
 * Platform detection utility
 * Centralizes platform detection logic and avoids repetition across modules
 */
export type Platform = 'linux' | 'darwin' | 'win32' | 'freebsd' | 'openbsd' | 'netbsd' | 'sunos' | 'android';
export interface PlatformFlags {
    _platform: Platform;
    _linux: boolean;
    _darwin: boolean;
    _windows: boolean;
    _freebsd: boolean;
    _openbsd: boolean;
    _netbsd: boolean;
    _sunos: boolean;
}
/**
 * Get platform flags based on the platform string
 * @param platform Optional platform override
 * @returns Object with platform flags
 */
export declare function getPlatformFlags(platform?: string): PlatformFlags;
export declare const defaultFlags: PlatformFlags;
/**
 * Get platform flags from options object
 * @param options Object that may contain a platform property
 * @returns Platform flags
 */
export declare function getPlatformFlagsFromOptions(options?: any): PlatformFlags;
//# sourceMappingURL=platform.d.ts.map