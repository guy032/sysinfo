/**
 * Options for platform-specific operations
 */
interface PlatformOptions {
    platform?: string;
    [key: string]: any;
}
/**
 * Initialize the module with dependencies
 *
 * @param {Function} ps - powerShell function to use
 */
export declare function init(ps: (cmd: string | string[], opts?: any) => Promise<string | string[]>): void;
/**
 * Checks if smartmontools are installed
 *
 * @param {PlatformOptions} [options={}] - Function options
 * @returns {Promise<boolean>} Returns true if installed
 */
export declare function smartMonToolsInstalled(options?: PlatformOptions): Promise<boolean>;
export default smartMonToolsInstalled;
//# sourceMappingURL=smart-mon-tools-installed.d.ts.map