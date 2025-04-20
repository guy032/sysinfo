/**
 * Bluetooth device information
 */
export interface IBluetoothDevice {
    device: string | null;
    name: string | null;
    manufacturer: string | null;
    macDevice: string | null;
    macHost: string | null;
    batteryPercent: number | null;
    type: string | null;
    connected: boolean | null;
}
/**
 * Options for bluetooth retrieval
 */
export interface IBluetoothOptions {
    winrm?: any;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    platform?: string;
    [key: string]: any;
}
/**
 * Callback function type for bluetooth data
 */
type IBluetoothCallback = (data: IBluetoothDevice[]) => void;
/**
 * Get bluetooth devices information
 */
export declare function bluetoothDevices(options?: IBluetoothOptions, callback?: IBluetoothCallback): Promise<IBluetoothDevice[]>;
export {};
//# sourceMappingURL=bluetooth.d.ts.map