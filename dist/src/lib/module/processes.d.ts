export interface ProcessInfo {
    pid: number;
    parentPid: number;
    name: string;
    cpu: number;
    cpuu: number;
    cpus: number;
    mem: number;
    priority: number;
    memVsz: number;
    memRss: number;
    nice?: number;
    started: string;
    state: string;
    tty: string;
    user: string;
    command: string;
    params: string;
    path: string;
    utime?: number;
    stime?: number;
}
export interface ProcessesData {
    all: number;
    running: number;
    blocked: number;
    sleeping: number;
    unknown: number;
    list: ProcessInfo[];
}
export interface ProcessesOptions {
    winrm?: any;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    platform?: string;
    [key: string]: any;
}
export declare function processes(options?: ProcessesOptions, callback?: (data: ProcessesData) => void): Promise<ProcessesData>;
//# sourceMappingURL=processes.d.ts.map