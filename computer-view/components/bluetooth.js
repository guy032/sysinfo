import { getVendorFromBSSID } from './network.js';

// bluetooth devices names and images:
// iPhone (Яна) = https://www.spex.co.il/wp-content/uploads/iPhone-14.jpg
// Keyboard K380 = https://goldtop.co.il/upload_files/Logitech%20K380%20GRAPHITE%20Multi-Device%20Quiet%20Desktop%20Win%20And%20Mac%20Bluetooth%20Keyboard.png
// AirPods Pro = https://d2d22nphq0yz8t.cloudfront.net/6cbcadef-96e0-49e9-b3bd-9921afe362db/eilat.payngo.co.il/media/catalog/product/a/i/airpods_pro_2nd_gen_with_usb-c_pdp_image_position-2__en-us_1.jpg
// Guy's S22+ = https://images.samsung.com/is/image/samsung/p6pim/il/2202/gallery/il-galaxy-s22-plus-s906-412908-sm-s906ezggmec-thumb-530961888
// FMB003_4762827 = https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIvKjSY-dWcbw3BjIN2JWG3YJPmMHiZhI5cA&s
// MX Anywhere 3 = https://m.media-amazon.com/images/I/61S6yJOOA4L._AC_UF894,1000_QL80_.jpg
// Logi Z407 = https://acdtech.mu/wp-content/uploads/2022/05/Z407.webp

// bluetooth devices manufacturers and images:
// Apple, Inc. = https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg
// Logitech Far East = https://media.wired.com/photos/59549ff18e8cc150fa8ec6c2/master/w_1600%2Cc_limit/Logi_RGB-copy.jpg
// Samsung Electronics Co.,Ltd = https://e7.pngegg.com/pngimages/453/65/png-clipart-samsung-electronics-consumer-electronics-tech-vision-electronics-samsung-blue-electronics.png
// UAB "Teltonika Telematics" = https://images.sftcdn.net/images/t_app-icon-m/p/2151dbc7-9167-4ed5-837e-f9e8a3cba10e/200746971/teltonika-tablet-app-logo

// Map device names to their images
const deviceImages = {
    'iPhone (Яна)': 'https://www.spex.co.il/wp-content/uploads/iPhone-14.jpg',
    'Keyboard K380': 'https://goldtop.co.il/upload_files/Logitech%20K380%20GRAPHITE%20Multi-Device%20Quiet%20Desktop%20Win%20And%20Mac%20Bluetooth%20Keyboard.png',
    'AirPods Pro': 'https://d2d22nphq0yz8t.cloudfront.net/6cbcadef-96e0-49e9-b3bd-9921afe362db/eilat.payngo.co.il/media/catalog/product/a/i/airpods_pro_2nd_gen_with_usb-c_pdp_image_position-2__en-us_1.jpg',
    'Guy\'s S22+': 'https://images.samsung.com/is/image/samsung/p6pim/il/2202/gallery/il-galaxy-s22-plus-s906-412908-sm-s906ezggmec-thumb-530961888',
    'FMB003_4762827': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIvKjSY-dWcbw3BjIN2JWG3YJPmMHiZhI5cA&s',
    'MX Anywhere 3': 'https://m.media-amazon.com/images/I/61S6yJOOA4L._AC_UF894,1000_QL80_.jpg',
    'Logi Z407': 'https://acdtech.mu/wp-content/uploads/2022/05/Z407.webp'
};

// Map vendor names to their logos
const vendorLogos = {
    'Apple, Inc.': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
    'Logitech Far East': 'https://media.wired.com/photos/59549ff18e8cc150fa8ec6c2/master/w_1600%2Cc_limit/Logi_RGB-copy.jpg',
    'Samsung Electronics Co.,Ltd': 'https://e7.pngegg.com/pngimages/453/65/png-clipart-samsung-electronics-consumer-electronics-tech-vision-electronics-samsung-blue-electronics.png',
    'UAB "Teltonika Telematics"': 'https://images.sftcdn.net/images/t_app-icon-m/p/2151dbc7-9167-4ed5-837e-f9e8a3cba10e/200746971/teltonika-tablet-app-logo',
    'Logitech, Inc': 'https://media.wired.com/photos/59549ff18e8cc150fa8ec6c2/master/w_1600%2Cc_limit/Logi_RGB-copy.jpg',
    'OUI: F2D86E': 'https://static.thenounproject.com/png/2066566-200.png',
    'OUI: 3816E9': 'https://static.thenounproject.com/png/2066566-200.png'
};

/**
 * Creates a grid display of Bluetooth devices with vendor information
 * @param {Array} devices - Array of Bluetooth device objects
 * @returns {string} HTML string for the Bluetooth devices grid
 */
