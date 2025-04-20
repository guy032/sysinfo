// ==================================================================================
// wifi.ts
// ----------------------------------------------------------------------------------
// Description:   System Information - library
//                for Node.js
// Copyright:     (c) 2014 - 2025
// Author:        Sebastian Hildebrandt
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 9. wifi
// ----------------------------------------------------------------------------------
import { exec, execSync } from 'child_process';
import * as util from '../util';
import { getPlatformFlagsFromOptions } from '../util/platform';
// Frequency map
const _wifi_frequencies = {
    1: 2412,
    2: 2417,
    3: 2422,
    4: 2427,
    5: 2432,
    6: 2437,
    7: 2442,
    8: 2447,
    9: 2452,
    10: 2457,
    11: 2462,
    12: 2467,
    13: 2472,
    14: 2484,
    32: 5160,
    34: 5170,
    36: 5180,
    38: 5190,
    40: 5200,
    42: 5210,
    44: 5220,
    46: 5230,
    48: 5240,
    50: 5250,
    52: 5260,
    54: 5270,
    56: 5280,
    58: 5290,
    60: 5300,
    62: 5310,
    64: 5320,
    68: 5340,
    96: 5480,
    100: 5500,
    102: 5510,
    104: 5520,
    106: 5530,
    108: 5540,
    110: 5550,
    112: 5560,
    114: 5570,
    116: 5580,
    118: 5590,
    120: 5600,
    122: 5610,
    124: 5620,
    126: 5630,
    128: 5640,
    132: 5660,
    134: 5670,
    136: 5680,
    138: 5690,
    140: 5700,
    142: 5710,
    144: 5720,
    149: 5745,
    151: 5755,
    153: 5765,
    155: 5775,
    157: 5785,
    159: 5795,
    161: 5805,
    165: 5825,
    169: 5845,
    173: 5865,
    183: 4915,
    184: 4920,
    185: 4925,
    187: 4935,
    188: 4940,
    189: 4945,
    192: 4960,
    196: 4980,
};
/**
 * Calculate wireless dB value from quality
 * @param quality Wireless link quality in percent
 * @returns Signal level in dB
 */
function wifiDBFromQuality(quality) {
    const qual = Number.parseFloat(quality);
    if (qual < 0) {
        return 0;
    }
    if (qual >= 100) {
        return -50;
    }
    return qual / 2 - 100;
}
/**
 * Calculate wireless quality from dB value
 * @param db Signal level in dB
 * @returns Wireless link quality in percent
 */
function wifiQualityFromDB(db) {
    const result = 2 * (Number.parseFloat(db) + 100);
    return result <= 100 ? result : 100;
}
/**
 * Get frequency for wifi channel
 * @param channel Channel number
 * @returns Frequency in MHz
 */
function wifiFrequencyFromChannel(channel) {
    const channelNum = Number(channel);
    return _wifi_frequencies[channelNum] === undefined ? null : _wifi_frequencies[channelNum];
}
/**
 * Get channel from frequency
 * @param frequency Frequency in MHz
 * @returns Channel number
 */
function wifiChannelFromFrequency(frequency) {
    let channel = 0;
    for (const key in _wifi_frequencies) {
        if (Object.prototype.hasOwnProperty.call(_wifi_frequencies, key) &&
            _wifi_frequencies[key] === frequency) {
            channel = util.toInt(key);
        }
    }
    return channel;
}
/**
 * Get list of Linux wireless interfaces
 * @returns Array of wireless interfaces
 */
function ifaceListLinux() {
    const result = [];
    const cmd = 'iw dev 2>/dev/null';
    try {
        const all = execSync(cmd, util.execOptsLinux)
            .toString()
            .split('\n')
            .map((line) => line.trim())
            .join('\n');
        const parts = all.split('\nInterface ');
        parts.shift();
        for (const ifaceDetails of parts) {
            const lines = ifaceDetails.split('\n');
            const iface = lines[0];
            const id = util.toInt(util.getValue(lines, 'ifindex', ' '));
            const mac = util.getValue(lines, 'addr', ' ');
            const channel = util.toInt(util.getValue(lines, 'channel', ' '));
            result.push({
                id,
                iface,
                mac,
                channel,
            });
        }
        return result;
    }
    catch {
        try {
            const all = execSync('nmcli -t -f general,wifi-properties,wired-properties,interface-flags,capabilities,nsp device show 2>/dev/null', util.execOptsLinux).toString();
            const parts = all.split('\n\n');
            let i = 1;
            for (const ifaceDetails of parts) {
                const lines = ifaceDetails.split('\n');
                const iface = util.getValue(lines, 'GENERAL.DEVICE');
                const type = util.getValue(lines, 'GENERAL.TYPE');
                const id = i++; // // util.getValue(lines, 'GENERAL.PATH');
                const mac = util.getValue(lines, 'GENERAL.HWADDR');
                if (type.toLowerCase() === 'wifi') {
                    result.push({
                        id,
                        iface,
                        mac,
                        channel: 0,
                    });
                }
            }
            return result;
        }
        catch {
            return [];
        }
    }
}
/**
 * Get NetworkManager information for a device
 * @param iface Interface name
 * @returns Device information
 */
