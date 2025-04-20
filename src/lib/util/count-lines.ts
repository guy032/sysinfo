/**
 * Count lines that start with a specific string
 *
 * @param {string[]} lines - Array of lines to check
 * @param {string} [startingWith=''] - String that lines should start with
 * @returns {number} Count of lines
 */
export function countLines(lines: string[], startingWith = ''): number {
  const matchingLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith(startingWith)) {
      matchingLines.push(line);
    }
  }

  return matchingLines.length;
}

export default countLines;
