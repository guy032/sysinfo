import parseTime from './parse-time';

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
export function parseDateTime(dt: string, culture = ''): ParsedDateTime {
  const result: ParsedDateTime = {};

  // Culture: DE
  const pmDesignator = '';
  const dateFormat = culture === 'DE' ? 'dd.mm.yyyy' : 'mm/dd/yyyy';

  // Detect German date format
  if ((dt && dt.includes('.')) || culture === 'DE') {
    const parts = dt.split(' ');

    if (parts.length === 2) {
      // Date
      const dtparts = parts[0].split('.');

      if (dtparts.length === 3) {
        result.date =
          dtparts[2].length === 2
            ? '20' +
              dtparts[2] +
              '-' +
              ('0' + dtparts[1]).slice(-2) +
              '-' +
              ('0' + dtparts[0]).slice(-2)
            : dtparts[2] + '-' + ('0' + dtparts[1]).slice(-2) + '-' + ('0' + dtparts[0]).slice(-2);
      }

      // Time
      result.time = parseTime(parts[1], pmDesignator);
    }
  } else if (dt && dt.includes('/')) {
    // Culture: EN - MM/DD/YYYY and MM/DD/YY
    const parts = dt.split(' ');

    if (parts.length === 2) {
      // Date
      const dtparts = parts[0].split('/');

      if (dtparts.length === 3) {
        if (dtparts[2].length === 4) {
          result.date =
            dtparts[2] + '-' + ('0' + dtparts[0]).slice(-2) + '-' + ('0' + dtparts[1]).slice(-2);
        } else if (dtparts[2].length === 2) {
          // Format depends on dateFormat pattern (/d/ or /dd/ indicates mm/dd/yy, otherwise dd/mm/yy)
          result.date =
            '20' +
            dtparts[2] +
            '-' +
            (dateFormat.includes('/d/') || dateFormat.includes('/dd/')
              ? ('0' + dtparts[0]).slice(-2) + '-' + ('0' + dtparts[1]).slice(-2)
              : ('0' + dtparts[1]).slice(-2) + '-' + ('0' + dtparts[0]).slice(-2));
        } else {
          // Dateformat: mm/dd/yyyy or dd/mm/yyyy
          const isEN =
            dt.toLowerCase().includes('am') ||
            dt.toLowerCase().includes('pm') ||
            dt.toLowerCase().includes('a.m.') ||
            dt.toLowerCase().includes('p.m.') ||
            dt.toLowerCase().includes('a. m.') ||
            dt.toLowerCase().includes('p. m.') ||
            dt.toLowerCase().includes('a.m') ||
            dt.toLowerCase().includes('p.m') ||
            dt.toLowerCase().includes('a. m') ||
            dt.toLowerCase().includes('p. m');

          // Determine format based on isEN flag and dateFormat pattern
          result.date =
            dtparts[2] +
            '-' +
            ((isEN || dateFormat.includes('/d/') || dateFormat.includes('/dd/')) &&
            dateFormat.indexOf('dd/') !== 0
              ? ('0' + dtparts[0]).slice(-2) + '-' + ('0' + dtparts[1]).slice(-2)
              : ('0' + dtparts[1]).slice(-2) + '-' + ('0' + dtparts[0]).slice(-2));
        }
      }

      // Time
      result.time = parseTime(parts[1], pmDesignator);
    }
  }

  return result;
}

export default parseDateTime;