function createBluetoothDevicesGrid(devices) {
    if (!devices || devices.length === 0) return '';
    
    return `
        <div class="section bluetooth-section">
            <div class="section-title">Bluetooth Devices (${devices.length} ${devices.length === 1 ? 'item' : 'items'})</div>
            
            <div class="bluetooth-devices-grid">
                ${devices.map(device => {
                    // Extract device data with fallbacks - updated to handle the specific JSON structure
                    const name = device.DeviceName || device.deviceName || device.name || 'Unknown Device';
                    const address = device.MacAddress || device.macAddress || device.address || device.mac || '-';
                    
                    // Get vendor from MAC address and find the corresponding logo
                    const vendor = getVendorFromBSSID(address);
                    const vendorLogo = vendorLogos[vendor] || null;
                    
                    // Get device image
                    const deviceImage = deviceImages[name] || null;
                    
                    // Determine if we have a device image
                    const hasDeviceImage = deviceImage !== null;

                    return `
                        <div class="bluetooth-card">
                            <div class="card-content">
                                <div class="device-image-container">
                                    ${deviceImage ? 
                                      `<div class="device-image" style="background-image: url('${deviceImage}')"></div>` : 
                                      `<div class="bluetooth-icon">
                                          <svg viewBox="0 0 24 24" width="24" height="24">
                                              <path fill="currentColor" d="M14.88,16.29L13,18.17V14.41M13,5.83L14.88,7.71L13,9.58M17.71,7.71L12,2H11V9.58L6.41,5L5,6.41L10.59,12L5,17.58L6.41,19L11,14.41V22H12L17.71,16.29L13.41,12L17.71,7.71Z" />
                                          </svg>
                                       </div>`
                                    }
                                </div>
                                
                                <div class="device-details">
                                    <div class="device-name">${name}</div>
                                    <div class="mac-address">${address}</div>
                                    
                                    <div class="vendor-row">
                                        ${vendorLogo ? 
                                          `<div class="vendor-logo" style="background-image: url('${vendorLogo}')"></div>` : 
                                          ''
                                        }
                                        ${vendor ? `<div class="vendor">${vendor}</div>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <style>
                .bluetooth-section {
                    margin-bottom: 25px;
                    background: #f8f9fa;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                }
                
                .section-title {
                    padding: 20px;
                    font-size: 18px;
                    font-weight: 600;
                    color: white;
                    background: linear-gradient(135deg, #10b981, #3a7bd5);
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                    position: relative;
                    overflow: hidden;
                    border-radius: 12px 12px 0 0;
                }
                
                .section-title::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transform: translateX(-100%);
                    animation: shimmer 3s infinite;
                }
                
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
                
                .bluetooth-devices-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 20px;
                    padding: 20px;
                    background: linear-gradient(145deg, #f5f7fa, #edf2f7);
                }
                
                .bluetooth-card {
                    position: relative;
                    background: #fff;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                    border: 1px solid rgba(0,0,0,0.05);
                }
                
                .bluetooth-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 15px 30px rgba(0,0,0,0.12);
                }
                
                .card-content {
                    display: flex;
                    align-items: center;
                    padding: 0;
                    height: 140px;
                }
                
                .device-image-container {
                    width: 140px;
                    height: 140px;
                    min-width: 140px;
                    position: relative;
                    overflow: hidden;
                    background: #f5f7fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .device-image {
                    width: 100%;
                    height: 100%;
                    background-size: contain;
                    background-position: center;
                    background-repeat: no-repeat;
                    transition: transform 0.4s ease;
                }
                
                .bluetooth-card:hover .device-image {
                    transform: scale(1.05);
                }
                
                .bluetooth-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #5b7bf0, #3a7bd5);
                    color: white;
                    box-shadow: 0 3px 8px rgba(91, 123, 240, 0.3);
                }
                
                .device-details {
                    flex: 1;
                    padding: 20px;
                    position: relative;
                }
                
                .device-name {
                    font-size: 18px;
                    font-weight: 600;
                    color: #4a67cf;
                    margin-bottom: 10px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    position: relative;
                }
                
                .device-name::after {
                    content: '';
                    position: absolute;
                    bottom: -4px;
                    left: 0;
                    width: 50px;
                    height: 2px;
                    background: linear-gradient(90deg, #5b7bf0, transparent);
                }
                
                .mac-address {
                    font-family: monospace;
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 15px;
                    position: relative;
                    display: inline-block;
                    padding: 4px 10px;
                    background: rgba(91, 123, 240, 0.08);
                    border-radius: 4px;
                }
                
                .vendor-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .vendor-logo {
                    width: 24px;
                    height: 24px;
                    background-size: contain;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-color: white;
                    border-radius: 4px;
                }
                
                .vendor {
                    font-size: 13px;
                    color: #5b7bf0;
                    font-weight: 500;
                }
                
                @media (max-width: 768px) {
                    .bluetooth-devices-grid {
                        grid-template-columns: 1fr;
                    }
                }
                
                @media (prefers-color-scheme: dark) {
                    .bluetooth-section {
                        background: #1a1d21;
                    }
                    
                    .section-title {
                        background: linear-gradient(135deg, #0d9488, #3a4a7c);
                    }
                    
                    .bluetooth-devices-grid {
                        background: linear-gradient(145deg, #1a1d21, #262b33);
                    }
                    
                    .bluetooth-card {
                        background: #2c3036;
                        border-color: rgba(255,255,255,0.05);
                    }
                    
                    .device-image-container {
                        background: #1f2226;
                    }
                    
                    .device-name {
                        color: #88a1f8;
                    }
                    
                    .mac-address {
                        color: #b0b0b0;
                        background: rgba(91, 123, 240, 0.15);
                    }
                    
                    .vendor {
                        color: #88a1f8;
                    }
                }
            </style>
        </div>
    `;
}

export { createBluetoothDevicesGrid }; 