/**
 * Result interface for parsed date and time
 */
export interface ParsedDateTime {
    date?: string;
    time?: string;
}
/**
 * Parse date/time string to object
 *
 * @param {string} dt - Date/time string to parse
 * @param {string} [culture=''] - Culture string
 * @returns {ParsedDateTime} Object with date and time properties
 */
export declare function parseDateTime(dt: string, culture?: string): ParsedDateTime;
export default parseDateTime;
//# sourceMappingURL=parse-date-time.d.ts.map