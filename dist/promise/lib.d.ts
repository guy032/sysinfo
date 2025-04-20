/**
 * Type definition for a function that can be wrapped with try-catch
 * Including optional properties that might be set on the function
 */
interface WrapFunction {
    (...args: any[]): Promise<any>;
    name?: string;
    _name?: string;
    _fnName?: string;
}
export declare const wifiNetworks: WrapFunction;
export declare const wifiInterfaces: WrapFunction;
export declare const wifiConnections: WrapFunction;
export declare const battery: WrapFunction;
export declare const audio: WrapFunction;
export declare const bluetoothDevices: WrapFunction;
export declare const cpu: WrapFunction;
export declare const graphics: WrapFunction;
export declare const disksIO: WrapFunction;
export declare const diskLayout: WrapFunction;
export declare const blockDevices: WrapFunction;
export declare const fsSize: WrapFunction;
export declare const fsOpenFiles: WrapFunction;
export declare const fsStats: WrapFunction;
export declare const inetLatency: WrapFunction;
export declare const mem: WrapFunction;
export declare const memLayout: WrapFunction;
export declare const networkInterfaces: WrapFunction;
export declare const networkInterfaceDefault: WrapFunction;
export declare const networkGatewayDefault: WrapFunction;
export declare const networkConnections: WrapFunction;
export declare const networkStats: WrapFunction;
export declare const osInfo: WrapFunction;
export declare const applications: WrapFunction;
export declare const shell: WrapFunction;
export declare const uuid: WrapFunction;
export declare const time: WrapFunction;
export declare const printer: WrapFunction;
export declare const system: WrapFunction;
export declare const baseboard: WrapFunction;
export declare const chassis: WrapFunction;
export declare const bios: WrapFunction;
export declare const usb: WrapFunction;
export declare const users: WrapFunction;
export declare const gps: WrapFunction;
export declare const processes: WrapFunction;
export declare const services: WrapFunction;
export declare const files: WrapFunction;
export declare const screenshot: WrapFunction;
export {};
//# sourceMappingURL=lib.d.ts.map