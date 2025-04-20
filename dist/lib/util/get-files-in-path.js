import * as fs from 'fs';
import path from 'path';
/**
 * Get all files in a directory and its subdirectories
 *
 * @param {string} source - Source directory path
 * @returns {string[]} Array of file paths
 */
export function getFilesInPath(source) {
    /**
     * Check if a path is a directory
     *
     * @param {string} src - Path to check
     * @returns {boolean} True if path is a directory
     */
    function isDirectory(src) {
        return fs.lstatSync(src).isDirectory();
    }
    /**
     * Check if a path is a file
     *
     * @param {string} src - Path to check
     * @returns {boolean} True if path is a file
     */
    function isFile(src) {
        return fs.lstatSync(src).isFile();
    }
    /**
     * Get all directories in a directory
     *
     * @param {string} src - Source directory path
     * @returns {string[]} Array of directory paths
     */
    function getDirectories(src) {
        return fs
            .readdirSync(src)
            .map((name) => path.join(src, name))
            .filter((src) => isDirectory(src));
    }
    /**
     * Get all files in a directory
     *
     * @param {string} src - Source directory path
     * @returns {string[]} Array of file paths
     */
    function getFiles(src) {
        return fs
            .readdirSync(src)
            .map((name) => path.join(src, name))
            .filter((src) => isFile(src));
    }
    /**
     * Get all files in a directory and its subdirectories
     *
     * @param {string} src - Source directory path
     * @returns {string[]} Array of file paths
     */
    function getFilesRecursively(src) {
        try {
            const dirs = getDirectories(src);
            const files = dirs.flatMap((dir) => getFilesRecursively(dir));
            return [...files, ...getFiles(src)];
        }
        catch {
            return [];
        }
    }
    if (fs.existsSync(source)) {
        return getFilesRecursively(source);
    }
    return [];
}
export default getFilesInPath;
