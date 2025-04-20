"use strict";
/**
 * Platform detection utility
 * Centralizes platform detection logic and avoids repetition across modules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultFlags = void 0;
exports.getPlatformFlags = getPlatformFlags;
exports.getPlatformFlagsFromOptions = getPlatformFlagsFromOptions;
/**
 * Get platform flags based on the platform string
 * @param platform Optional platform override
 * @returns Object with platform flags
 */
function getPlatformFlags(platform) {
    const _platform = (platform || process.platform);
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
exports.defaultFlags = getPlatformFlags();
/**
 * Get platform flags from options object
 * @param options Object that may contain a platform property
 * @returns Platform flags
 */
function getPlatformFlagsFromOptions(options = {}) {
    if (options.platform) {
        return getPlatformFlags(options.platform);
    }
    return exports.defaultFlags;
}
