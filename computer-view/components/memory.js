import { formatBytes } from '../utils.js';

/**
 * Returns a URL for a memory module image based on type
 * @param {string} memType - The type of memory
 * @returns {string} URL for the memory image
 */
function getMemoryImage(memType) {
    // Always return the specified image regardless of memory type
    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1cfFsXaqG9FX18-BVAGxesyhJpwvE8EMkpg&s';
}

/**
 * Creates a memory module card with image and specs
 * @param {Object} memoryItem - The memory module information
 * @param {Object} memStats - The memory statistics information (optional)
 * @returns {string} HTML string for the memory card
 */
function createMemoryCard(memoryItem, memStats) {
    const specs = [];
    
    if (memoryItem.size) specs.push({ label: 'Size', value: formatBytes(memoryItem.size) });
    if (memoryItem.type) specs.push({ label: 'Type', value: memoryItem.type });
    if (memoryItem.clockSpeed) specs.push({ label: 'Clock Speed', value: memoryItem.clockSpeed + ' MHz' });
    if (memoryItem.formFactor) specs.push({ label: 'Form Factor', value: memoryItem.formFactor });
    if (memoryItem.manufacturer) specs.push({ label: 'Manufacturer', value: memoryItem.manufacturer });
    if (memoryItem.bank) specs.push({ label: 'Bank', value: memoryItem.bank });
    if (memoryItem.serialNum) specs.push({ label: 'Serial', value: memoryItem.serialNum });
    if (memoryItem.voltageConfigured) specs.push({ label: 'Voltage', value: memoryItem.voltageConfigured + 'V' });
    if (memoryItem.ecc !== undefined) specs.push({ label: 'ECC', value: memoryItem.ecc ? 'Yes' : 'No' });
    
    // Memory usage section if memStats is provided
    let memUsageHTML = '';
    if (memStats) {
        const total = memStats.total || 0;
        const used = memStats.used || 0;
        const free = memStats.free || 0;
        const available = memStats.available || 0;
        
        // Calculate percentages
        const usedPercent = total > 0 ? Math.round((used / total) * 100) : 0;
        
        // Determine colors based on usage
        const getUsageColor = (percent) => {
            if (percent < 60) return '#28a745'; // Green for low usage
            if (percent < 80) return '#ffc107'; // Yellow for moderate usage
            return '#dc3545'; // Red for high usage
        };
        
        const usageColor = getUsageColor(usedPercent);
        
        memUsageHTML = `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                <div style="font-weight: 600; margin-bottom: 15px;">Memory Usage</div>
                <div style="display: flex; align-items: flex-start;">
                    <div style="position: relative; width: 90px; height: 90px; margin-right: 15px;">
                        <svg width="90" height="90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="transparent" stroke="#f3f3f3" stroke-width="10"></circle>
                            <circle cx="50" cy="50" r="45" fill="transparent" stroke="${usageColor}" stroke-width="10" 
                                    stroke-dasharray="${2 * Math.PI * 45}" 
                                    stroke-dashoffset="${2 * Math.PI * 45 * (1 - usedPercent / 100)}" 
                                    transform="rotate(-90 50 50)"></circle>
                        </svg>
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                            <div style="font-size: 22px; font-weight: bold; color: ${usageColor};">${usedPercent}%</div>
                            <div style="font-size: 11px; color: #666;">Used</div>
                        </div>
                    </div>
                    <div style="flex-grow: 1;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 3px 0; color: #666; font-size: 13px; text-align: right; width: 70px;">Total:</td>
                                <td style="padding: 3px 0; text-align: left; font-size: 13px; font-weight: 500; padding-left: 10px;">${formatBytes(total)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 3px 0; color: #666; font-size: 13px; text-align: right;">Used:</td>
                                <td style="padding: 3px 0; text-align: left; font-size: 13px; font-weight: 500; padding-left: 10px;">${formatBytes(used)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 3px 0; color: #666; font-size: 13px; text-align: right;">Free:</td>
                                <td style="padding: 3px 0; text-align: left; font-size: 13px; font-weight: 500; padding-left: 10px;">${formatBytes(free)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 3px 0; color: #666; font-size: 13px; text-align: right;">Available:</td>
                                <td style="padding: 3px 0; text-align: left; font-size: 13px; font-weight: 500; padding-left: 10px;">${formatBytes(available)}</td>
                            </tr>
                            ${memStats.cached ? `
                            <tr>
                                <td style="padding: 3px 0; color: #666; font-size: 13px; text-align: right;">Cached:</td>
                                <td style="padding: 3px 0; text-align: left; font-size: 13px; font-weight: 500; padding-left: 10px;">${formatBytes(memStats.cached)}</td>
                            </tr>
                            ` : ''}
                            ${memStats.buffers ? `
                            <tr>
                                <td style="padding: 3px 0; color: #666; font-size: 13px; text-align: right;">Buffers:</td>
                                <td style="padding: 3px 0; text-align: left; font-size: 13px; font-weight: 500; padding-left: 10px;">${formatBytes(memStats.buffers)}</td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    return `
        <div style="background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; height: 100%;">
            <div style="padding: 15px 15px 10px 15px;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <div style="margin-right: 10px;">
                        <img src="${getMemoryImage(memoryItem.type)}" alt="Memory" style="width: 60px; height: auto;" 
                             onerror="this.src='https://via.placeholder.com/60x60?text=Memory'" />
                    </div>
                    <div>
                        <h2 style="margin: 0; font-size: 16px; font-weight: 600;">Memory Module</h2>
                    </div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse;">
                    ${specs.map(spec => `
                        <tr>
                            <td style="padding: 4px 0; color: #666; font-size: 13px; text-align: right; width: 90px;">${spec.label}:</td>
                            <td style="padding: 4px 0; font-size: 13px; font-weight: 500; padding-left: 10px;">${spec.value}</td>
                        </tr>
                    `).join('')}
                </table>
                
                ${memUsageHTML}
            </div>
        </div>
    `;
}

export { getMemoryImage, createMemoryCard }; 