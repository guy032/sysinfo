/**
 * Directory tree data interface
 */
export interface IFileData {
    Name: string;
    Path: string;
    Type: string;
    FileCount: number;
    SizeBytes: number;
    Files: IFile[];
    Children: IFileData[];
    TotalDirCount?: number;
    HasMoreFiles?: boolean;
    HasMoreDirs?: boolean;
    FileOffset?: number;
    FileLimit?: number;
    DirOffset?: number;
    DirLimit?: number;
    error?: boolean;
    message?: string;
    [key: string]: any;
}
/**
 * File data interface
 */
export interface IFile {
    Name: string;
    Length: number;
    LastAccessTime: number;
    LastWriteTime: number;
    CreationTime: number;
    Type: string;
}
/**
 * Options for file retrieval
 */
export interface IFileOptions {
    winrm?: any;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    platform?: string;
    batch?: {
        fileOffset?: number;
        fileLimit?: number;
        dirOffset?: number;
        dirLimit?: number;
        maxDepth?: number;
        includeSystemDirs?: boolean;
    };
    [key: string]: any;
}
/**
 * Callback function type for file data
 */
type IFilesCallback = (data: IFileData) => void;
/**
 * Get directory and file information from the system
 *
 * @param {IFileOptions} options - options for WinRM if used remotely and path/depth settings
 * @param {IFilesCallback} callback - callback function
 * @returns {Promise<IFileData>} - File/directory tree data
 */
export declare function files(options?: IFileOptions, callback?: IFilesCallback): Promise<IFileData>;
export {};
//# sourceMappingURL=files.d.ts.map