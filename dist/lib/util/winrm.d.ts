export interface IWinRMParams {
    host: string;
    port: number;
    path: string;
    auth: string;
    shellId?: string;
    command?: string;
    commandId?: string;
}
export interface IWinRMOptions {
    winrm: any;
    host: string;
    port?: number;
    username: string;
    password: string;
    timeout?: number;
    shellTimeout?: number;
    cmdTimeout?: number;
}
/**
 * Execute a batch of commands in a single WinRM shell
 */
export declare function winRMSingleShell(cmds: string[], opts: IWinRMOptions): Promise<string[]>;
/**
 * Execute a batch of commands in parallel using WinRM
 */
export declare function winRMBatch(cmds: string[], opts: IWinRMOptions): Promise<string[]>;
/**
 * Execute a single command with WinRM, optimized for workload processing
 */
export declare function winRMWorkload(cmd: string, opts: IWinRMOptions): Promise<string>;
/**
 * Execute a single command with WinRM
 */
export declare function executeSingleCommand(cmd: string, opts: IWinRMOptions): Promise<string>;
//# sourceMappingURL=winrm.d.ts.map