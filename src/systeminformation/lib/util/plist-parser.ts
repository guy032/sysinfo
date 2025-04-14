/**
 * Parse plist XML data into a JavaScript object
 * @param {string} xmlStr - XML string to parse
 * @returns {any} Parsed object
 */
function plistParser(xmlStr: string): any {
  const tags = new Set([
    'array',
    'dict',
    'key',
    'string',
    'integer',
    'date',
    'real',
    'data',
    'boolean',
    'arrayEmpty',
  ]);
  const startStr = '<plist version';

  let pos = xmlStr.indexOf(startStr);
  const len = xmlStr.length;

  while (xmlStr[pos] !== '>' && pos < len) {
    pos++;
  }

  let depth = 0;
  let inTagStart = false;
  let inTagContent = false;
  let inTagEnd = false;
  const metaData: Array<{
    tagStart: string;
    tagEnd: string;
    tagContent: string;
    key: string | null;
    data: any;
  }> = [{ tagStart: '', tagEnd: '', tagContent: '', key: null, data: null }];
  let c = '';
  let cn = xmlStr[pos];

  while (pos < len) {
    c = cn;

    if (pos + 1 < len) {
      cn = xmlStr[pos + 1];
    }

    if (c === '<') {
      inTagContent = false;

      if (cn === '/') {
        inTagEnd = true;
      } else if (metaData[depth].tagStart) {
        metaData[depth].tagContent = '';

        if (!metaData[depth].data) {
          metaData[depth].data = metaData[depth].tagStart === 'array' ? [] : {};
        }

        depth++;
        metaData.push({ tagStart: '', tagEnd: '', tagContent: '', key: null, data: null });
        inTagStart = true;
        inTagContent = false;
      } else if (!inTagStart) {
        inTagStart = true;
      }
    } else if (c === '>') {
      if (metaData[depth].tagStart === 'true/') {
        inTagStart = false;
        inTagEnd = true;
        metaData[depth].tagStart = '';
        metaData[depth].tagEnd = '/boolean';
        metaData[depth].data = true;
      }

      if (metaData[depth].tagStart === 'false/') {
        inTagStart = false;
        inTagEnd = true;
        metaData[depth].tagStart = '';
        metaData[depth].tagEnd = '/boolean';
        metaData[depth].data = false;
      }

      if (metaData[depth].tagStart === 'array/') {
        inTagStart = false;
        inTagEnd = true;
        metaData[depth].tagStart = '';
        metaData[depth].tagEnd = '/arrayEmpty';
        metaData[depth].data = [];
      }

      if (inTagContent) {
        inTagContent = false;
      }

      if (inTagStart) {
        inTagStart = false;
        inTagContent = true;

        if (metaData[depth].tagStart === 'array') {
          metaData[depth].data = [];
        }

        if (metaData[depth].tagStart === 'dict') {
          metaData[depth].data = {};
        }
      }

      if (inTagEnd) {
        inTagEnd = false;

        if (metaData[depth].tagEnd && tags.has(metaData[depth].tagEnd.slice(1))) {
          if (metaData[depth].tagEnd === '/dict' || metaData[depth].tagEnd === '/array') {
            if (depth > 1 && metaData[depth - 2].tagStart === 'array') {
              metaData[depth - 2].data.push(metaData[depth - 1].data);
            }

            if (depth > 1 && metaData[depth - 2].tagStart === 'dict' && metaData[depth - 1].key) {
              metaData[depth - 2].data[metaData[depth - 1].key as string] =
                metaData[depth - 1].data;
            }

            depth--;
            metaData.pop();
            metaData[depth].tagContent = '';
            metaData[depth].tagStart = '';
            metaData[depth].tagEnd = '';
          } else {
            if (metaData[depth].tagEnd === '/key' && metaData[depth].tagContent) {
              metaData[depth].key = metaData[depth].tagContent;
            } else {
              if (metaData[depth].tagEnd === '/real' && metaData[depth].tagContent) {
                metaData[depth].data = Number.parseFloat(metaData[depth].tagContent) || 0;
              }

              if (metaData[depth].tagEnd === '/integer' && metaData[depth].tagContent) {
                metaData[depth].data = Number.parseInt(metaData[depth].tagContent, 10) || 0;
              }

              if (metaData[depth].tagEnd === '/string' && metaData[depth].tagContent) {
                metaData[depth].data = metaData[depth].tagContent || '';
              }

              if (metaData[depth].tagEnd === '/boolean') {
                metaData[depth].data = metaData[depth].tagContent || false;
              }

              if (metaData[depth].tagEnd === '/arrayEmpty') {
                metaData[depth].data = metaData[depth].tagContent || [];
              }

              if (depth > 0 && metaData[depth - 1].tagStart === 'array') {
                metaData[depth - 1].data.push(metaData[depth].data);
              }

              if (depth > 0 && metaData[depth - 1].tagStart === 'dict' && metaData[depth].key) {
                metaData[depth - 1].data[metaData[depth].key as string] = metaData[depth].data;
              }
            }

            metaData[depth].tagContent = '';
            metaData[depth].tagStart = '';
            metaData[depth].tagEnd = '';
          }
        }

        metaData[depth].tagEnd = '';
        inTagStart = false;
        inTagContent = false;
      }
    } else {
      if (inTagStart) {
        metaData[depth].tagStart += c;
      }

      if (inTagEnd) {
        metaData[depth].tagEnd += c;
      }

      if (inTagContent) {
        metaData[depth].tagContent += c;
      }
    }

    pos++;
  }

  return metaData[0].data;
}

/**
 * Checks if a string is numeric
 * @param {any} str - String to check
 * @returns {boolean} True if numeric
 */
function strIsNumeric(str: any): boolean {
  return (
    typeof str === 'string' && !Number.isNaN(Number(str)) && !Number.isNaN(Number.parseFloat(str))
  );
}

/**
 * Parse plist output format into a JavaScript object
 * @param {string} output - Plist output to parse
 * @returns {any} Parsed object
 */
function plistReader(output: string): any {
  const lines = output.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(' = ')) {
      const lineParts = lines[i].split(' = ');
      lineParts[0] = lineParts[0].trim();

      if (!lineParts[0].startsWith('"')) {
        lineParts[0] = '"' + lineParts[0] + '"';
      }

      lineParts[1] = lineParts[1].trim();

      if (!lineParts[1].includes('"') && lineParts[1].endsWith(';')) {
        const valueString = lineParts[1].slice(0, Math.max(0, lineParts[1].length - 1));

        if (!strIsNumeric(valueString)) {
          lineParts[1] = `"${valueString}";`;
        }
      }

      if (lineParts[1].includes('"') && lineParts[1].endsWith(';')) {
        const valueString = lineParts[1]
          .slice(0, Math.max(0, lineParts[1].length - 1))
          .replaceAll('"', '');

        if (strIsNumeric(valueString)) {
          lineParts[1] = `${valueString};`;
        }
      }

      lines[i] = lineParts.join(' : ');
    }

    lines[i] = lines[i].replaceAll('(', '[').replaceAll(')', ']').replaceAll(';', ',').trim();

    if (lines[i].startsWith('}') && lines[i - 1] && lines[i - 1].endsWith(',')) {
      lines[i - 1] = lines[i - 1].slice(0, Math.max(0, lines[i - 1].length - 1));
    }
  }

  output = lines.join('');
  let obj = {};

  try {
    obj = JSON.parse(output);
  } catch {
    // Silently fail and return empty object
  }

  return obj;
}

export { plistParser, plistReader, strIsNumeric };
export default plistParser;
