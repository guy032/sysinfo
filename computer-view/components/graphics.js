import { formatBytes } from '../utils.js';

/**
 * Creates a graphics controller card with modern visualization
 * @param {Object} controller - The graphics controller information
 * @returns {string} HTML string for the graphics card
 */
function createGraphicsControllerCard(controller) {
    const specs = [];
    
    if (controller.model) specs.push({ label: 'Model', value: controller.model });
    if (controller.vendor) specs.push({ label: 'Vendor', value: controller.vendor });
    if (controller.vram) specs.push({ label: 'VRAM', value: formatBytes(controller.vram * 1024 * 1024) }); // Convert MB to bytes
    if (controller.deviceId) specs.push({ label: 'Device ID', value: controller.deviceId });
    if (controller.bus) specs.push({ label: 'Bus', value: controller.bus });
    if (controller.vramDynamic !== undefined) specs.push({ label: 'Dynamic VRAM', value: controller.vramDynamic ? 'Yes' : 'No' });
    if (controller.driverVersion) specs.push({ label: 'Driver Version', value: controller.driverVersion });

    // Determine if this is integrated or discrete graphics
    const isIntegrated = controller.vendor && controller.vendor.toLowerCase().includes('intel');
    const imageUrl = isIntegrated ? 
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7JWjPDA-mcOzv9UGDrC51wiwbGL0ALlcJFQ&s' : 
        'https://www.notebookcheck.net/fileadmin/Notebooks/NVIDIA/rtx_3060.jpg';

    // Get vendor logo URL
    const vendorLogoUrl = getVendorLogoUrl(controller.vendor);

    // Calculate refresh rate status
    const refreshRate = controller.currentRefreshRate || 60;
    const refreshRateColor = getRefreshRateColor(refreshRate);
    const circumference = 2 * Math.PI * 40; // radius 40
    const refreshRatePercent = Math.min((refreshRate / 144) * 100, 100); // Using 144Hz as baseline
    const dashOffset = circumference * (1 - refreshRatePercent / 100);

    return `
        <div class="hardware-card graphics-card">
            <div class="graphics-left-section">
                <div class="graphics-image-container">
                    <img src="${imageUrl}" alt="Graphics Controller" class="graphics-image" onerror="this.src='https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/RWCZER-Legal-IP-Trademarks-CP-MS-logo-740x417-1?wid=406&hei=230&fit=crop'" />
                </div>
                
                <!-- Refresh Rate Gauge -->
                <div class="graphics-gauge-container">
                    <div class="gauge-container">
                        <div class="gauge-label">Refresh Rate</div>
                        <div class="circular-gauge">
                            <svg width="100" height="100" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#e9ecef" stroke-width="10" />
                                <circle 
                                    cx="50" 
                                    cy="50" 
                                    r="40" 
                                    fill="none" 
                                    stroke="${refreshRateColor}" 
                                    stroke-width="10" 
                                    stroke-linecap="round"
                                    stroke-dasharray="${circumference}" 
                                    stroke-dashoffset="${dashOffset}"
                                    transform="rotate(-90 50 50)"
                                />
                                <text x="50" y="45" text-anchor="middle" font-size="16" font-weight="bold" fill="${refreshRateColor}">${refreshRate}</text>
                                <text x="50" y="65" text-anchor="middle" font-size="12" fill="#666">Hz</text>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="hardware-details">
                <div class="hardware-title">
                    ${controller.model || 'Graphics Controller'}
                    ${vendorLogoUrl ? `<img src="${vendorLogoUrl}" alt="Vendor Logo" class="vendor-logo" />` : ''}
                </div>
                
                <div class="graphics-type-badge ${isIntegrated ? 'integrated' : 'discrete'}">
                    ${isIntegrated ? 'Integrated Graphics' : 'Discrete Graphics'}
                </div>
                
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
    `;
}

/**
 * Creates a display card with modern visualization
 * @param {Object} display - The display information
 * @returns {string} HTML string for the display card
 */
