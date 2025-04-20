/**
 * Sanitize a string for use in shell commands
 *
 * @param {string} str - String to sanitize
 * @param {boolean} [strict=false] - Use strict sanitization
 * @returns {string} Sanitized string
 */
export function sanitizeShellString(str, strict = false) {
    const s = str || '';
    let result = '';
    const l = Math.min(s.length, 2000);
    for (let i = 0; i <= l; i++) {
        if (!(s[i] === undefined ||
            s[i] === '>' ||
            s[i] === '<' ||
            s[i] === '*' ||
            s[i] === '?' ||
            s[i] === '[' ||
            s[i] === ']' ||
            s[i] === '|' ||
            s[i] === '˚' ||
            s[i] === '$' ||
            s[i] === ';' ||
            s[i] === '&' ||
            s[i] === ']' ||
            s[i] === '#' ||
            s[i] === '\\' ||
            s[i] === '\t' ||
            s[i] === '\n' ||
            s[i] === '\r' ||
            s[i] === "'" ||
            s[i] === '`' ||
            s[i] === '"' ||
            s[i].length > 1 ||
            (strict && s[i] === '(') ||
            (strict && s[i] === ')') ||
            (strict && s[i] === '@') ||
            (strict && s[i] === ' ') ||
            (strict && s[i] === '{') ||
            (strict && s[i] === ';') ||
            (strict && s[i] === '}'))) {
            result = result + s[i];
        }
    }
    return result;
}
export default sanitizeShellString;
