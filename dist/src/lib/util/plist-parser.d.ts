/**
 * Parse plist XML data into a JavaScript object
 * @param {string} xmlStr - XML string to parse
 * @returns {any} Parsed object
 */
declare function plistParser(xmlStr: string): any;
/**
 * Checks if a string is numeric
 * @param {any} str - String to check
 * @returns {boolean} True if numeric
 */
declare function strIsNumeric(str: any): boolean;
/**
 * Parse plist output format into a JavaScript object
 * @param {string} output - Plist output to parse
 * @returns {any} Parsed object
 */
declare function plistReader(output: string): any;
export { plistParser, plistReader, strIsNumeric };
export default plistParser;
//# sourceMappingURL=plist-parser.d.ts.map