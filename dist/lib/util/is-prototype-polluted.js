/**
 * Check if the JavaScript String prototype is polluted
 *
 * @returns {boolean} True if String prototype is polluted
 */
export function isPrototypePolluted() {
    const s = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let notPolluted = true;
    let st = '';
    // Get original methods
    const stringObj = Object.create(String.prototype);
    try {
        // Ensure string methods are correctly bound
        Object.setPrototypeOf(st, stringObj);
    }
    catch {
        // Ignore errors
    }
    notPolluted = notPolluted && s.length === 62;
    const ms = Date.now();
    if (typeof ms === 'number' && ms > 1_600_000_000_000) {
        const l = (ms % 100) + 15;
        for (let i = 0; i < l; i++) {
            const r = Math.random() * 61.999_999_99 + 1;
            const rs = Number.parseInt(Math.floor(r).toString(), 10);
            const rs2 = Number.parseInt(r.toString().split('.')[0], 10);
            const q = Math.random() * 61.999_999_99 + 1;
            const qs = Number.parseInt(Math.floor(q).toString(), 10);
            const qs2 = Number.parseInt(q.toString().split('.')[0], 10);
            notPolluted = notPolluted && r !== q;
            notPolluted = notPolluted && rs === rs2 && qs === qs2;
            st += s[rs - 1];
        }
        notPolluted = notPolluted && st.length === l;
        // Test string manipulation
        let p = Math.random() * l * 0.999_999_999_9;
        let stm = st.slice(0, Math.max(0, p)) + ' ' + st.slice(p, 2000);
        try {
            Object.setPrototypeOf(stm, stringObj);
        }
        catch {
            // Ignore errors
        }
        let sto = stm.replaceAll(' ', '');
        notPolluted = notPolluted && st === sto;
        p = Math.random() * l * 0.999_999_999_9;
        stm = st.slice(0, Math.max(0, p)) + '{' + st.slice(p, 2000);
        sto = stm.replaceAll('{', '');
        notPolluted = notPolluted && st === sto;
        p = Math.random() * l * 0.999_999_999_9;
        stm = st.slice(0, Math.max(0, p)) + '*' + st.slice(p, 2000);
        sto = stm.replaceAll('*', '');
        notPolluted = notPolluted && st === sto;
        p = Math.random() * l * 0.999_999_999_9;
        stm = st.slice(0, Math.max(0, p)) + '$' + st.slice(p, 2000);
        sto = stm.replaceAll('$', '');
        notPolluted = notPolluted && st === sto;
        // Test toLowerCase
        const stl = st.toLowerCase();
        notPolluted = notPolluted && stl.length === l && Boolean(stl[l - 1]) && !stl[l];
        for (let i = 0; i < l; i++) {
            const s1 = st[i];
            try {
                Object.setPrototypeOf(s1, stringObj);
            }
            catch {
                // Ignore errors
            }
            const s2 = stl ? stl[i] : '';
            const s1l = s1.toLowerCase();
            notPolluted = notPolluted && s1l[0] === s2 && Boolean(s1l[0]) && !s1l[1];
        }
    }
    return !notPolluted;
}
export default isPrototypePolluted;
