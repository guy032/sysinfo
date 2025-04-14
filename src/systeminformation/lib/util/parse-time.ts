import detectSplit from './detect-split';

/**
 * Parse time string to time object
 *
 * @param {string} t - Time string to parse
 * @param {string} [pmDesignator=''] - PM designator string
 * @returns {string} Time in HH:MM format (24h)
 */
export function parseTime(t: string, pmDesignator = ''): string {
  t = t.toUpperCase();
  let hour = 0;
  let min = 0;
  const splitter = detectSplit(t);
  const parts = t.split(splitter[0].toString());

  if (parts.length >= 2) {
    if (parts[2]) {
      parts[1] += parts[2];
    }

    const isPM =
      (parts[1] && parts[1].toLowerCase().includes('pm')) ||
      parts[1].toLowerCase().includes('p.m.') ||
      parts[1].toLowerCase().includes('p. m.') ||
      parts[1].toLowerCase().includes('n') ||
      parts[1].toLowerCase().includes('ch') ||
      parts[1].toLowerCase().includes('ös') ||
      (pmDesignator && parts[1].toLowerCase().includes(pmDesignator));

    hour = Number.parseInt(parts[0], 10);

    if (isPM && hour < 12) {
      hour += 12;
    }

    if (parts[1].toLowerCase().includes('a') && hour === 12) {
      hour = 0;
    }

    min = Number.parseInt(parts[1], 10);

    if (Number.isNaN(min)) {
      min = 0;
    }
  }

  return ('0' + hour).slice(-2) + ':' + ('0' + min).slice(-2);
}

export default parseTime;