function nmiDeviceLinux(iface) {
    const cmd = `nmcli -t -f general,wifi-properties,capabilities,ip4,ip6 device show ${iface} 2> /dev/null`;
    try {
        const lines = execSync(cmd, util.execOptsLinux).toString().split('\n');
        const ssid = util.getValue(lines, 'GENERAL.CONNECTION');
        return {
            iface,
            type: util.getValue(lines, 'GENERAL.TYPE'),
            vendor: util.getValue(lines, 'GENERAL.VENDOR'),
            product: util.getValue(lines, 'GENERAL.PRODUCT'),
            mac: util.getValue(lines, 'GENERAL.HWADDR').toLowerCase(),
            ssid: ssid === '--' ? null : ssid,
        };
    }
    catch {
        return {};
    }
}
/**
 * Get NetworkManager connection information
 * @param ssid SSID of the network
 * @returns Connection information
 */
function nmiConnectionLinux(ssid) {
    const cmd = `nmcli -t --show-secrets connection show ${ssid} 2>/dev/null`;
    try {
        const lines = execSync(cmd, util.execOptsLinux).toString().split('\n');
        const bssid = util.getValue(lines, '802-11-wireless.seen-bssids').toLowerCase();
        return {
            ssid: ssid === '--' ? null : ssid,
            uuid: util.getValue(lines, 'connection.uuid'),
            type: util.getValue(lines, 'connection.type'),
            autoconnect: util.getValue(lines, 'connection.autoconnect') === 'yes',
            security: util.getValue(lines, '802-11-wireless-security.key-mgmt'),
            bssid: bssid === '--' ? null : bssid,
        };
    }
    catch {
        return {};
    }
}
/**
 * Get WPA connection information
 * @param iface Interface name
 * @returns WPA connection information
 */
function wpaConnectionLinux(iface) {
    if (!iface) {
        return {};
    }
    const cmd = `wpa_cli -i ${iface} status 2>&1`;
    try {
        const lines = execSync(cmd, util.execOptsLinux).toString().split('\n');
        const freq = util.toInt(util.getValue(lines, 'freq', '='));
        return {
            ssid: util.getValue(lines, 'ssid', '='),
            uuid: util.getValue(lines, 'uuid', '='),
            security: util.getValue(lines, 'key_mgmt', '='),
            freq,
            channel: wifiChannelFromFrequency(freq),
            bssid: util.getValue(lines, 'bssid', '=').toLowerCase(),
        };
    }
    catch {
        return {};
    }
}
/**
 * Get wifi networks using NetworkManager
 * @returns Array of wifi networks
 */
function getWifiNetworkListNmi() {
    const result = [];
    const cmd = 'nmcli -t -m multiline --fields active,ssid,bssid,mode,chan,freq,signal,security,wpa-flags,rsn-flags device wifi list 2>/dev/null';
    try {
        const stdout = execSync(cmd, util.execOptsLinux);
        const parts = stdout.toString().split('ACTIVE:');
        parts.shift();
        for (let part of parts) {
            part = 'ACTIVE:' + part;
            const lines = part.split('\r\n');
            const channel = util.getValue(lines, 'CHAN');
            const frequency = util.getValue(lines, 'FREQ').toLowerCase().replace('mhz', '').trim();
            const security = util.getValue(lines, 'SECURITY').replace('(', '').replace(')', '');
            const wpaFlags = util.getValue(lines, 'WPA-FLAGS').replace('(', '').replace(')', '');
            const rsnFlags = util.getValue(lines, 'RSN-FLAGS').replace('(', '').replace(')', '');
            const quality = util.getValue(lines, 'SIGNAL');
            result.push({
                ssid: util.getValue(lines, 'SSID'),
                bssid: util.getValue(lines, 'BSSID').toLowerCase(),
                mode: util.getValue(lines, 'MODE'),
                channel: channel ? Number.parseInt(channel, 10) : null,
                frequency: frequency ? Number.parseInt(frequency, 10) : null,
                signalLevel: wifiDBFromQuality(quality),
                quality: quality ? Number.parseInt(quality, 10) : null,
                security: security && security !== 'none' ? security.split(' ') : [],
                wpaFlags: wpaFlags && wpaFlags !== 'none' ? wpaFlags.split(' ') : [],
                rsnFlags: rsnFlags && rsnFlags !== 'none' ? rsnFlags.split(' ') : [],
            });
        }
        return result;
    }
    catch {
        return [];
    }
}
/**
 * Get wifi networks using iwlist
 * @param iface Interface name
 * @returns Array of wifi networks or -1 if resource busy
 */
