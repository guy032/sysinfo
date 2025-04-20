interface IUsbDevice {
    bus: number | null;
    deviceId: number | null;
    id: string | null;
    name: string | null;
    type: string;
    removable: boolean | null;
    vendor: string | null;
    manufacturer: string | null;
    maxPower: number | null;
    serialNumber: string | null;
}
interface IUsbOptions {
    platform?: string;
    [key: string]: any;
}
type IUsbCallback = (data: IUsbDevice[]) => void;
declare function usb(options?: IUsbOptions, callback?: IUsbCallback): Promise<IUsbDevice[]>;
export { IUsbDevice, IUsbOptions, usb };
//# sourceMappingURL=usb.d.ts.map