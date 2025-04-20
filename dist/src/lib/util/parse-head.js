"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHead = parseHead;
/**
 * Parse head output to object
 *
 * @param {string[]} lines - head output lines to parse
 * @param {string} [delimiter=':'] - Delimiter of the head output
 * @param {number} [maxCols=2] - Maximum number of columns
 * @returns {ParseHeadResult} Object with data and title properties
 */
function parseHead(lines, delimiter = ':', maxCols = 2) {
    const result = {
        data: [],
        title: [],
    };
    if (lines && lines.length > 0) {
        const data = [];
        const sepChars = [delimiter, ' ', ' ', ' ', ' ', '='];
        const sepCounts = [];
        // Count separators in each line
        for (const line of lines) {
            sepCounts.push(0);
            for (const sepChar_ of sepChars) {
                // Use standard string iteration
                for (const element of line) {
                    if (element === sepChar_) {
                        sepCounts[sepCounts.length - 1]++;
                    }
                }
            }
        }
        const maxSepCount = Math.max(...sepCounts);
        const maxIndex = sepCounts.indexOf(maxSepCount);
        const sepChar = sepChars[0];
        let cols = 0;
        if (maxSepCount === 0) {
            // Try title header layout
            const titleHeader = [];
            // Use standard array index iteration
            for (const [idx, line] of lines.entries()) {
                if (idx === 0) {
                    const parts = line.split('  ');
                    for (const part of parts) {
                        if (part.trim()) {
                            titleHeader.push(part.trim());
                        }
                    }
                    cols = titleHeader.length;
                    result.title = titleHeader;
                }
                else if (idx === 1) {
                    // Separator line, do nothing
                }
                else {
                    if (cols) {
                        const rowData = [];
                        let line2 = line.trim();
                        for (let i = 0; i < cols; i++) {
                            if (i === cols - 1) {
                                rowData.push(line2.trim());
                            }
                            else {
                                const parts = line2.split('  ');
                                if (parts.length > 0) {
                                    rowData.push(parts[0].trim());
                                    line2 = line2.slice(parts[0].length).trim();
                                }
                                else {
                                    rowData.push('');
                                }
                            }
                        }
                        data.push(rowData);
                    }
                }
            }
        }
        else {
            // Try classic key/value layout
            for (const line of lines) {
                let parts = [];
                parts = line.split(sepChar);
                if (parts.length >= maxCols) {
                    const lineData = [];
                    // Use standard array index iteration
                    for (const [idx, part] of parts.entries()) {
                        if (idx < maxCols - 1) {
                            lineData.push(part.trim());
                        }
                        else {
                            if (idx === maxCols - 1) {
                                lineData.push(part.trim());
                            }
                            else {
                                lineData[lineData.length - 1] = lineData.at(-1) + sepChar + part.trim();
                            }
                        }
                    }
                    data.push(lineData);
                }
            }
        }
        result.data = data;
    }
    return result;
}
exports.default = parseHead;