function getWifiNetworkListIw(iface) {
    const result = [];
    try {
        const iwlistParts = execSync(`export LC_ALL=C; iwlist ${iface} scan 2>&1; unset LC_ALL`, util.execOptsLinux)
            .toString()
            .split('        Cell ');
        if (iwlistParts[0].includes('resource busy')) {
            return -1;
        }
        if (iwlistParts.length > 1) {
            iwlistParts.shift();
            for (const element of iwlistParts) {
                const lines = element.split('\n');
                const channel = util.getValue(lines, 'channel', ':', true);
                const address = lines && lines.length > 0 && lines[0].includes('Address:')
                    ? lines[0].split('Address:')[1].trim().toLowerCase()
                    : '';
                const mode = util.getValue(lines, 'mode', ':', true);
                const frequency = util.getValue(lines, 'frequency', ':', true);
                const qualityString = util.getValue(lines, 'Quality', '=', true);
                const dbParts = qualityString.toLowerCase().split('signal level=');
                const db = dbParts.length > 1 ? util.toInt(dbParts[1]) : 0;
                const quality = db ? wifiQualityFromDB(db) : 0;
                const ssid = util.getValue(lines, 'essid', ':', true);
                // security and wpa-flags
                const isWpa = element.includes(' WPA ');
                const isWpa2 = element.includes('WPA2 ');
                const security = [];
                if (isWpa) {
                    security.push('WPA');
                }
                if (isWpa2) {
                    security.push('WPA2');
                }
                const wpaFlags = [];
                let wpaFlag = '';
                for (const line of lines) {
                    const l = line.trim().toLowerCase();
                    if (l.includes('group cipher')) {
                        if (wpaFlag) {
                            wpaFlags.push(wpaFlag);
                        }
                        const parts = l.split(':');
                        if (parts.length > 1) {
                            wpaFlag = parts[1].trim().toUpperCase();
                        }
                    }
                    if (l.includes('pairwise cipher')) {
                        const parts = l.split(':');
                        if (parts.length > 1) {
                            if (parts[1].indexOf('tkip')) {
                                wpaFlag = wpaFlag ? 'TKIP/' + wpaFlag : 'TKIP';
                            }
                            else if (parts[1].indexOf('ccmp')) {
                                wpaFlag = wpaFlag ? 'CCMP/' + wpaFlag : 'CCMP';
                            }
                            else if (parts[1].indexOf('proprietary')) {
                                wpaFlag = wpaFlag ? 'PROP/' + wpaFlag : 'PROP';
                            }
                        }
                    }
                    if (l.includes('authentication suites')) {
                        const parts = l.split(':');
                        if (parts.length > 1) {
                            if (parts[1].indexOf('802.1x')) {
                                wpaFlag = wpaFlag ? '802.1x/' + wpaFlag : '802.1x';
                            }
                            else if (parts[1].indexOf('psk')) {
                                wpaFlag = wpaFlag ? 'PSK/' + wpaFlag : 'PSK';
                            }
                        }
                    }
                }
                if (wpaFlag) {
                    wpaFlags.push(wpaFlag);
                }
                result.push({
                    ssid,
                    bssid: address,
                    mode,
                    channel: channel ? util.toInt(channel) : null,
                    frequency: frequency ? util.toInt(frequency.replace('.', '')) : null,
                    signalLevel: db,
                    quality,
                    security,
                    wpaFlags,
                    rsnFlags: [],
                });
            }
        }
        return result;
    }
    catch {
        return -1;
    }
}
/**
 * Parse Darwin/macOS wifi data (older macOS versions)
 * @param wifiObj JSON object with wifi data
 * @returns Array of wifi networks
 */
