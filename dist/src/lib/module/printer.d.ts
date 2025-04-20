interface IPrinter {
    id: number | null;
    name: string | null;
    model: string | null;
    uri: string | null;
    uuid: string | null;
    status: string | null;
    local: boolean;
    default: boolean | null;
    shared: boolean;
    location?: string | null;
    ipAddress?: string | null;
    driverName?: string | null;
    portHostAddress?: string | null;
    portDescription?: string | null;
    engine?: string;
    engineVersion?: string;
}
interface IPrinterOptions {
    platform?: string;
    [key: string]: any;
}
type PrinterCallback = (data: IPrinter[]) => void;
declare function printer(options?: IPrinterOptions, callback?: PrinterCallback): Promise<IPrinter[]>;
export { IPrinter, IPrinterOptions, printer };
//# sourceMappingURL=printer.d.ts.map