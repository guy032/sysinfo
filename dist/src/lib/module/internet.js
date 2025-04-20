"use strict";
// ==================================================================================
// internet.ts
// ----------------------------------------------------------------------------------
// Description:   System Information - library
//                for Node.js
// Copyright:     (c) 2014 - 2025
// Author:        Sebastian Hildebrandt
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 12. Internet
// ----------------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.inetChecksite = inetChecksite;
exports.inetLatency = inetLatency;
const tslib_1 = require("tslib");
const util = tslib_1.__importStar(require("../util"));
const platform_1 = require("../util/platform");
// --------------------------
// check if external site is available
function inetChecksite(url, callback) {
    // Get platform flags from options if provided
    return new Promise((resolve) => {
        process.nextTick(() => {
            const result = {
                url,
                ok: false,
                status: 404,
                ms: null,
            };
            if (typeof url !== 'string') {
                if (callback) {
                    callback(result);
                }
                return resolve(result);
            }
            let urlSanitized = '';
            const s = util.sanitizeShellString(url, true);
            const l = Math.min(s.length, 2000);
            // Sanitize URL using a safer approach without prototype manipulation
            for (let i = 0; i <= l; i++) {
                if (s[i] !== undefined) {
                    const char = s[i].toLowerCase();
                    if (char && char.length === 1) {
                        urlSanitized += char;
                    }
                }
            }
            result.url = urlSanitized;
            try {
                if (urlSanitized && !util.isPrototypePolluted()) {
                    // Check URL scheme without prototype manipulation
                    if (urlSanitized.startsWith('file:') ||
                        urlSanitized.startsWith('gopher:') ||
                        urlSanitized.startsWith('telnet:') ||
                        urlSanitized.startsWith('mailto:') ||
                        urlSanitized.startsWith('news:') ||
                        urlSanitized.startsWith('nntp:')) {
                        if (callback) {
                            callback(result);
                        }
                        return resolve(result);
                    }
                    util.checkWebsite(urlSanitized).then((res) => {
                        result.status = res.statusCode;
                        result.ok = res.statusCode >= 200 && res.statusCode <= 399;
                        result.ms = result.ok ? res.time : null;
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
            }
            catch {
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
        });
    });
}
// --------------------------
// check inet latency
function inetLatency(options = {}, host, callback) {
    // Get platform flags from options if provided
    const platformFlags = (0, platform_1.getPlatformFlagsFromOptions)(options);
    // fallback - if only callback is given
    if (util.isFunction(host) && !callback) {
        callback = host;
        host = '';
    }
    const hostStr = host || '8.8.8.8';
    return new Promise((resolve) => {
        process.nextTick(() => {
            if (typeof hostStr !== 'string') {
                if (callback) {
                    callback(null);
                }
                return resolve(null);
            }
            let hostSanitized = '';
            const s = (util.isPrototypePolluted() ? '8.8.8.8' : util.sanitizeShellString(hostStr, true)).trim();
            const l = Math.min(s.length, 2000);
            // Sanitize host using a safer approach without prototype manipulation
            for (let i = 0; i <= l; i++) {
                if (s[i] !== undefined) {
                    const char = s[i].toLowerCase();
                    if (char && char.length === 1) {
                        hostSanitized += char;
                    }
                }
            }
            // Check URL scheme without prototype manipulation
            if (hostSanitized.startsWith('file:') ||
                hostSanitized.startsWith('gopher:') ||
                hostSanitized.startsWith('telnet:') ||
                hostSanitized.startsWith('mailto:') ||
                hostSanitized.startsWith('news:') ||
                hostSanitized.startsWith('nntp:')) {
                if (callback) {
                    callback(null);
                }
                return resolve(null);
            }
            let params;
            if (platformFlags._linux ||
                platformFlags._freebsd ||
                platformFlags._openbsd ||
                platformFlags._netbsd ||
                platformFlags._darwin) {
                if (platformFlags._linux) {
                    params = ['-c', '2', '-w', '3', hostSanitized];
                }
                else if (platformFlags._freebsd || platformFlags._openbsd || platformFlags._netbsd) {
                    params = ['-c', '2', '-t', '3', hostSanitized];
                }
                else {
                    params = ['-c2', '-t3', hostSanitized];
                }
                util.execSafe('ping', params).then((stdout) => {
                    let result = null;
                    if (stdout) {
                        const lines = stdout
                            .split('\n')
                            .filter((line) => line.includes('rtt') || line.includes('round-trip') || line.includes('avg'))
                            .join('\n');
                        const line = lines.split('=');
                        if (line.length > 1) {
                            const parts = line[1].split('/');
                            if (parts.length > 1) {
                                result = Number.parseFloat(parts[1]);
                            }
                        }
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            if (platformFlags._sunos) {
                const params = ['-s', '-a', hostSanitized, '56', '2'];
                const filt = 'avg';
                util.execSafe('ping', params, { timeout: 3000 }).then((stdout) => {
                    let result = null;
                    if (stdout) {
                        const lines = stdout
                            .split('\n')
                            .filter((line) => line.includes(filt))
                            .join('\n');
                        const line = lines.split('=');
                        if (line.length > 1) {
                            const parts = line[1].split('/');
                            if (parts.length > 1) {
                                result = Number.parseFloat(parts[1].replace(',', '.'));
                            }
                        }
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            if (platformFlags._windows) {
                let result = null;
                try {
                    const params = [hostSanitized, '-n', '1'];
                    util.powerShell(`ping ${params.join(' ')}`, options).then((stdout) => {
                        if (stdout) {
                            // Handle stdout which can be either string or string[]
                            const lines = Array.isArray(stdout) ? stdout : stdout.split('\r\n');
                            if (lines.length > 0) {
                                lines.shift();
                                for (const line of lines) {
                                    if ((line.toLowerCase().match(/ms/g) || []).length === 3) {
                                        const l = line.replaceAll(/ +/g, ' ').split(' ');
                                        if (l.length > 6) {
                                            const lastValue = l.at(-1);
                                            if (lastValue !== undefined) {
                                                result = Number.parseFloat(lastValue);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (callback) {
                            callback(result);
                        }
                        resolve(result);
                    });
                }
                catch {
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                }
            }
        });
    });
}
