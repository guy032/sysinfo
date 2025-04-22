/**
 * Creates an operating system information card with modern visualization
 * @param {Object} os - The operating system information
 * @param {string} osUUID - The operating system UUID (optional)
 * @returns {string} HTML string for the OS card
 */
function createOSCard(os, osUUID) {
    const specs = [];
    
    // Format Windows build number with release name if known
    const buildInfo = {
        '26100': 'Windows 11 24H2'
    };
    const buildName = buildInfo[os.build] || `Build ${os.build}`;
    
    if (os.platform) specs.push({ label: 'Platform', value: os.platform });
    if (os.distro) specs.push({ label: 'Edition', value: os.distro });
    if (os.build) specs.push({ label: 'Version', value: buildName });
    if (os.servicepack) specs.push({ label: 'Service Pack', value: os.servicepack });
    if (os.codepage) specs.push({ label: 'Code Page', value: os.codepage });
    if (os.hypervisor !== undefined) specs.push({ label: 'Virtualization', value: os.hypervisor ? 'Enabled' : 'Disabled' });
    if (os.remoteSession !== undefined) specs.push({ label: 'Remote Session', value: os.remoteSession ? 'Yes' : 'No' });
    if (os.serial) specs.push({ label: 'Serial', value: os.serial });

    // Format UUID for display
    const formatUuid = (uuid) => {
        if (!uuid || uuid.includes('-')) return uuid;
        // Standard UUID format: 8-4-4-4-12
        return uuid.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
    };
    
    const formattedOsUUID = osUUID ? formatUuid(osUUID) : '';
    
    // UUID section HTML
    const uuidSection = osUUID ? `
        <div class="os-uuid-section" style="margin-top: 15px; margin-bottom: 10px;">
            <div style="font-weight: 600; margin-bottom: 6px; color: #0078D4; display: flex; align-items: center; font-size: 13px;">
                <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right: 4px;">
                    <path fill="currentColor" d="M17,17H7V7H17M21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5M19,5H5V19H19V5Z" />
                </svg>
                System UUID
            </div>
            <div style="
                position: relative;
                font-family: monospace;
                background: #f5f7fa;
                padding: 8px 10px;
                border-radius: 4px;
                color: #333;
                word-break: break-all;
                font-size: 12px;
                user-select: all;
                border: 1px solid #e0e0e0;
            ">
                ${formattedOsUUID}
                <div 
                    style="
                        position: absolute;
                        right: 8px;
                        top: 50%;
                        transform: translateY(-50%);
                        background: #f0f2f5;
                        border-radius: 4px;
                        padding: 4px 8px;
                        font-size: 11px;
                        display: flex;
                        align-items: center;
                        cursor: pointer;
                        color: #555;
                        transition: all 0.2s;
                        font-family: system-ui, sans-serif;
                        user-select: none;
                    "
                    title="Copy to clipboard"
                    onclick="navigator.clipboard.writeText('${osUUID}'); this.innerHTML='Copied!'; setTimeout(() => { this.innerHTML='<svg viewBox=\\'0 0 24 24\\' width=\\'12\\' height=\\'12\\' style=\\'margin-right: 4px;\\'><path fill=\\'currentColor\\' d=\\'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z\\' /></svg>Copy'; }, 1000);"
                >
                    <svg viewBox="0 0 24 24" width="12" height="12" style="margin-right: 4px;">
                        <path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
                    </svg>
                    Copy
                </div>
            </div>
        </div>
    ` : '';

    return `
        <div class="hardware-card os-card">
            <div class="os-left-section">
                <div class="os-image-container">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/Windows_logo_-_2021.svg" 
                         alt="Windows Logo" 
                         class="os-image"
                         style="width: 60px; height: 60px;" />
                </div>
                <div class="os-status-badge" style="width: 100%; text-align: center; background: #0078D4; color: white; padding: 5px 8px; border-radius: 4px; font-size: 12px; margin-top: 10px;">
                    ${os.hypervisor ? 'Virtualization Enabled' : 'Physical Installation'}
                </div>
            </div>
            
            <div class="hardware-details">
                <div class="hardware-title">
                    <span style="font-size: 16px; font-weight: 600;">Windows 11</span>
                </div>
                
                ${uuidSection}
                
                <div class="hardware-specs-container">
                    <ul class="hardware-specs">
                        ${specs.map(spec => `
                            <li>
                                <span class="label">${spec.label}:</span>
                                <span class="value">${spec.value}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
        <style>
            .os-card {
                display: flex;
                align-items: stretch;
                background: white;
                border-radius: 8px;
                padding: 16px;
                margin: 0;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .os-left-section {
                position: relative;
                width: 100px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                margin-right: 15px;
            }
            .os-image-container {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 80px;
                height: 80px;
                background-color: #f8f9fa;
                border-radius: 8px;
                margin-bottom: 10px;
            }
            .hardware-specs li {
                margin: 6px 0;
                display: flex;
                align-items: center;
                font-size: 13px;
            }
            .hardware-specs .label {
                color: #666;
                min-width: 110px;
                margin-right: 8px;
            }
            .hardware-specs .value {
                color: #333;
                font-weight: 500;
            }
            @media (max-width: 768px) {
                .os-card {
                    flex-direction: column;
                }
                .os-left-section {
                    width: 100%;
                    margin-bottom: 15px;
                    margin-right: 0;
                }
            }
        </style>
    `;
}

export { createOSCard }; 