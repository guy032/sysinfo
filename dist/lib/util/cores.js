import os from 'os';
let coresNum = 0;
/**
 * Get the number of CPU cores
 *
 * @returns {number} Number of CPU cores
 */
export function cores() {
    if (coresNum === 0) {
        coresNum = os.cpus().length;
    }
    return coresNum;
}
export default cores;
