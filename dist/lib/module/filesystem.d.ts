export interface FSOptions {
    platform?: string;
    [key: string]: any;
}
export interface FSMount {
    fs: string;
    type: string;
    size: number;
    used: number;
    available: number;
    use: number;
    mount: string;
    rw: boolean | null;
    serialNum?: string;
}
export interface FSOpenFiles {
    max: number | null;
    allocated: number | null;
    available: number | null;
}
export interface BlockDevice {
    device?: string;
    type: string;
    name: string;
    vendor?: string;
    size: number;
    bytesPerSector?: number | null;
    totalCylinders?: number | null;
    totalHeads?: number | null;
    totalSectors?: number | null;
    totalTracks?: number | null;
    tracksPerCylinder?: number | null;
    sectorsPerTrack?: number | null;
    firmwareRevision?: string;
    serialNum?: string;
    interfaceType?: string;
    smartStatus?: string;
    temperature?: number | null;
    smartData?: any;
    identifier?: string;
    fstype?: string;
    mount?: string | null;
    physical?: string | boolean;
    removable?: boolean | null;
    protocol?: string | null;
    group?: string;
    uuid?: string;
    label?: string;
    model?: string;
    serial?: string;
    partitions?: number;
    signature?: string;
    capabilities?: string[];
    description?: string;
    pnpDeviceId?: string;
    busType?: string;
    port?: number;
    logicalUnit?: number;
    targetId?: number;
    systemName?: string;
}
export interface DiskLayout {
    device: string;
    type: string;
    name: string;
    vendor: string;
    size: number;
    bytesPerSector: number;
    totalCylinders: number;
    totalHeads: number;
    totalTracks: number;
    totalSectors: number;
    tracksPerCylinder: number;
    sectorsPerTrack: number;
    firmwareRevision: string;
    serialNum: string;
    interfaceType: string;
    smartStatus: string;
    temperature?: number;
    partitions?: number;
    pnpDeviceId?: string;
    description?: string;
    busType?: string;
    port?: number;
    logicalUnit?: number;
    targetId?: number;
    capabilities?: string[];
    systemName?: string;
}
export interface FSStats {
    rx: number;
    wx: number;
    tx: number;
    rx_sec: number | null;
    wx_sec: number | null;
    tx_sec: number | null;
    ms: number;
}
export interface DiskIO {
    name?: string;
    rIO?: number;
    wIO?: number;
    tIO?: number;
    rIO_sec?: number;
    wIO_sec?: number;
    tIO_sec?: number;
    rx?: number;
    wx?: number;
    tx?: number;
    rx_sec?: number;
    wx_sec?: number;
    tx_sec?: number;
    rx_sectors?: number;
    wx_sectors?: number;
    tx_sectors?: number;
    ms?: number;
    qms?: number;
    rWaitTime?: number;
    wWaitTime?: number;
    tWaitTime?: number;
    rWaitPercent?: number;
    wWaitPercent?: number;
    tWaitPercent?: number;
    tms?: number;
}
/**
 * Calculates filesystem usage
 */
export declare function fsSize(options?: FSOptions, callback?: (data: FSMount[]) => void): Promise<FSMount[]>;
export declare function fsOpenFiles(options?: FSOptions, callback?: (data: FSOpenFiles) => void): Promise<FSOpenFiles>;
export declare function blockDevices(options?: FSOptions, callback?: (data: BlockDevice[]) => void): Promise<BlockDevice[]>;
export declare function fsStats(options?: FSOptions, callback?: (data: FSStats) => void): Promise<FSStats | null>;
export declare function disksIO(options?: FSOptions, callback?: (data: DiskIO[]) => void): Promise<DiskIO[]>;
export declare function diskLayout(options?: FSOptions, callback?: (data: DiskLayout[]) => void): Promise<DiskLayout[]>;
//# sourceMappingURL=filesystem.d.ts.map