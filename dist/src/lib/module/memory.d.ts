export interface MemData {
    total: number;
    free: number;
    used: number;
    active: number;
    available: number;
    buffers: number;
    cached: number;
    slab: number;
    buffcache: number;
    swaptotal: number;
    swapused: number;
    swapfree: number;
    writeback: number | null;
    dirty: number | null;
}
export interface MemLayoutData {
    size: number;
    bank: string;
    type: string;
    ecc: boolean | null;
    clockSpeed: number | null;
    formFactor: string;
    manufacturer: string;
    partNum: string;
    serialNum: string;
    voltageConfigured: number | null;
    voltageMin: number | null;
    voltageMax: number | null;
}
/**
 * Returns memory information
 *
 * @param {object} [options={}] Optional parameters
 * @param {Function} [callback] Optional callback function
 * @returns {Promise<MemData>} Returns memory information
 */
declare function mem(options?: any, callback?: (data: MemData) => void): Promise<MemData>;
/**
 * Returns memory layout information
 *
 * @param {object} [options={}] Optional parameters
 * @param {Function} [callback] Optional callback function
 * @returns {Promise<MemLayoutData[]>} Returns memory layout information
 */
declare function memLayout(options?: any, callback?: (data: MemLayoutData[]) => void): Promise<MemLayoutData[]>;
export { mem, memLayout };
//# sourceMappingURL=memory.d.ts.map