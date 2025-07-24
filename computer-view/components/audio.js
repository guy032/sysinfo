/**
 * Audio device components for ComputerView
 * Displays audio devices in an elegant card layout
 */

import { formatColumnName, formatCellValue } from '../utils.js';

/**
 * Creates a grid of audio device cards
 * @param {Array} audioDevices - Array of audio device data
 * @returns {string} HTML string for audio device visualization
 */
function createAudioDevicesGrid(audioDevices) {
    if (!Array.isArray(audioDevices) || audioDevices.length === 0) {
        return '';
    }
    
    return `
        <div class="audio-devices-grid">
            ${audioDevices.map(device => createAudioDeviceCard(device)).join('')}
        </div>
        <style>
            .audio-devices-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
                gap: 20px;
                margin-top: 15px;
                margin-bottom: 30px;
            }
            .audio-device-card {
                background: #fff;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                transition: transform 0.2s, box-shadow 0.2s;
                position: relative;
                border: 1px solid #e0e0e0;
                height: 100%;
            }
            .audio-device-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 6px 16px rgba(0,0,0,0.12);
            }
            .audio-header {
                padding: 15px;
                display: flex;
                align-items: center;
                border-bottom: 1px solid #f0f0f0;
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            }
            .audio-icon {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                background: #673ab7;
                color: white;
                margin-right: 12px;
                flex-shrink: 0;
            }
            .audio-icon svg {
                width: 24px;
                height: 24px;
            }
            .audio-title-container {
                flex-grow: 1;
                min-width: 0; /* Allows text to properly truncate */
            }
            .audio-title {
                font-size: 16px;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .audio-manufacturer {
                font-size: 13px;
                color: #5f6368;
                margin-top: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .audio-id {
                font-size: 11px;
                color: #80868b;
                margin-top: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                word-break: break-all;
            }
            .audio-details {
                padding: 15px;
                flex-grow: 1;
                display: flex;
                flex-direction: column;
            }
            .audio-specs {
                display: grid;
                grid-template-columns: minmax(100px, 1fr) minmax(100px, 3fr);
                gap: 8px;
                margin-bottom: 15px;
            }
            .audio-spec-label {
                color: #5f6368;
                font-size: 13px;
                font-weight: 500;
            }
            .audio-spec-value {
                color: #202124;
                font-size: 13px;
                word-break: break-all;
            }
            .audio-device-info {
                margin-top: 15px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                font-size: 13px;
            }
            .audio-device-info h4 {
                margin: 0 0 10px 0;
                color: #202124;
                font-size: 14px;
                font-weight: 500;
            }
            .device-id-parts {
                display: grid;
                grid-template-columns: auto 1fr;
                gap: 6px 12px;
                margin-top: 8px;
            }
            .device-id-part-label {
                color: #5f6368;
                font-weight: 500;
                font-size: 12px;
            }
            .device-id-part-value {
                color: #202124;
                font-size: 12px;
            }
            .hardware-id {
                display: inline-block;
                padding: 2px 6px;
                background: #e8eaed;
                border-radius: 4px;
                font-family: monospace;
                margin-top: 2px;
            }
            .audio-device-chip {
                margin-top: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .audio-device-chip-icon {
                width: 18px;
                height: 18px;
            }
            .audio-type-container {
                margin-bottom: 15px;
            }
            .audio-type {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px;
                background: #f3e8fd;
                color: #673ab7;
                border-radius: 16px;
                font-size: 13px;
                font-weight: 500;
            }
            .audio-type.speaker {
                background: #e8f4fd;
                color: #1a73e8;
            }
            .audio-type.microphone {
                background: #e6f4ea;
                color: #137333;
            }
            .audio-type.headphones {
                background: #fef7e0;
                color: #ea8600;
            }
            .audio-type.virtual {
                background: #f1f3f4;
                color: #5f6368;
            }
            .audio-type svg {
                width: 16px;
                height: 16px;
            }
            .audio-channel {
                margin-top: 5px;
                font-size: 13px;
                color: #5f6368;
            }
            .audio-channel-value {
                font-weight: 500;
                color: #202124;
            }
            .audio-footer {
                padding: 10px 15px;
                background: #f8f9fa;
                border-top: 1px solid #f0f0f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #5f6368;
            }
            .audio-status {
                display: flex;
                align-items: center;
                font-size: 12px;
                font-weight: 500;
            }
            .audio-status.ok {
                color: #137333;
            }
            .audio-status.error, .audio-status.disabled {
                color: #d93025;
            }
            .audio-status::before {
                content: "";
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 6px;
            }
            .audio-status.ok::before {
                background-color: #34a853;
            }
            .audio-status.error::before, .audio-status.disabled::before {
                background-color: #ea4335;
            }
            .audio-status.unknown::before {
                background-color: #9aa0a6;
            }
            .audio-wave {
                height: 30px;
                display: flex;
                align-items: center;
                gap: 2px;
                margin-top: 10px;
            }
            .audio-wave-bar {
                width: 3px;
                background: #673ab7;
                border-radius: 1px;
                height: 100%;
                animation: audio-wave 1.5s ease-in-out infinite;
            }
            .audio-wave-bar:nth-child(2) { animation-delay: 0.2s; }
            .audio-wave-bar:nth-child(3) { animation-delay: 0.4s; }
            .audio-wave-bar:nth-child(4) { animation-delay: 0.6s; }
            .audio-wave-bar:nth-child(5) { animation-delay: 0.8s; }
            .audio-wave-bar:nth-child(6) { animation-delay: 1.0s; }
            
            .speaker-wave .audio-wave-bar { background: #1a73e8; }
            .microphone-wave .audio-wave-bar { background: #137333; }
            .headphones-wave .audio-wave-bar { background: #ea8600; }
            .virtual-wave .audio-wave-bar { background: #5f6368; }
            
            @keyframes audio-wave {
                0%, 100% { height: 6px; }
                50% { height: 25px; }
            }
            @media (max-width: 768px) {
                .audio-devices-grid {
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                }
                .audio-specs {
                    grid-template-columns: 1fr;
                    gap: 4px;
                }
                .audio-spec-value {
                    margin-bottom: 8px;
                    padding-bottom: 8px;
                    border-bottom: 1px dashed #f0f0f0;
                }
                .device-id-parts {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    `;
}

