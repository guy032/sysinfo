/**
 * Platform detection utility
 * Centralizes platform detection logic and avoids repetition across modules
 */

// Define the platform type
export type Platform =
  | 'linux'
  | 'darwin'
  | 'win32'
  | 'freebsd'
  | 'openbsd'
  | 'netbsd'
  | 'sunos'
  | 'android';

// Platform flags interface
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
export function getPlatformFlags(platform?: string): PlatformFlags {
  const _platform = (platform || process.platform) as Platform;

  return {
    _platform,
    _linux: _platform === 'linux' || _platform === 'android',
    _darwin: _platform === 'darwin',
    _windows: _platform === 'win32',
    _freebsd: _platform === 'freebsd',
    _openbsd: _platform === 'openbsd',
    _netbsd: _platform === 'netbsd',
    _sunos: _platform === 'sunos',
  };
}

// Default platform flags based on current system
export const defaultFlags = getPlatformFlags();

/**
 * Get platform flags from options object
 * @param options Object that may contain a platform property
 * @returns Platform flags
 */
export function getPlatformFlagsFromOptions(options: any = {}): PlatformFlags {
  if (options.platform) {
    return getPlatformFlags(options.platform);
  }

  return defaultFlags;
}
