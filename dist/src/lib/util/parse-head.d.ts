/**
 * Result interface for parsed head output
 */
export interface ParseHeadResult {
    data: string[][];
    title: string[];
}
/**
 * Parse head output to object
 *
 * @param {string[]} lines - head output lines to parse
 * @param {string} [delimiter=':'] - Delimiter of the head output
 * @param {number} [maxCols=2] - Maximum number of columns
 * @returns {ParseHeadResult} Object with data and title properties
 */
export declare function parseHead(lines: string[], delimiter?: string, maxCols?: number): ParseHeadResult;
export default parseHead;
//# sourceMappingURL=parse-head.d.ts.map