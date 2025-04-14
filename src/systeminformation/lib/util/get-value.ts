/**
 * Get a value from lines of text based on a property and separator
 *
 * @param {string[]} lines - Lines to search
 * @param {string} property - Property to search for
 * @param {string} [separator=':'] - Separator between property and value
 * @param {boolean} [trimmed=false] - Whether to trim the line
 * @param {boolean} [lineMatch=false] - Whether to return the whole line
 * @returns {string} Value found
 */
export default function getValue(
  lines: string[],
  property: string,
  separator = ':',
  trimmed = false,
  lineMatch = false,
): string {
  property = property.toLowerCase();
  let result = '';

  lines.some((line) => {
    let lineLower = line.toLowerCase().replaceAll('\t', '');

    if (trimmed) {
      lineLower = lineLower.trim();
    }

    if (
      lineLower.startsWith(property + separator) ||
      lineLower.startsWith(property + ' ' + separator)
    ) {
      if (lineMatch) {
        result = line;
      } else {
        const parts = line.split(separator);

        if (parts.length > 1) {
          parts.shift();
          result = parts.join(separator).trim();
        }
      }

      return true;
    }

    return false;
  });

  return result;
}
