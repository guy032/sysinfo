import { winRMBatch, winRMSingleShell, winRMWorkload } from './winrm';
declare function powerShellStart(): void;
declare function powerShellRelease(): void;
declare function powerShell(cmd: string | string[], opts?: any): Promise<string | string[]>;
declare const powerShellWinRMBatch: typeof winRMBatch;
declare const powerShellWinRMSingleShell: typeof winRMSingleShell;
declare const powerShellWinRMWorkload: typeof winRMWorkload;
declare function getPowerShellPath(): string;
declare function init(powershellPath: string): void;
/**
 * Execute a PowerShell script file with consistent handling for both local and WinRM execution
 *
 * @param {string} scriptPath - Path to the PowerShell script
 * @param {object} options - Options for execution including WinRM details if needed
 * @returns {Promise<string|string[]>} - Script execution output
 */
declare function executeScript(scriptPath: string, options?: any): Promise<string | string[]>;
export { executeScript, getPowerShellPath, init, powerShell, powerShellRelease, powerShellStart, powerShellWinRMBatch, powerShellWinRMSingleShell, powerShellWinRMWorkload, };
//# sourceMappingURL=powershell.d.ts.map