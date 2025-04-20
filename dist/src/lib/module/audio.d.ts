interface IAudioDevice {
    id: string | null;
    name: string | null;
    manufacturer: string | null;
    revision?: string | null;
    driver?: string | null;
    default?: boolean | null;
    channel: string | null;
    type: string | null;
    in?: boolean | null;
    out?: boolean | null;
    status: string | null;
}
interface IAudioOptions {
    platform?: string;
    [key: string]: any;
}
type IAudioCallback = (data: IAudioDevice[]) => void;
declare function audio(options?: IAudioOptions, callback?: IAudioCallback): Promise<IAudioDevice[]>;
export { audio };
//# sourceMappingURL=audio.d.ts.map