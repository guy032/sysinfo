interface TimeData {
    current: number;
    uptime: number;
    timezone: string;
    timezoneName: string;
}
interface OSInfo {
    platform: string;
    distro?: string;
    release?: string;
    codename?: string;
    kernel?: string;
    arch?: string;
    hostname?: string;
    fqdn?: string;
    codepage?: string;
    logofile?: string;
    serial?: string;
    build?: string;
    servicepack?: string;
    uefi?: boolean | null;
    hypervisor?: boolean;
    remoteSession?: boolean;
}
interface ApplicationInfo {
    Name: string;
    Version: string;
    Publisher?: string;
    InstallDate?: string;
    InstallSource?: string;
    UninstallString?: string;
    InstallLocation?: string;
    EstimatedSizeMB?: number;
}
interface UUIDInfo {
    os: string;
    hardware: string;
    macs: string[];
}
interface OsInfoOptions {
    platform?: string;
    [key: string]: any;
}
declare function time(options?: OsInfoOptions, callback?: (data: TimeData) => void): Promise<TimeData>;
declare const uuid: (options?: OsInfoOptions, callback?: (data: UUIDInfo) => void) => Promise<UUIDInfo>;
declare const osInfo: (options?: OsInfoOptions, callback?: (data: OSInfo) => void) => Promise<OSInfo>;
declare function applications(options?: OsInfoOptions, callback?: (data: ApplicationInfo[]) => void): Promise<ApplicationInfo[]>;
declare function shell(options?: OsInfoOptions, callback?: (data: string) => void): Promise<string>;
export { ApplicationInfo, applications, OSInfo, osInfo, OsInfoOptions, shell, time, TimeData, uuid, UUIDInfo, };
//# sourceMappingURL=osinfo.d.ts.map