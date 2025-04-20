/**
 * Count unique lines that start with a specific string
 *
 * @param {string[]} lines - Array of lines to check
 * @param {string} [startingWith=''] - String that lines should start with
 * @returns {number} Count of unique lines
 */
export function countUniqueLines(lines: string[], startingWith = ''): number {
  const uniqueLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith(startingWith) && !uniqueLines.includes(line)) {
      uniqueLines.push(line);
    }
  }

  return uniqueLines.length;
}

export default countUniqueLines;