/**
 * Creates a single audio device card
 * @param {Object} device - The audio device data
 * @returns {string} HTML string for a single audio device card
 */
function createAudioDeviceCard(device) {
    // Determine device type for appropriate styling
    const deviceType = getAudioDeviceType(device);
    const deviceTypeClass = deviceType.toLowerCase();
    
    // Prepare all device details for display
    const specs = [];
    if (device.manufacturer) specs.push({ label: 'Manufacturer', value: device.manufacturer });
    if (device.channel && device.channel !== '-') specs.push({ label: 'Channel', value: device.channel });
    if (device.type && device.type !== '-') specs.push({ label: 'Type', value: device.type });
    
    // Extract detailed hardware info from device ID if available
    const deviceDetails = parseAudioDeviceId(device.id);
    
    // Create the audio wave visualization
    const waveHTML = `
        <div class="audio-wave ${deviceTypeClass}-wave">
            ${Array(6).fill().map(() => '<div class="audio-wave-bar"></div>').join('')}
        </div>
    `;
    
    // Create detailed device info display
    let deviceInfoHTML = '';
    if (deviceDetails) {
        deviceInfoHTML = `
            <div class="audio-device-info">
                <h4>Hardware Details</h4>
                <div class="device-id-parts">
                    ${deviceDetails.vendorName ? `
                        <div class="device-id-part-label">Vendor:</div>
                        <div class="device-id-part-value">
                            ${deviceDetails.vendorName} 
                            <span class="hardware-id">${deviceDetails.vendorId}</span>
                        </div>
                    ` : ''}
                    
                    ${deviceDetails.deviceName ? `
                        <div class="device-id-part-label">Chip:</div>
                        <div class="device-id-part-value">
                            ${deviceDetails.deviceName} 
                            <span class="hardware-id">${deviceDetails.deviceId}</span>
                        </div>
                    ` : ''}
                    
                    ${deviceDetails.subSystemId ? `
                        <div class="device-id-part-label">Subsystem:</div>
                        <div class="device-id-part-value">
                            <span class="hardware-id">${deviceDetails.subSystemId}</span>
                        </div>
                    ` : ''}
                    
                    ${deviceDetails.functionalType ? `
                        <div class="device-id-part-label">Function:</div>
                        <div class="device-id-part-value">${deviceDetails.functionalType}</div>
                    ` : ''}
                </div>
                
                ${deviceDetails.description ? `
                    <div class="audio-device-chip">
                        <svg class="audio-device-chip-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#5f6368">
                            <path d="M6 4h12v1h1v2h1v10h-1v2h-1v1H6v-1H5v-2H4V7h1V5h1V4zm12 3H6v10h12V7z"/>
                        </svg>
                        ${deviceDetails.description}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    return `
        <div class="audio-device-card">
            <div class="audio-header">
                <div class="audio-icon">
                    ${getAudioDeviceIcon(deviceType)}
                </div>
                <div class="audio-title-container">
                    <div class="audio-title" title="${device.name || 'Unknown Audio Device'}">
                        ${device.name || 'Unknown Audio Device'}
                    </div>
                    <div class="audio-manufacturer" title="${device.manufacturer || ''}">
                        ${device.manufacturer || ''}
                    </div>
                </div>
                ${waveHTML}
            </div>
            <div class="audio-details">
                <div class="audio-type-container">
                    <div class="audio-type ${deviceTypeClass}">
                        ${getAudioDeviceIcon(deviceType)}
                        ${deviceType}
                    </div>
                </div>
                
                <div class="audio-specs">
                    ${specs.map(spec => `
                        <div class="audio-spec-label">${spec.label}:</div>
                        <div class="audio-spec-value" title="${spec.value}">${spec.value}</div>
                    `).join('')}
                    
                    <div class="audio-spec-label">Device ID:</div>
                    <div class="audio-spec-value" title="${device.id || ''}">${device.id || 'N/A'}</div>
                </div>
                
                ${deviceInfoHTML}
            </div>
        </div>
    `;
}

/**
 * Parses an audio device ID to extract hardware details
 * @param {string} deviceId - The device ID string
 * @returns {Object|null} Parsed device information or null if not parseable
 */
function parseAudioDeviceId(deviceId) {
    if (!deviceId) return null;
    
    // Match Intel/AMD/Realtek audio device IDs
    const intelPattern = /(?:INTELAUDIO|HDAUDIO)\\(?:FUNC_(\d+))?.*?(?:VEN_([0-9A-F]{4}))?.*?(?:DEV_([0-9A-F]{4}))?.*?(?:SUBSYS_([0-9A-F]{8}))?/i;
    const match = deviceId.match(intelPattern);
    
    if (!match) return null;
    
    const [_, funcId, vendorId, deviceIdCode, subSystemId] = match;
    
    // Known vendor IDs
    const vendorMap = {
        '8086': 'Intel',
        '1002': 'AMD',
        '10EC': 'Realtek',
        '1013': 'Cirrus Logic',
        '1057': 'Motorola',
        '1274': 'Creative',
        '14F1': 'Conexant',
        '11C1': 'LSI',
        '17AB': 'Lenovo'
    };
    
    // Known Intel audio chipsets
    const intelChipsets = {
        '2284': 'Cannon Lake HD Audio',
        '280F': 'Ice Lake-LP Smart Sound Technology Audio Controller',
        '38C8': 'Tiger Lake-LP Smart Sound Technology Audio Controller',
        '51C8': 'Alder Lake-P Smart Sound Technology Audio Controller',
        'A170': 'Sunrise Point-LP HD Audio',
        'A171': 'Sunrise Point-H HD Audio',
        '9D71': 'Sunrise Point-LP HD Audio',
        '9DC8': 'Cannon Point-LP Smart Sound Technology Audio Controller',
        '06C8': 'Comet Lake Smart Sound Technology Audio Controller',
        '43C8': 'Tiger Lake-H Smart Sound Technology Audio Controller',
        '7AD0': 'Raptor Lake-P Smart Sound Technology Audio Controller'
    };
    
    // Known Realtek codecs
    const realtekCodecs = {
        '0899': 'ALC899 High-Definition Audio',
        '0900': 'ALC4080 Audio Codec',
        '0892': 'ALC892 High-Definition Audio',
        '0890': 'ALC890 High-Definition Audio',
        '0887': 'ALC887 High-Definition Audio',
        '0885': 'ALC885 High-Definition Audio',
        '0883': 'ALC883 High-Definition Audio',
        '0880': 'ALC880 High-Definition Audio',
        '0299': 'ALC299 Audio',
        '0298': 'ALC298 Audio',
        '0295': 'ALC295 Audio',
        '0293': 'ALC293 Audio',
        '0292': 'ALC292 Audio',
        '0289': 'ALC289 Audio',
        '0285': 'ALC285 Audio',
        '0283': 'ALC283 Audio',
        '0280': 'ALC280 Audio',
        '0269': 'ALC269 Audio',
        '0257': 'ALC257 Audio',
        '0256': 'ALC256 Audio',
        '0255': 'ALC255 Audio',
        '0236': 'ALC236 Audio',
        '0235': 'ALC235 Audio',
        '0233': 'ALC233 Audio',
        '0230': 'ALC230 Audio',
        '0294': 'ALC294 Audio'
    };
    
    // Get device name based on vendor
    let deviceName = null;
    if (vendorId === '8086') {
        deviceName = intelChipsets[deviceIdCode] || 'Intel Audio Controller';
    } else if (vendorId === '10EC') {
        deviceName = realtekCodecs[deviceIdCode] || 'Realtek Audio Codec';
    }
    
    // Determine function type
    let functionalType = null;
    if (funcId === '01') {
        functionalType = 'Audio Controller';
    } else if (funcId === '02') {
        functionalType = 'Modem Controller';
    }
    
    // Create description
    let description = null;
    if (vendorId && vendorMap[vendorId]) {
        description = `${vendorMap[vendorId]} ${deviceName || 'Audio Device'} (${vendorId}:${deviceIdCode})`;
    }
    
    return {
        vendorId: vendorId ? `VEN_${vendorId}` : null,
        vendorName: vendorId ? (vendorMap[vendorId] || null) : null,
        deviceId: deviceIdCode ? `DEV_${deviceIdCode}` : null,
        deviceName,
        subSystemId: subSystemId ? `SUBSYS_${subSystemId}` : null,
        functionalType,
        description
    };
}

/**
 * Determines the device type based on its properties
 * @param {Object} device - The audio device
 * @returns {string} The device type
 */
function getAudioDeviceType(device) {
    if (!device.type || device.type === '-') {
        // Try to determine from the name if type isn't specified
        const name = (device.name || '').toLowerCase();
        
        if (name.includes('speaker') || name.includes('output')) {
            return 'Speaker';
        } else if (name.includes('microphone') || name.includes('input')) {
            return 'Microphone';
        } else if (name.includes('headphone') || name.includes('headset')) {
            return 'Headphones';
        } else if (name.includes('virtual') || name.includes('droid')) {
            return 'Virtual';
        }
        
        return 'Audio';
    }
    
    return device.type;
}

/**
 * Returns an appropriate CSS class for the status
 * @param {string} status - The status string
 * @returns {string} CSS class
 */
function getStatusClass(status) {
    if (!status) return 'unknown';
    
    status = status.toLowerCase();
    if (status === 'ok') return 'ok';
    if (status.includes('error')) return 'error';
    if (status.includes('disabled')) return 'disabled';
    
    return 'unknown';
}

/**
 * Returns an SVG icon for the audio device type
 * @param {string} deviceType - The device type
 * @returns {string} SVG icon HTML
 */
function getAudioDeviceIcon(deviceType) {
    const type = deviceType.toLowerCase();
    
    if (type === 'speaker') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 2v6h-3v7c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3c.35 0 .69.07 1 .18V6h5z"/>
        </svg>`;
    } else if (type === 'microphone') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
        </svg>`;
    } else if (type === 'headphones') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-4.97 0-9 4.03-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z"/>
        </svg>`;
    } else if (type === 'virtual') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/>
        </svg>`;
    }
    
    // Default audio icon
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>`;
}

export { createAudioDevicesGrid }; 