function createDisplayCard(display) {
    const specs = [];
    
    // Convert vendor codes to full names
    const vendorMap = {
        'SHP': 'Sharp',
        'XMI': 'Xiaomi'
    };
    const vendorName = vendorMap[display.vendor] || display.vendor;
    
    // Format model name
    const modelName = display.model === '\\x00' ? `${vendorName} Display` : display.model;
    
    if (modelName) specs.push({ label: 'Model', value: modelName });
    if (vendorName) specs.push({ label: 'Manufacturer', value: vendorName });
    if (display.connection) {
        const connectionStyle = display.connection.toLowerCase() === 'internal' ? 
            'background: #6c757d' : 'background: #17a2b8';
        specs.push({ 
            label: 'Connection', 
            value: `<span class="connection-badge" style="${connectionStyle}">${display.connection}</span>` 
        });
    }
    
    // Add physical dimensions
    let diagonalInches = '';
    if (display.sizeXcm && display.sizeYcm) {
        const diagonal = Math.sqrt(Math.pow(display.sizeXcm, 2) + Math.pow(display.sizeYcm, 2));
        diagonalInches = `(${(diagonal/2.54).toFixed(1)}")`;
        specs.push({ 
            label: 'Physical Size', 
            value: `${display.sizeXcm}cm × ${display.sizeYcm}cm ${diagonalInches}`
        });
    }
    
    if (display.pixelDepth) specs.push({ label: 'Pixel Depth', value: display.pixelDepth + ' bit' });
    if (display.currentRefreshRate) specs.push({ label: 'Refresh Rate', value: display.currentRefreshRate + ' Hz' });
    if (display.builtin !== undefined) specs.push({ label: 'Built-in', value: display.builtin ? 'Yes' : 'No' });

    // Calculate physical ratio and scale
    const physicalRatio = display.sizeXcm / display.sizeYcm;
    
    // Find the largest display dimensions in the system
    const maxSystemWidth = 80; // Xiaomi display width
    const maxSystemHeight = 33; // Xiaomi display height
    
    // Calculate scale based on container constraints
    const containerWidth = 400; // Maximum container width
    const containerHeight = 200; // Maximum container height
    
    // Calculate scale factors for both width and height constraints
    const scaleByWidth = containerWidth / maxSystemWidth;
    const scaleByHeight = containerHeight / maxSystemHeight;
    
    // Use the smaller scale to ensure fitting in both dimensions
    const baseScale = Math.min(scaleByWidth, scaleByHeight) * 0.8; // 80% of max size for padding
    
    // Calculate dimensions maintaining exact proportions relative to largest display
    const width = Math.round(display.sizeXcm * baseScale);
    const height = Math.round(display.sizeYcm * baseScale);

    // Special treatment for Xiaomi monitor
    const isXiaomiMonitor = vendorName === 'Xiaomi';
    const customImageUrl = isXiaomiMonitor ? 'https://img.zap.co.il/pics/5/0/1/2/84222105d.gif' : null;
    const fullWidth = isXiaomiMonitor ? 'width: 100%; grid-column: 1 / -1;' : '';

    return `
        <div class="hardware-card display-card" style="${fullWidth}">
            <div class="display-left-section">
                <div class="display-container" style="width: ${containerWidth}px; height: ${containerHeight}px; display: flex; justify-content: center; align-items: center;">
                    ${customImageUrl ? 
                      `<img src="${customImageUrl}" alt="${modelName}" style="width: 100%; height: auto; max-height: ${containerHeight}px; object-fit: contain; border-radius: 8px;" />` :
                      `<div class="display-image-container" style="width: ${width}px; height: ${height}px;">
                          <div class="display-screen" style="width: 100%; height: 100%; position: relative; background: linear-gradient(45deg, #2c3e50, #3498db);">
                              <div class="display-size-label" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; text-align: center;">
                                  <div style="font-size: ${width > 200 ? '1.4em' : '1.1em'}; margin-bottom: 8px;">${display.sizeXcm}cm × ${display.sizeYcm}cm</div>
                                  <div style="font-size: ${width > 200 ? '1.1em' : '0.9em'}; opacity: 0.8;">${diagonalInches}</div>
                              </div>
                          </div>
                      </div>`
                    }
                </div>
            </div>
            
            <div class="hardware-details" style="flex: 1; min-width: 200px; padding-left: 20px;">
                <div class="hardware-title">
                    ${modelName}
                    ${getVendorLogoUrl(display.vendor) ? `<img src="${getVendorLogoUrl(display.vendor)}" alt="${vendorName} Logo" class="vendor-logo" />` : ''}
                </div>
                
                <div class="display-resolution-badge">
                    ${getResolutionLabel(display.resolutionX || display.currentResX || 1920, display.resolutionY || display.currentResY || 1080)}
                </div>
                
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
            .display-container {
                position: relative;
                overflow: hidden;
            }
            .display-screen {
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            .display-size-label {
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                white-space: nowrap;
            }
            .connection-badge {
                padding: 4px 8px;
                border-radius: 4px;
                color: white;
                font-size: 0.9em;
            }
            .hardware-card {
                display: flex;
                align-items: stretch;
                max-width: 100%;
                overflow: hidden;
            }
            .display-left-section {
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            @media (max-width: 768px) {
                .hardware-card {
                    flex-direction: column;
                }
                .display-container {
                    width: 100% !important;
                    max-width: 400px;
                    margin: 0 auto;
                }
                .hardware-details {
                    padding-left: 0 !important;
                    padding-top: 20px;
                }
            }
        </style>
    `;
}

// Helper functions
function getVendorLogoUrl(vendor) {
    if (!vendor) return null;
    vendor = vendor.toLowerCase();
    
    if (vendor.includes('nvidia')) {
        return 'https://www.nvidia.com/etc.clientlibs/settings/wcm/designs/nvidiaGDC/clientlib-nv-brand/resources/images/nvidia-logo.svg';
    } else if (vendor.includes('amd')) {
        return 'https://www.amd.com/sites/default/files/styles/992px/public/2019-06/238593-amd-logo-crop-1260x709_0.png';
    } else if (vendor.includes('intel')) {
        return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5k4RmDQS6aHa4IiOnrgjIN-rMh0iY5fcGo9Z4cYKvDfuv0aAl1J3l_B5Sdc_TZHx0N2o&usqp=CAU';
    } else if (vendor.includes('sharp') || vendor.toLowerCase() === 'shp') {
        return 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Logo_of_the_Sharp_Corporation.svg';
    } else if (vendor.includes('xiaomi') || vendor === 'xmi') {
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Xiaomi_logo_%282021-%29.svg/2560px-Xiaomi_logo_%282021-%29.svg.png';
    }
    return null;
}

function getRefreshRateColor(rate) {
    if (rate >= 144) return '#28a745'; // Green for 144Hz+
    if (rate >= 100) return '#17a2b8'; // Blue for 100Hz+
    if (rate >= 75) return '#ffc107'; // Yellow for 75Hz+
    return '#6c757d'; // Gray for lower refresh rates
}

function getResolutionLabel(width, height) {
    if (width >= 3840) return '4K Ultra HD';
    if (width >= 2560) return '2K Quad HD';
    if (width >= 1920) return 'Full HD';
    if (width >= 1280) return 'HD';
    return 'Standard Definition';
}

export { createGraphicsControllerCard, createDisplayCard };