import fs from 'fs';
/**
 * Check if OS is Raspbian
 *
 * @returns {boolean} True if OS is Raspbian
 */
export function isRaspbian() {
    let result = false;
    try {
        const osRelease = fs
            .readFileSync('/etc/os-release', { encoding: 'utf8' })
            .toString()
            .split('\n');
        const linuxInfo = {};
        for (const line of osRelease) {
            const parts = line.split('=');
            if (parts.length === 2) {
                linuxInfo[parts[0].toLowerCase()] = parts[1].toLowerCase().replaceAll('"', '');
            }
        }
        result = Boolean(linuxInfo.id === 'raspbian' || (linuxInfo.id_like && linuxInfo.id_like.includes('raspbian')));
    }
    catch {
        // Not Raspbian
    }
    return result;
}
export default isRaspbian;
