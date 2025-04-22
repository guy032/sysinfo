/**
 * USB device components for ComputerView
 * Displays USB devices in an elegant card layout
 */

import { formatColumnName, formatCellValue } from '../utils.js';

/**
 * Creates a grid of USB device cards
 * @param {Array} usbDevices - Array of USB device data
 * @returns {string} HTML string for USB device visualization
 */
function createUsbDevicesGrid(usbDevices) {
    if (!Array.isArray(usbDevices) || usbDevices.length === 0) {
        return '';
    }
    
    return `
        <div class="section-title">USB Devices (${usbDevices.length} items)</div>
        <div class="usb-devices-grid">
            ${usbDevices.map(device => createUsbDeviceCard(device)).join('')}
        </div>
        <style>
            .usb-devices-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                gap: 20px;
                margin-top: 15px;
                margin-bottom: 30px;
            }
            .usb-device-card {
                background: #fff;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                transition: transform 0.2s, box-shadow 0.2s;
                position: relative;
                border: 1px solid #e0e0e0;
            }
            .usb-device-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 6px 16px rgba(0,0,0,0.12);
            }
            .usb-header {
                padding: 15px;
                display: flex;
                align-items: center;
                border-bottom: 1px solid #f0f0f0;
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            }
            .usb-icon {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                background: #4285f4;
                color: white;
                margin-right: 12px;
                flex-shrink: 0;
            }
            .usb-icon svg {
                width: 24px;
                height: 24px;
            }
            .usb-title {
                font-size: 16px;
                font-weight: 600;
                flex-grow: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .usb-specs {
                padding: 15px;
                flex-grow: 1;
            }
            .usb-spec-item {
                display: flex;
                margin-bottom: 8px;
                font-size: 14px;
            }
            .usb-spec-label {
                color: #5f6368;
                flex-basis: 40%;
                flex-shrink: 0;
            }
            .usb-spec-value {
                color: #202124;
                flex-grow: 1;
                word-break: break-word;
            }
            .usb-footer {
                padding: 10px 15px;
                background: #f8f9fa;
                border-top: 1px solid #f0f0f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #5f6368;
            }
            .usb-type-badge {
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 11px;
                background: #e8f0fe;
                color: #1967d2;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 500;
            }
            .usb-type-badge.controller {
                background: #fce8e6;
                color: #d93025;
            }
            .usb-type-badge.hub {
                background: #e6f4ea;
                color: #137333;
            }
            .usb-type-badge.storage {
                background: #fff8e1;
                color: #e37400;
            }
            .usb-type-badge.keyboard {
                background: #f3e8fd;
                color: #a142f4;
            }
            .usb-type-badge.mouse {
                background: #e8f0fe;
                color: #1a73e8;
            }
            @media (max-width: 768px) {
                .usb-devices-grid {
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                }
            }
        </style>
    `;
}

/**
 * Creates a single USB device card
 * @param {Object} device - The USB device data
 * @returns {string} HTML string for a single USB device card
 */
function createUsbDeviceCard(device) {
    // Determine device type for appropriate styling
    const deviceType = getDeviceType(device);
    
    // Prepare specs for display
    const specs = [];
    
    if (device.manufacturer) specs.push({ label: 'Manufacturer', value: device.manufacturer });
    if (device.vendor) specs.push({ label: 'Vendor', value: device.vendor });
    if (device.vendorId) specs.push({ label: 'Vendor ID', value: device.vendorId });
    if (device.deviceId) specs.push({ label: 'Device ID', value: device.deviceId });
    if (device.serialNumber) specs.push({ label: 'Serial Number', value: device.serialNumber });
    if (device.bus) specs.push({ label: 'Bus', value: device.bus });
    if (device.deviceAddress) specs.push({ label: 'Device Address', value: device.deviceAddress });
    if (device.maxPower) specs.push({ label: 'Max Power', value: device.maxPower });
    if (device.speed) specs.push({ label: 'Speed', value: device.speed });
    
    // Create a device title, fallback to type if name is not available
    const deviceTitle = device.name || 
                        device.product || 
                        `${device.manufacturer || device.vendor || ''} ${deviceType} Device`;
                        
    return `
        <div class="usb-device-card">
            <div class="usb-header">
                <div class="usb-icon">
                    ${getDeviceIcon(deviceType)}
                </div>
                <div class="usb-title" title="${deviceTitle}">
                    ${deviceTitle}
                </div>
            </div>
            <div class="usb-specs">
                ${specs.map(spec => `
                    <div class="usb-spec-item">
                        <div class="usb-spec-label">${spec.label}:</div>
                        <div class="usb-spec-value">${formatCellValue(spec.value)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="usb-footer">
                <div class="usb-type-badge ${deviceType.toLowerCase()}">
                    ${deviceType}
                </div>
                <div class="usb-id">${device.id || device.deviceId || device.vendorId || ''}</div>
            </div>
        </div>
    `;
}

/**
 * Determines the device type based on its properties
 * @param {Object} device - The USB device
 * @returns {string} The device type
 */
function getDeviceType(device) {
    const name = (device.name || device.product || '').toLowerCase();
    
    if (name.includes('controller') || name.includes('host controller')) {
        return 'Controller';
    } else if (name.includes('hub')) {
        return 'Hub';
    } else if (name.includes('storage') || name.includes('flash') || name.includes('disk')) {
        return 'Storage';
    } else if (name.includes('keyboard')) {
        return 'Keyboard';
    } else if (name.includes('mouse') || name.includes('pointer')) {
        return 'Mouse';
    } else if (name.includes('camera') || name.includes('webcam')) {
        return 'Camera';
    } else if (name.includes('audio') || name.includes('sound') || name.includes('microphone')) {
        return 'Audio';
    } else {
        return 'Device';
    }
}

/**
 * Returns an SVG icon for the device type
 * @param {string} deviceType - The device type
 * @returns {string} SVG icon HTML
 */
function getDeviceIcon(deviceType) {
    // Simple SVG icons for different device types
    const icons = {
        'Controller': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>',
        'Hub': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M8 12l4-4 4 4-4 4z"/></svg>',
        'Storage': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 8h20V4H2v4zm2-3h2v2H4V5zM2 14h20v-4H2v4zm2-3h2v2H4v-2z"/></svg>',
        'Keyboard': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/></svg>',
        'Mouse': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M13 1.07V9h7c0-4.08-3.05-7.44-7-7.93zM4 15c0 4.42 3.58 8 8 8s8-3.58 8-8v-4H4v4zm7-13.93C7.05 1.56 4 4.92 4 9h7V1.07z"/></svg>',
        'Camera': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M9.4 10.5l4.77-8.26C13.47 2.09 12.75 2 12 2c-2.4 0-4.6.85-6.32 2.25l3.66 6.35.06-.1zM21.54 9c-.92-2.92-3.15-5.26-6-6.34L11.88 9h9.66zm.26 1h-7.49l.29.5 4.76 8.25C21 16.97 22 14.61 22 12c0-.69-.07-1.35-.2-2zM8.54 12l-3.9-6.75C3.01 7.03 2 9.39 2 12c0 .69.07 1.35.2 2h7.49l-1.15-2zm-6.08 3c.92 2.92 3.15 5.26 6 6.34L12.12 15H2.46zm11.27 0l-3.9 6.76c.7.15 1.42.24 2.17.24 2.4 0 4.6-.85 6.32-2.25l-3.66-6.35-.93 1.6z"/></svg>',
        'Audio': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>',
        'Device': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>'
    };
    
    return icons[deviceType] || icons['Device'];
}

export { createUsbDevicesGrid }; 