interface InetChecksiteResult {
    url: string;
    ok: boolean;
    status: number;
    ms: number | null;
}
interface InetOptions {
    platform?: string;
    [key: string]: any;
}
type InetChecksiteCallback = (result: InetChecksiteResult) => void;
type InetLatencyCallback = (result: number | null) => void;
declare function inetChecksite(url: string, callback?: InetChecksiteCallback): Promise<InetChecksiteResult>;
declare function inetLatency(options?: InetOptions, host?: string | InetLatencyCallback, callback?: InetLatencyCallback): Promise<number | null>;
export { inetChecksite, InetChecksiteResult, inetLatency, InetOptions };
//# sourceMappingURL=internet.d.ts.map