/**
 * Options for platform-specific operations
 */
interface IPlatformOptions {
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
 * Get current codepage of system
 *
 * @param {PlatformOptions} [options={}] - Function options
 * @returns {string} Returns codepage
 */
export declare function getCodepage(options?: IPlatformOptions): string;
export default getCodepage;
//# sourceMappingURL=get-codepage.d.ts.map