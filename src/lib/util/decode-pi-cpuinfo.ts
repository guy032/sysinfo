import getValue from './get-value';
import hex2bin from './hex2bin';

// Cache Raspberry Pi CPU info
let _rpi_cpuinfo: string[] | null = null;

/**
 * Raspberry Pi revision code lookup result
 */
interface PiInfo {
  model: string;
  serial: string;
  revisionCode: string;
  memory: number;
  manufacturer: string;
  processor: string;
  type: string;
  revision: string;
}

/**
 * Decode Raspberry Pi CPU info
 *
 * @param {string[]} [lines] - CPU info from /proc/cpuinfo or cached info
 * @returns {PiInfo} Decoded Raspberry Pi information
 */
export function decodePiCpuinfo(lines?: string[]): PiInfo {
  if (_rpi_cpuinfo === null) {
    _rpi_cpuinfo = lines || [];
  } else if (lines === undefined) {
    lines = _rpi_cpuinfo;
  }

  // https://www.raspberrypi.org/documentation/hardware/raspberrypi/revision-codes/README.md

  const oldRevisionCodes: Record<string, Omit<PiInfo, 'model' | 'serial' | 'revisionCode'>> = {
    '0002': {
      type: 'B',
      revision: '1.0',
      memory: 256,
      manufacturer: 'Egoman',
      processor: 'BCM2835',
    },
    '0003': {
      type: 'B',
      revision: '1.0',
      memory: 256,
      manufacturer: 'Egoman',
      processor: 'BCM2835',
    },
    '0004': {
      type: 'B',
      revision: '2.0',
      memory: 256,
      manufacturer: 'Sony UK',
      processor: 'BCM2835',
    },
    '0005': {
      type: 'B',
      revision: '2.0',
      memory: 256,
      manufacturer: 'Qisda',
      processor: 'BCM2835',
    },
    '0006': {
      type: 'B',
      revision: '2.0',
      memory: 256,
      manufacturer: 'Egoman',
      processor: 'BCM2835',
    },
    '0007': {
      type: 'A',
      revision: '2.0',
      memory: 256,
      manufacturer: 'Egoman',
      processor: 'BCM2835',
    },
    '0008': {
      type: 'A',
      revision: '2.0',
      memory: 256,
      manufacturer: 'Sony UK',
      processor: 'BCM2835',
    },
    '0009': {
      type: 'A',
      revision: '2.0',
      memory: 256,
      manufacturer: 'Qisda',
      processor: 'BCM2835',
    },
    '000d': {
      type: 'B',
      revision: '2.0',
      memory: 512,
      manufacturer: 'Egoman',
      processor: 'BCM2835',
    },
    '000e': {
      type: 'B',
      revision: '2.0',
      memory: 512,
      manufacturer: 'Sony UK',
      processor: 'BCM2835',
    },
    '000f': {
      type: 'B',
      revision: '2.0',
      memory: 512,
      manufacturer: 'Egoman',
      processor: 'BCM2835',
    },
    '0010': {
      type: 'B+',
      revision: '1.2',
      memory: 512,
      manufacturer: 'Sony UK',
      processor: 'BCM2835',
    },
    '0011': {
      type: 'CM1',
      revision: '1.0',
      memory: 512,
      manufacturer: 'Sony UK',
      processor: 'BCM2835',
    },
    '0012': {
      type: 'A+',
      revision: '1.1',
      memory: 256,
      manufacturer: 'Sony UK',
      processor: 'BCM2835',
    },
    '0013': {
      type: 'B+',
      revision: '1.2',
      memory: 512,
      manufacturer: 'Embest',
      processor: 'BCM2835',
    },
    '0014': {
      type: 'CM1',
      revision: '1.0',
      memory: 512,
      manufacturer: 'Embest',
      processor: 'BCM2835',
    },
    '0015': {
      type: 'A+',
      revision: '1.1',
      memory: 256,
      manufacturer: '512MB	Embest',
      processor: 'BCM2835',
    },
  };

  const processorList = ['BCM2835', 'BCM2836', 'BCM2837', 'BCM2711', 'BCM2712'];
  const manufacturerList = ['Sony UK', 'Egoman', 'Embest', 'Sony Japan', 'Embest', 'Stadium'];
  const typeList: Record<string, string> = {
    '00': 'A',
    '01': 'B',
    '02': 'A+',
    '03': 'B+',
    '04': '2B',
    '05': 'Alpha (early prototype)',
    '06': 'CM1',
    '08': '3B',
    '09': 'Zero',
    '0a': 'CM3',
    '0c': 'Zero W',
    '0d': '3B+',
    '0e': '3A+',
    '0f': 'Internal use only',
    '10': 'CM3+',
    '11': '4B',
    '12': 'Zero 2 W',
    '13': '400',
    '14': 'CM4',
    '15': 'CM4S',
    '16': 'Internal use only',
    '17': '5',
    '18': 'CM5',
    '19': '500',
    '1a': 'CM5 Lite',
  };

  const revisionCode = getValue(lines || [], 'revision', ':', true);
  const model = getValue(lines || [], 'model:', ':', true);
  const serial = getValue(lines || [], 'serial', ':', true);

  let result: PiInfo = {
    model: '',
    serial: '',
    revisionCode: '',
    memory: 0,
    manufacturer: '',
    processor: '',
    type: '',
    revision: '',
  };

  if (Object.prototype.hasOwnProperty.call(oldRevisionCodes, revisionCode)) {
    // old revision codes
    const oldInfo = oldRevisionCodes[revisionCode];
    result = {
      model,
      serial,
      revisionCode,
      memory: oldInfo.memory,
      manufacturer: oldInfo.manufacturer,
      processor: oldInfo.processor,
      type: oldInfo.type,
      revision: oldInfo.revision,
    };
  } else {
    // new revision code
    const revision = (
      '00000000' + getValue(lines || [], 'revision', ':', true).toLowerCase()
    ).slice(-8);
    const memSizeCode = Number.parseInt(hex2bin(revision.slice(2, 3)).slice(5, 8), 2) || 0;
    const manufacturer = manufacturerList[Number.parseInt(revision.slice(3, 4), 10)] || '';
    const processor = processorList[Number.parseInt(revision.slice(4, 5), 10)] || '';
    const typeCode = revision.slice(5, 7);

    result = {
      model,
      serial,
      revisionCode,
      memory: 256 * Math.pow(2, memSizeCode),
      manufacturer,
      processor,
      type: Object.prototype.hasOwnProperty.call(typeList, typeCode) ? typeList[typeCode] : '',
      revision: '1.' + revision.slice(7, 8),
    };
  }

  return result;
}

export default decodePiCpuinfo;