function parseWifiDarwinXX(wifiObj) {
    const result = [];
    if (wifiObj) {
        for (const wifiItem of wifiObj) {
            const signalLevel = wifiItem.RSSI;
            const security = [];
            const wpaFlags = [];
            let ssid = wifiItem.SSID_STR || '';
            if (wifiItem.WPA_IE) {
                for (const ciphers of wifiItem.WPA_IE.IE_KEY_WPA_UCIPHERS) {
                    if (ciphers === 0 && !wpaFlags.includes('unknown/TKIP')) {
                        wpaFlags.push('unknown/TKIP');
                    }
                    if (ciphers === 2 && !wpaFlags.includes('PSK/TKIP')) {
                        wpaFlags.push('PSK/TKIP');
                    }
                    if (ciphers === 4 && !wpaFlags.includes('PSK/AES')) {
                        wpaFlags.push('PSK/AES');
                    }
                }
            }
            if (wifiItem.RSN_IE) {
                for (const ciphers of wifiItem.RSN_IE.IE_KEY_RSN_UCIPHERS) {
                    if (ciphers === 0 && !wpaFlags.includes('unknown/TKIP')) {
                        wpaFlags.push('unknown/TKIP');
                    }
                    if (ciphers === 2 && !wpaFlags.includes('TKIP/TKIP')) {
                        wpaFlags.push('TKIP/TKIP');
                    }
                    if (ciphers === 4 && !wpaFlags.includes('PSK/AES')) {
                        wpaFlags.push('PSK/AES');
                    }
                }
            }
            if (wifiItem.SSID && ssid === '') {
                try {
                    ssid = Buffer.from(wifiItem.SSID, 'base64').toString('utf8');
                }
                catch {
                    util.noop();
                }
            }
            result.push({
                ssid,
                bssid: wifiItem.BSSID || '',
                mode: '',
                channel: wifiItem.CHANNEL,
                frequency: wifiFrequencyFromChannel(wifiItem.CHANNEL),
                signalLevel: signalLevel ? Number.parseInt(signalLevel, 10) : null,
                quality: wifiQualityFromDB(signalLevel),
                security,
                wpaFlags,
                rsnFlags: [],
            });
        }
    }
    return result;
}
/**
 * Parse Darwin/macOS wifi data (newer macOS versions)
 * @param wifiStr JSON string with wifi data
 * @returns Array of wifi networks
 */
function parseWifiDarwin(wifiStr) {
    const result = [];
    try {
        let wifiObj = JSON.parse(wifiStr);
        wifiObj =
            wifiObj.SPAirPortDataType[0].spairport_airport_interfaces[0]
                .spairport_airport_other_local_wireless_networks;
        for (const wifiItem of wifiObj) {
            const security = [];
            const sm = wifiItem.spairport_security_mode;
            if (sm === 'spairport_security_mode_wep') {
                security.push('WEP');
            }
            else if (sm === 'spairport_security_mode_wpa2_personal') {
                security.push('WPA2');
            }
            else if (sm.startsWith('spairport_security_mode_wpa2_enterprise')) {
                security.push('WPA2 EAP');
            }
            else if (sm.startsWith('pairport_security_mode_wpa3_transition')) {
                security.push('WPA2/WPA3');
            }
            else if (sm.startsWith('pairport_security_mode_wpa3')) {
                security.push('WPA3');
            }
            const channel = Number.parseInt(String(wifiItem.spairport_network_channel).split(' ')[0], 10) || 0;
            const signalLevel = wifiItem.spairport_signal_noise || null;
            result.push({
                ssid: wifiItem._name || '',
                bssid: wifiItem.spairport_network_bssid || null,
                mode: wifiItem.spairport_network_phymode,
                channel,
                frequency: wifiFrequencyFromChannel(channel),
                signalLevel: signalLevel ? Number.parseInt(signalLevel, 10) : null,
                quality: wifiQualityFromDB(signalLevel),
                security,
                wpaFlags: [],
                rsnFlags: [],
            });
        }
        return result;
    }
    catch {
        return result;
    }
}
/**
 * Get vendor information from model string
 * @param model Model string
 * @returns Vendor name
 */
