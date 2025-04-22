/**
 * Helper function to format bytes
 * @param {number} bytes - The number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted string with units
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0 || !bytes) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formats a UUID by adding hyphens if they don't exist
 * @param {string} uuid - The UUID to format
 * @returns {string} Formatted UUID with hyphens
 */
export function formatUuid(uuid) {
    if (!uuid || uuid.includes('-')) return uuid;
    // Standard UUID format: 8-4-4-4-12
    return uuid.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}

/**
 * Creates an HTML element for a UUID with a copy button
 * @param {string} uuid - The UUID to display
 * @param {string} label - Label for the UUID
 * @param {string} iconPath - SVG path for the icon
 * @returns {string} HTML string for the UUID element
 */
export function createUuidElement(uuid, label, iconPath) {
    if (!uuid) return '';
    
    const formattedUuid = formatUuid(uuid);
    const defaultIconPath = "M17,17H7V7H17M21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5M19,5H5V19H19V5Z";
    
    return `
        <div style="margin-top: 15px; margin-bottom: 15px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #0078D4; display: flex; align-items: center;">
                <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 6px;">
                    <path fill="currentColor" d="${iconPath || defaultIconPath}" />
                </svg>
                ${label || 'UUID'}
            </div>
            <div style="
                position: relative;
                font-family: monospace;
                background: #f5f7fa;
                padding: 10px 12px;
                border-radius: 6px;
                color: #333;
                word-break: break-all;
                font-size: 14px;
                user-select: all;
                border: 1px solid #e0e0e0;
            ">
                ${formattedUuid}
                <div 
                    style="
                        position: absolute;
                        right: 8px;
                        top: 50%;
                        transform: translateY(-50%);
                        background: #f0f2f5;
                        border-radius: 4px;
                        padding: 4px 8px;
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        cursor: pointer;
                        color: #555;
                        transition: all 0.2s;
                        font-family: system-ui, sans-serif;
                        user-select: none;
                    "
                    title="Copy to clipboard"
                    onclick="navigator.clipboard.writeText('${uuid}'); this.innerHTML='Copied!'; setTimeout(() => { this.innerHTML='<svg viewBox=\\'0 0 24 24\\' width=\\'14\\' height=\\'14\\' style=\\'margin-right: 4px;\\'><path fill=\\'currentColor\\' d=\\'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z\\' /></svg>Copy'; }, 1000);"
                >
                    <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 4px;">
                        <path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
                    </svg>
                    Copy
                </div>
            </div>
        </div>
    `;
}

/**
 * Creates a resolution badge based on display resolution
 * @param {number} width - Resolution width in pixels
 * @param {number} height - Resolution height in pixels
 * @returns {string} HTML for the resolution badge
 */
export function createResolutionBadge(width, height) {
    if (!width || !height) return '';
    
    let badgeText = '';
    let badgeColor = '';
    
    if (width >= 3840 && height >= 2160) {
        badgeText = '4K UHD';
        badgeColor = '#e74c3c';
    } else if (width >= 2560 && height >= 1440) {
        badgeText = '2K QHD';
        badgeColor = '#3498db';
    } else if (width >= 1920 && height >= 1080) {
        badgeText = 'Full HD';
        badgeColor = '#27ae60';
    } else if (width >= 1280 && height >= 720) {
        badgeText = 'HD';
        badgeColor = '#f39c12';
    } else {
        return '';
    }
    
    return `<span style="background: ${badgeColor}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">${badgeText}</span>`;
}

/**
 * Returns a label for the resolution (e.g. "4K Ultra HD")
 * @param {number} width - Resolution width in pixels
 * @param {number} height - Resolution height in pixels
 * @returns {string} Resolution label
 */
export function getResolutionLabel(width, height) {
    if (width >= 3840) return '4K Ultra HD';
    if (width >= 2560) return '2K Quad HD';
    if (width >= 1920) return 'Full HD';
    if (width >= 1280) return 'HD';
    return 'Standard Definition';
} 