function getVendor(model) {
    model = model.toLowerCase();
    let result = '';
    if (model.includes('intel')) {
        result = 'Intel';
    }
    else if (model.includes('realtek')) {
        result = 'Realtek';
    }
    else if (model.includes('qualcom')) {
        result = 'Qualcom';
    }
    else if (model.includes('broadcom')) {
        result = 'Broadcom';
    }
    else if (model.includes('cavium')) {
        result = 'Cavium';
    }
    else if (model.includes('cisco')) {
        result = 'Cisco';
    }
    else if (model.includes('marvel')) {
        result = 'Marvel';
    }
    else if (model.includes('zyxel')) {
        result = 'Zyxel';
    }
    else if (model.includes('melanox')) {
        result = 'Melanox';
    }
    else if (model.includes('d-link')) {
        result = 'D-Link';
    }
    else if (model.includes('tp-link')) {
        result = 'TP-Link';
    }
    else if (model.includes('asus')) {
        result = 'Asus';
    }
    else if (model.includes('linksys')) {
        result = 'Linksys';
    }
    return result;
}
/**
 * Format BSSID string
 * @param s Input string
 * @returns Formatted BSSID
 */
function formatBssid(s) {
    s = s.replaceAll('<', '').replaceAll('>', '');
    const parts = s.match(/.{1,2}/g) || [];
    return parts.join(':');
}
/**
 * Get all available wifi networks
 * @param options Optional parameters
 * @param callback Optional callback function
 * @returns Promise resolving to array of wifi networks
 */
export function wifiNetworks(options = {}, callback) {
    const platformFlags = getPlatformFlagsFromOptions(options);
    return new Promise((resolve) => {
        process.nextTick(() => {
            let result = [];
            if (platformFlags._linux) {
                result = getWifiNetworkListNmi();
                if (result.length === 0) {
                    try {
                        const iwconfigParts = execSync('export LC_ALL=C; iwconfig 2>/dev/null; unset LC_ALL', util.execOptsLinux)
                            .toString()
                            .split('\n\n');
                        let iface = '';
                        for (const element of iwconfigParts) {
                            if (!element.includes('no wireless') && element.trim() !== '') {
                                iface = element.split(' ')[0];
                            }
                        }
                        if (iface) {
                            let ifaceSanitized = '';
                            const s = util.isPrototypePolluted() ? '---' : util.sanitizeShellString(iface, true);
                            const l = Math.min(s.length, 2000);
                            for (let i = 0; i <= l; i++) {
                                if (s[i] !== undefined) {
                                    ifaceSanitized = ifaceSanitized + s[i];
                                }
                            }
                            const res = getWifiNetworkListIw(ifaceSanitized);
                            if (res === -1) {
                                // try again after 4 secs
                                const timeoutCallback = function (iface) {
                                    const res = getWifiNetworkListIw(iface);
                                    if (res !== -1) {
                                        result = res;
                                    }
                                    if (callback) {
                                        callback(result);
                                    }
                                    resolve(result);
                                };
                                setTimeout(timeoutCallback, 4000, ifaceSanitized);
                                return;
                            }
                            result = res;
                            if (callback) {
                                callback(result);
                            }
                            resolve(result);
                            return;
                        }
                    }
                    catch {
                        // Continue with empty result
                    }
                }
            }
            else if (platformFlags._darwin) {
                const cmd = 'system_profiler SPAirPortDataType -json 2>/dev/null';
                exec(cmd, { maxBuffer: 1024 * 40_000 }, function (error, stdout) {
                    result = parseWifiDarwin(stdout.toString());
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
                return;
            }
            else if (platformFlags._windows) {
                const cmd = 'netsh wlan show networks mode=Bssid';
                util.powerShell(cmd, options).then((stdout) => {
                    const ssidParts = stdout.toString().split('\r\n\r\nSSID ');
                    ssidParts.shift();
                    for (const ssidPart of ssidParts) {
                        const ssidLines = ssidPart.split('\r\n');
                        if (ssidLines && ssidLines.length >= 8 && ssidLines[0].includes(':')) {
                            const bssidsParts = ssidPart.split(' BSSID');
                            bssidsParts.shift();
                            for (const bssidPart of bssidsParts) {
                                const bssidLines = bssidPart.split('\r\n');
                                const bssidLine = bssidLines[0].split(':');
                                bssidLine.shift();
                                const bssid = bssidLine.join(':').trim().toLowerCase();
                                const channel = bssidLines[3].split(':').pop()?.trim() || '';
                                const quality = bssidLines[1].split(':').pop()?.trim() || '';
                                result.push({
                                    ssid: ssidLines[0].split(':').pop()?.trim() || '',
                                    bssid,
                                    mode: '',
                                    channel: channel ? Number.parseInt(channel, 10) : null,
                                    frequency: wifiFrequencyFromChannel(channel),
                                    signalLevel: wifiDBFromQuality(quality),
                                    quality: quality ? Number.parseInt(quality, 10) : null,
                                    security: [ssidLines[2].split(':').pop()?.trim() || ''],
                                    wpaFlags: [ssidLines[3].split(':').pop()?.trim() || ''],
                                    rsnFlags: [],
                                });
                            }
                        }
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
                return;
            }
            if (callback) {
                callback(result);
            }
            resolve(result);
        });
    });
}
/**
 * Get active wifi connections
 * @param options Optional parameters
 * @param callback Optional callback function
 * @returns Promise resolving to array of wifi connections
 */
export function wifiConnections(options = {}, callback) {
    const platformFlags = getPlatformFlagsFromOptions(options);
    return new Promise((resolve) => {
        process.nextTick(() => {
            const result = [];
            if (platformFlags._linux) {
                const ifaces = ifaceListLinux();
                const networkList = getWifiNetworkListNmi();
                for (const ifaceDetail of ifaces) {
                    let ifaceSanitized = '';
                    const s = util.isPrototypePolluted()
                        ? '---'
                        : util.sanitizeShellString(ifaceDetail.iface, true);
                    const ll = Math.min(s.length, 2000);
                    for (let i = 0; i <= ll; i++) {
                        if (s[i] !== undefined) {
                            ifaceSanitized = ifaceSanitized + s[i];
                        }
                    }
                    const nmiDetails = nmiDeviceLinux(ifaceSanitized);
                    const wpaDetails = wpaConnectionLinux(ifaceSanitized);
                    const ssid = nmiDetails.ssid || wpaDetails.ssid;
                    const network = networkList.filter((nw) => nw.ssid === ssid);
                    let ssidSanitized = '';
                    const t = util.isPrototypePolluted() ? '---' : util.sanitizeShellString(ssid || '', true);
                    const l = Math.min(t.length, 32);
                    for (let i = 0; i <= l; i++) {
                        if (t[i] !== undefined) {
                            ssidSanitized = ssidSanitized + t[i];
                        }
                    }
                    const nmiConnection = nmiConnectionLinux(ssidSanitized);
                    const channel = network && network.length > 0 && network[0].channel
                        ? network[0].channel
                        : wpaDetails.channel || null;
                    const bssid = network && network.length > 0 && network[0].bssid
                        ? network[0].bssid
                        : wpaDetails.bssid || null;
                    const signalLevel = network && network.length > 0 && network[0].signalLevel ? network[0].signalLevel : null;
                    if (ssid && bssid) {
                        result.push({
                            id: ifaceDetail.id,
                            iface: ifaceDetail.iface,
                            model: nmiDetails.product || null,
                            ssid,
                            bssid,
                            channel,
                            frequency: channel ? wifiFrequencyFromChannel(channel) : null,
                            type: nmiConnection.type || '802.11',
                            security: nmiConnection.security || wpaDetails.security || null,
                            signalLevel,
                            quality: wifiQualityFromDB(signalLevel || 0),
                            txRate: null,
                            rxRate: null,
                            band: null,
                            cipher: null,
                            connectionMode: null,
                            profile: null,
                            networkType: null,
                            physicalAddress: null,
                            state: null,
                        });
                    }
                }
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
            else if (platformFlags._darwin) {
                const cmd = 'system_profiler SPNetworkDataType SPAirPortDataType -xml 2>/dev/null; echo "######" ; ioreg -n AppleBCMWLANSkywalkInterface -r 2>/dev/null';
                exec(cmd, function (error, stdout) {
                    try {
                        const parts = stdout.toString().split('######');
                        const profilerObj = util.plistParser(parts[0]);
                        const networkObj = profilerObj[0]._SPCommandLineArguments.includes('SPNetworkDataType')
                            ? profilerObj[0]._items
                            : profilerObj[1]._items;
                        const airportObj = profilerObj[0]._SPCommandLineArguments.includes('SPAirPortDataType')
                            ? profilerObj[0]._items[0].spairport_airport_interfaces
                            : profilerObj[1]._items[0].spairport_airport_interfaces;
                        // parts[1] : ioreg
                        let lines3 = [];
                        if (parts[1].indexOf('  | {') > 0 &&
                            parts[1].indexOf('  | }') > parts[1].indexOf('  | {')) {
                            lines3 = parts[1]
                                .split('  | {')[1]
                                .split('  | }')[0]
                                .replaceAll(' | ', '')
                                .replaceAll('"', '')
                                .split('\n');
                        }
                        const networkWifiObj = networkObj.find((item) => item._name === 'Wi-Fi');
                        const airportWifiObj = airportObj[0].spairport_current_network_information;
                        const channel = Number.parseInt(String(airportWifiObj.spairport_network_channel).split(' ')[0], 10) ||
                            0;
                        const signalLevel = airportWifiObj.spairport_signal_noise || null;
                        const security = [];
                        const sm = airportWifiObj.spairport_security_mode;
                        if (sm === 'spairport_security_mode_wep') {
                            security.push('WEP');
                        }
                        else if (sm === 'spairport_security_mode_wpa2_personal') {
                            security.push('WPA2');
                        }
                        else if (sm.startsWith('spairport_security_mode_wpa2_enterprise')) {
                            security.push('WPA2 EAP');
                        }
                        else if (sm.startsWith('pairport_security_mode_wpa3_transition')) {
                            security.push('WPA2/WPA3');
                        }
                        else if (sm.startsWith('pairport_security_mode_wpa3')) {
                            security.push('WPA3');
                        }
                        result.push({
                            id: networkWifiObj._name || 'Wi-Fi',
                            iface: networkWifiObj.interface || '',
                            model: networkWifiObj.hardware || '',
                            ssid: airportWifiObj._name || '',
                            bssid: airportWifiObj.spairport_network_bssid || '',
                            channel,
                            frequency: channel ? wifiFrequencyFromChannel(channel) : null,
                            type: airportWifiObj.spairport_network_phymode || '802.11',
                            security,
                            signalLevel: signalLevel ? Number.parseInt(signalLevel, 10) : null,
                            quality: wifiQualityFromDB(signalLevel || 0),
                            txRate: airportWifiObj.spairport_network_rate || null,
                            rxRate: null,
                            band: null,
                            cipher: null,
                            connectionMode: null,
                            profile: null,
                            networkType: null,
                            physicalAddress: null,
                            state: null,
                        });
                    }
                    catch {
                        util.noop();
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            else if (platformFlags._windows) {
                const cmd = 'netsh wlan show interfaces';
                util.powerShell(cmd, options).then(function (stdout) {
                    const allLines = stdout.toString().split('\r\n');
                    for (let i = 0; i < allLines.length; i++) {
                        allLines[i] = allLines[i].trim();
                    }
                    const parts = allLines.join('\r\n').split(':\r\n\r\n');
                    parts.shift();
                    for (const part of parts) {
                        const lines = part.split('\r\n');
                        if (lines.length >= 5) {
                            const iface = lines[0].includes(':') ? lines[0].split(':')[1].trim() : '';
                            const model = lines[1].includes(':') ? lines[1].split(':')[1].trim() : '';
                            const id = lines[2].includes(':') ? lines[2].split(':')[1].trim() : '';
                            // Use a different approach for extracting properties with variable spacing
                            let ssid = '';
                            let bssid = '';
                            let quality = '';
                            let type = '';
                            let security = '';
                            let channel = '';
                            let txRate = '';
                            let rxRate = '';
                            let band = '';
                            let cipher = '';
                            let connectionMode = '';
                            let profile = '';
                            let networkType = '';
                            let physicalAddress = '';
                            let state = '';
                            for (const line of lines) {
                                const lineLower = line.toLowerCase().trim();
                                const parts = line.split(':');
                                if (parts.length > 1) {
                                    const value = parts.slice(1).join(':').trim();
                                    if (lineLower.startsWith('ssid')) {
                                        ssid = value;
                                    }
                                    else if (lineLower.startsWith('bssid') || lineLower.startsWith('ap bssid')) {
                                        bssid = value;
                                    }
                                    else if (lineLower.startsWith('signal')) {
                                        quality = value;
                                    }
                                    else if (lineLower.startsWith('radio type') ||
                                        lineLower.startsWith('type de radio') ||
                                        lineLower.startsWith('funktyp')) {
                                        type = value;
                                    }
                                    else if (lineLower.startsWith('authentication') ||
                                        lineLower.startsWith('authentification') ||
                                        lineLower.startsWith('authentifizierung')) {
                                        security = value;
                                    }
                                    else if (lineLower.startsWith('channel') ||
                                        lineLower.startsWith('canal') ||
                                        lineLower.startsWith('kanal')) {
                                        channel = value;
                                    }
                                    else if (lineLower.startsWith('transmit rate')) {
                                        txRate = value;
                                    }
                                    else if (lineLower.startsWith('receive rate') ||
                                        lineLower.startsWith('reception rate') ||
                                        lineLower.startsWith('empfangsrate')) {
                                        rxRate = value;
                                    }
                                    else if (lineLower.startsWith('band')) {
                                        band = value;
                                    }
                                    else if (lineLower.startsWith('cipher')) {
                                        cipher = value;
                                    }
                                    else if (lineLower.startsWith('connection mode')) {
                                        connectionMode = value;
                                    }
                                    else if (lineLower.startsWith('profile')) {
                                        profile = value;
                                    }
                                    else if (lineLower.startsWith('network type')) {
                                        networkType = value;
                                    }
                                    else if (lineLower.startsWith('physical address')) {
                                        physicalAddress = value;
                                    }
                                    else if (lineLower.startsWith('state')) {
                                        state = value;
                                    }
                                }
                            }
                            // Parse quality value (e.g., "88%" -> 88)
                            const qualityValue = quality
                                ? Number.parseInt(quality.replace('%', '').trim(), 10)
                                : null;
                            const signalLevel = qualityValue ? wifiDBFromQuality(qualityValue) : null;
                            // Clean up rate values
                            let txRateValue = null;
                            if (txRate) {
                                txRateValue = Number.parseFloat(txRate.replace('Mbps', '').replace('MBit/s', '').trim());
                            }
                            let rxRateValue = null;
                            if (rxRate) {
                                rxRateValue = Number.parseFloat(rxRate.replace('Mbps', '').replace('MBit/s', '').trim());
                            }
                            if (model && id && ssid && bssid) {
                                result.push({
                                    id,
                                    iface,
                                    model,
                                    ssid,
                                    bssid,
                                    channel: channel ? Number.parseInt(channel, 10) : null,
                                    frequency: channel ? wifiFrequencyFromChannel(channel) : null,
                                    type,
                                    security,
                                    signalLevel,
                                    quality: qualityValue,
                                    txRate: txRateValue,
                                    rxRate: rxRateValue,
                                    band,
                                    cipher,
                                    connectionMode,
                                    profile,
                                    networkType,
                                    physicalAddress,
                                    state,
                                });
                            }
                        }
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            else {
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
        });
    });
}
/**
 * Get wifi interfaces
 * @param options Optional parameters
 * @param callback Optional callback function
 * @returns Promise resolving to array of wifi interfaces
 */
export function wifiInterfaces(options = {}, callback) {
    const platformFlags = getPlatformFlagsFromOptions(options);
    return new Promise((resolve) => {
        process.nextTick(() => {
            const result = [];
            if (platformFlags._linux) {
                const ifaces = ifaceListLinux();
                for (const ifaceDetail of ifaces) {
                    const nmiDetails = nmiDeviceLinux(ifaceDetail.iface);
                    result.push({
                        id: ifaceDetail.id,
                        iface: ifaceDetail.iface,
                        model: nmiDetails.product || null,
                        vendor: nmiDetails.vendor || null,
                        mac: ifaceDetail.mac,
                    });
                }
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
            else if (platformFlags._darwin) {
                const cmd = 'system_profiler SPNetworkDataType';
                exec(cmd, function (error, stdout) {
                    const parts1 = stdout.toString().split('\n\n    Wi-Fi:\n\n');
                    if (parts1.length > 1) {
                        const lines = parts1[1].split('\n\n')[0].split('\n');
                        const iface = util.getValue(lines, 'BSD Device Name', ':', true);
                        const mac = util.getValue(lines, 'MAC Address', ':', true);
                        const model = util.getValue(lines, 'hardware', ':', true);
                        result.push({
                            id: 'Wi-Fi',
                            iface,
                            model,
                            vendor: '',
                            mac,
                        });
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            else if (platformFlags._windows) {
                const cmd = 'netsh wlan show interfaces';
                util.powerShell(cmd, options).then(function (stdout) {
                    const allLines = stdout.toString().split('\r\n');
                    for (let i = 0; i < allLines.length; i++) {
                        allLines[i] = allLines[i].trim();
                    }
                    const parts = allLines.join('\r\n').split(':\r\n\r\n');
                    parts.shift();
                    for (const part of parts) {
                        const lines = part.split('\r\n');
                        if (lines.length >= 5) {
                            const iface = lines[0].includes(':') ? lines[0].split(':')[1].trim() : '';
                            const model = lines[1].includes(':') ? lines[1].split(':')[1].trim() : '';
                            const id = lines[2].includes(':') ? lines[2].split(':')[1].trim() : '';
                            const macParts = lines[3].includes(':') ? lines[3].split(':') : [];
                            macParts.shift();
                            const mac = macParts.join(':').trim();
                            const vendor = getVendor(model);
                            if (iface && model && id && mac) {
                                result.push({
                                    id,
                                    iface,
                                    model,
                                    vendor,
                                    mac,
                                });
                            }
                        }
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            else {
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
        });
    });
}
