import { formatBytes } from '../utils.js';

/**
 * Get a descriptive title for a CPU flag
 * @param {string} flag - The CPU flag
 * @returns {string} Description of the flag
 */
function getFlagTitle(flag) {
    const flagDescriptions = {
        'mmx': 'Multimedia Extensions - SIMD instructions for integer operations',
        'sse': 'Streaming SIMD Extensions - SIMD instructions for floating point operations',
        'sse2': 'Streaming SIMD Extensions 2 - Additional SIMD instructions',
        'sse3': 'Streaming SIMD Extensions 3 - Additional SIMD instructions',
        'ssse3': 'Supplemental SSE3 - Additional SIMD instructions',
        'sse4_1': 'Streaming SIMD Extensions 4.1 - Additional SIMD instructions',
        'sse4_2': 'Streaming SIMD Extensions 4.2 - Additional SIMD instructions',
        'avx': 'Advanced Vector Extensions - 256-bit SIMD instructions',
        'avx2': 'Advanced Vector Extensions 2 - Enhanced 256-bit SIMD instructions',
        'aes': 'Advanced Encryption Standard - Hardware acceleration for AES encryption',
        'pclmulqdq': 'Carry-Less Multiplication - Used in cryptographic operations',
        'fma': 'Fused Multiply-Add - For floating-point operations',
        'htt': 'Hyper-Threading Technology - Allows a single CPU core to execute multiple threads',
        'tm': 'Thermal Monitor - CPU thermal management',
        'acpi': 'Advanced Configuration and Power Interface',
        'pse': 'Page Size Extension - Supports larger page sizes',
        'pse36': 'Page Size Extension 36-bit - Extended page size with 36-bit addressing',
        'mce': 'Machine Check Exception - CPU error reporting',
        'cmov': 'Conditional Move Instruction - CPU optimization',
        'mtrr': 'Memory Type Range Registers - Controls caching behavior',
        'pae': 'Physical Address Extension - Supports more than 4GB of physical memory',
        'apic': 'Advanced Programmable Interrupt Controller',
        'cid': 'Context ID - Virtualization support',
        'fpu': 'Floating Point Unit - Hardware support for floating-point operations',
        'vme': 'Virtual 8086 Mode Enhancement',
        'de': 'Debugging Extensions',
        'tsc': 'Time Stamp Counter',
        'msr': 'Model Specific Registers',
        'ia64': 'Intel Itanium Architecture 64-bit',
        'pbe': 'Pending Break Enable - Power management feature',
        'sep': 'SYSENTER/SYSEXIT Instructions',
        'psn': 'Processor Serial Number',
        'clfsh': 'CLFLUSH Instruction',
        'ds': 'Debug Store',
        'ss': 'Self Snoop'
    };
    
    return flagDescriptions[flag] || `CPU Flag: ${flag}`;
}

/**
 * Get a description paragraph for CPU flags
 * @param {string} flags - CPU flags string
 * @returns {string} Description of the main flags
 */
function getFlagDescription(flags) {
    // Extract key flags to explain the CPU capabilities
    const flagsArray = flags.split(' ');
    let description = 'This CPU supports';
    
    // Add MMX/SSE capabilities
    const simdFlags = flagsArray.filter(f => f.startsWith('sse') || f === 'mmx');
    if (simdFlags.length > 0) {
        description += ` SIMD instructions (${simdFlags.join(', ')})`;
    }
    
    // Add Hyper-Threading
    if (flagsArray.includes('htt')) {
        description += ', Hyper-Threading Technology';
    }
    
    // Add virtualization info
    if (flagsArray.includes('vmx') || flagsArray.includes('svm')) {
        description += ', hardware virtualization';
    }
    
    // Add power management
    if (flagsArray.includes('acpi') || flagsArray.includes('tm')) {
        description += ', advanced power management';
    }
    
    return description + '.';
}

/**
 * Creates a hardware card with a striking, modern design
 * @param {string} title - The title of the hardware card
 * @param {Object} data - The hardware data
 * @param {string} imageUrl - URL for hardware image (optional)
 * @param {string} logoUrl - URL for vendor logo
 * @param {Object} cpuStats - CPU usage statistics (optional)
 * @returns {string} HTML string for the hardware card
 */
function createHardwareCard(title, data, imageUrl, logoUrl, cpuStats) {
    // Extract key specs to display
    const specs = [];
    
    if (title === 'Baseboard') {
        if (data.manufacturer) specs.push({ label: 'Manufacturer', value: data.manufacturer });
        if (data.model) specs.push({ label: 'Model', value: data.model });
        if (data.version) specs.push({ label: 'Version', value: data.version });
        if (data.serial) specs.push({ label: 'Serial', value: data.serial });
        if (data.memMax) specs.push({ label: 'Max Memory', value: formatBytes(data.memMax) });
        if (data.memSlots) specs.push({ label: 'Memory Slots', value: data.memSlots });
    } 
    else if (title === 'BIOS') {
        if (data.vendor) specs.push({ label: 'Vendor', value: data.vendor });
        if (data.version) specs.push({ label: 'Version', value: data.version });
        if (data.releaseDate) specs.push({ label: 'Release Date', value: data.releaseDate });
        if (data.serial) specs.push({ label: 'Serial', value: data.serial });
        if (data.vendorVersion) specs.push({ label: 'Vendor Version', value: data.vendorVersion });
    }
    else if (title === 'Motherboard') {
        // This is a special combined card for Baseboard and BIOS
        const baseboard = data.baseboard || {};
        const bios = data.bios || {};
        
        // Organize data in sections
        if (baseboard.manufacturer) specs.push({ label: 'Manufacturer', value: baseboard.manufacturer, section: 'baseboard' });
        if (baseboard.model) specs.push({ label: 'Model', value: baseboard.model, section: 'baseboard' });
        if (baseboard.version) specs.push({ label: 'Version', value: baseboard.version, section: 'baseboard' });
        if (baseboard.serial) specs.push({ label: 'Serial', value: baseboard.serial, section: 'baseboard' });
        if (baseboard.memMax) specs.push({ label: 'Max Memory', value: formatBytes(baseboard.memMax), section: 'baseboard' });
        if (baseboard.memSlots) specs.push({ label: 'Memory Slots', value: baseboard.memSlots, section: 'baseboard' });
        
        if (bios.vendor) specs.push({ label: 'BIOS Vendor', value: bios.vendor, section: 'bios' });
        if (bios.version) specs.push({ label: 'BIOS Version', value: bios.version, section: 'bios' });
        if (bios.releaseDate) specs.push({ label: 'Release Date', value: bios.releaseDate, section: 'bios' });
        if (bios.serial) specs.push({ label: 'BIOS Serial', value: bios.serial, section: 'bios' });
        if (bios.vendorVersion) specs.push({ label: 'Vendor Version', value: bios.vendorVersion, section: 'bios' });
    }
    else if (title === 'System') {
        if (data.manufacturer) specs.push({ label: 'Manufacturer', value: data.manufacturer });
        if (data.model) specs.push({ label: 'Model', value: data.model });
        if (data.version) specs.push({ label: 'Version', value: data.version || 'N/A' });
        if (data.serial) specs.push({ label: 'Serial', value: data.serial });
        if (data.sku) specs.push({ label: 'SKU', value: data.sku });
        if (data.virtual !== undefined) specs.push({ label: 'Virtual', value: data.virtual ? 'Yes' : 'No' });
        
        // Add system identification data if available
        if (data.hardwareUUID || data.hwUUID) specs.push({ label: 'Hardware UUID', value: data.hardwareUUID || data.hwUUID, section: 'id' });
        
        // Add MAC addresses if available
        if (data.macAddresses && Array.isArray(data.macAddresses) && data.macAddresses.length > 0) {
            // Format each MAC address as a separate item
            data.macAddresses.forEach((mac, index) => {
                specs.push({ 
                    label: `MAC Address ${index + 1}`, 
                    value: mac,
                    section: 'network'
                });
            });
        }
    }
    else if (title === 'CPU') {
        if (data.manufacturer) specs.push({ label: 'Manufacturer', value: data.manufacturer });
        if (data.brand) specs.push({ label: 'Brand', value: data.brand });
        if (data.vendor) specs.push({ label: 'Vendor', value: data.vendor });
        
        // Enhanced speed information
        if (data.speed) specs.push({ label: 'Current Speed', value: data.speed + ' GHz' });
        if (data.speedMin) specs.push({ label: 'Min Speed', value: data.speedMin + ' GHz' });
        if (data.speedMax) specs.push({ label: 'Max Speed', value: data.speedMax + ' GHz' });
        
        // Core information
        if (data.cores) specs.push({ label: 'Cores', value: data.cores });
        if (data.physicalCores) specs.push({ label: 'Physical Cores', value: data.physicalCores });
        if (data.performanceCores) specs.push({ label: 'P-Cores', value: data.performanceCores });
        if (data.efficiencyCores) specs.push({ label: 'E-Cores', value: data.efficiencyCores });
        if (data.processors) specs.push({ label: 'Processors', value: data.processors });
        if (data.socket) specs.push({ label: 'Socket', value: data.socket });
        
        // Cache information
        if (data.cache) {
            if (data.cache.l1d) specs.push({ label: 'L1 Data Cache', value: formatBytes(data.cache.l1d) });
            if (data.cache.l1i) specs.push({ label: 'L1 Instr Cache', value: formatBytes(data.cache.l1i) });
            if (data.cache.l2) specs.push({ label: 'L2 Cache', value: formatBytes(data.cache.l2) });
            if (data.cache.l3) specs.push({ label: 'L3 Cache', value: formatBytes(data.cache.l3) });
        }
        
        // Additional technical details
        if (data.virtualization !== undefined) specs.push({ label: 'Virtualization', value: data.virtualization ? 'Supported' : 'Not Supported' });
        if (data.family) specs.push({ label: 'Family', value: data.family });
        if (data.model) specs.push({ label: 'Model', value: data.model });
        if (data.stepping) specs.push({ label: 'Stepping', value: data.stepping });
    }
    else if (title === 'Graphics') {
        if (data.model) specs.push({ label: 'Model', value: data.model });
        if (data.vendor) specs.push({ label: 'Vendor', value: data.vendor });
        if (data.vram) specs.push({ label: 'VRAM', value: formatBytes(data.vram * 1024 * 1024) }); // Convert MB to bytes
        if (data.deviceId) specs.push({ label: 'Device ID', value: data.deviceId });
        if (data.bus) specs.push({ label: 'Bus', value: data.bus });
        if (data.vramDynamic !== undefined) specs.push({ label: 'Dynamic VRAM', value: data.vramDynamic ? 'Yes' : 'No' });
        if (data.driverVersion) specs.push({ label: 'Driver Version', value: data.driverVersion });
        if (data.currentRefreshRate) specs.push({ label: 'Refresh Rate', value: data.currentRefreshRate + ' Hz' });
    }
    else if (title === 'Memory') {
        if (data.size) specs.push({ label: 'Size', value: formatBytes(data.size) });
        if (data.type) specs.push({ label: 'Type', value: data.type });
        if (data.clockSpeed) specs.push({ label: 'Clock Speed', value: data.clockSpeed + ' MHz' });
        if (data.formFactor) specs.push({ label: 'Form Factor', value: data.formFactor });
        if (data.manufacturer) specs.push({ label: 'Manufacturer', value: data.manufacturer });
        if (data.bank) specs.push({ label: 'Bank', value: data.bank });
        if (data.serialNum) specs.push({ label: 'Serial', value: data.serialNum });
        if (data.voltageConfigured) specs.push({ label: 'Voltage', value: data.voltageConfigured + 'V' });
        if (data.ecc !== undefined) specs.push({ label: 'ECC', value: data.ecc ? 'Yes' : 'No' });
    }
    else if (title === 'Battery') {
        // Extract common battery metrics
        const percent = data.percent || parseInt(data.currentCharge || 0);
        const healthPercent = data['Battery Health'] ? 
            parseInt(data['Battery Health']) : 
            (data.designedCapacity && data.maxCapacity ? Math.round((data.maxCapacity / data.designedCapacity) * 100) : 0);
        
        // Status detection
        const status = data.status || data.Status || '';
        const isCharging = status.toLowerCase().includes('charging');
        
        // Add battery specifications with sections - use clearer labels for display
        specs.push({ label: 'Status', value: status || 'Discharging', section: 'status', highlight: true });
        specs.push({ label: 'Charge', value: percent + '%', section: 'status', highlight: true });
        specs.push({ label: 'Health', value: healthPercent + '%', section: 'status', highlight: true });
        
        // Capacity section with units
        const capacityUnit = data.capacityUnit || 'mWh';
        if (data.currentCapacity || data['Current Capacity']) 
            specs.push({ label: 'Current', value: `${data.currentCapacity || data['Current Capacity']} ${capacityUnit}`, section: 'capacity' });
        if (data.maxCapacity || data['Maximum Capacity']) 
            specs.push({ label: 'Maximum', value: `${data.maxCapacity || data['Maximum Capacity']} ${capacityUnit}`, section: 'capacity' });
        if (data.designedCapacity || data['Designed Capacity']) 
            specs.push({ label: 'Designed', value: `${data.designedCapacity || data['Designed Capacity']} ${capacityUnit}`, section: 'capacity' });
        
        // Technical details section
        if (data.voltage || data.Voltage) 
            specs.push({ label: 'Voltage', value: `${data.voltage || data.Voltage}V`, section: 'details' });
        if (data.cycleCount || data['Cycle Count']) 
            specs.push({ label: 'Cycle Count', value: data.cycleCount || data['Cycle Count'], section: 'details' });
        if (data.model || data.Model) 
            specs.push({ label: 'Model', value: data.model || data.Model, section: 'details' });
    }
    else if (title === 'Display') {
        // Display specifications
        if (data.model) specs.push({ label: 'Model', value: data.model });
        if (data.manufacturer) specs.push({ label: 'Manufacturer', value: data.manufacturer });
        if (data.connection) specs.push({ label: 'Connection', value: data.connection });
        if (data.physicalSize) specs.push({ label: 'Physical Size', value: data.physicalSize });
        if (data.resolution) specs.push({ label: 'Resolution', value: data.resolution });
        if (data.refreshRate) specs.push({ label: 'Refresh Rate', value: data.refreshRate });
        if (data.pixelDepth) specs.push({ label: 'Color Depth', value: data.pixelDepth });
        if (data.builtin !== undefined) specs.push({ label: 'Built-in', value: data.builtin ? 'Yes' : 'No' });
    }
    
    // Create a unique accent color based on title
    let accentColor, secondaryColor, bgGradient;
    switch(title) {
        case 'System': 
            accentColor = '#3498db'; 
            secondaryColor = '#2980b9';
            bgGradient = 'linear-gradient(135deg, #f5f7fa, #e8edf2)';
            break;
        case 'CPU': 
            accentColor = '#e74c3c'; 
            secondaryColor = '#c0392b';
            bgGradient = 'linear-gradient(135deg, #faf5f5, #f2e8e8)';
            break;
        case 'Baseboard': 
            accentColor = '#2ecc71'; 
            secondaryColor = '#27ae60';
            bgGradient = 'linear-gradient(135deg, #f5faf7, #e8f2ec)';
            break;
        case 'BIOS': 
            accentColor = '#9b59b6'; 
            secondaryColor = '#8e44ad';
            bgGradient = 'linear-gradient(135deg, #f9f5fa, #efe8f2)';
            break;
        case 'Graphics':
            accentColor = '#3498db';
            secondaryColor = '#2980b9';
            bgGradient = 'linear-gradient(135deg, #f5f8fd, #e7f0fc)';
            break;
        case 'Memory':
            accentColor = '#f39c12';
            secondaryColor = '#d35400';
            bgGradient = 'linear-gradient(135deg, #fdf9f5, #fcf4e7)';
            break;
        case 'Battery':
            accentColor = '#27ae60';
            secondaryColor = '#2ecc71';
            bgGradient = 'linear-gradient(135deg, #f5faf7, #e8f2ec)';
            break;
        case 'Display':
            accentColor = '#3498db';
            secondaryColor = '#2980b9';
            bgGradient = 'linear-gradient(135deg, #f5f8fd, #e7f0fc)';
            break;
        default: 
            accentColor = '#1abc9c';
            secondaryColor = '#16a085';
            bgGradient = 'linear-gradient(135deg, #f5fafa, #e8f2f2)';
    }
    
    const isSystem = title === 'System';
    
    // Special handling for System image
    let imageContent = '';
    if (imageUrl) {
        if (isSystem) {
            imageContent = `
                <div style="
                    position: relative;
                    width: 100%;
                    height: 130px;
                    overflow: hidden;
                    margin-bottom: 15px;
                    border-radius: 8px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                ">
                    <div style="
                        position: absolute;
                        top: 0;
                        right: 0;
                        width: 70px;
                        height: 70px;
                    "></div>
                    <div style="
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 70px;
                        height: 70px;
                    "></div>
                    <img src="${imageUrl}" alt="${title}" 
                         style="
                            max-width: 85%;
                            max-height: 85%;
                            object-fit: contain;
                            transform: perspective(800px) rotateX(10deg);
                            transition: transform 0.3s ease;
                         " 
                         onmouseover="this.style.transform='perspective(800px) rotateX(0deg) scale(1.02)'"
                         onmouseout="this.style.transform='perspective(800px) rotateX(10deg)'"
                         onerror="this.src='https://via.placeholder.com/200?text=${encodeURIComponent(title)}'" />
                </div>
            `;
        } else {
            // Other hardware images (CPU, etc)
            imageContent = `
                <div style="
                    width: 80px;
                    height: 80px;
                    margin-right: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    overflow: hidden;
                ">
                    <img src="${imageUrl}" alt="${title}" 
                         style="max-width: 85%; max-height: 85%; object-fit: contain;" 
                         onerror="this.src='https://via.placeholder.com/80?text=${encodeURIComponent(title)}'" />
                </div>
            `;
        }
    }
    
    // Create a layout based on whether it's the System card or other cards
    if (isSystem) {
        return `
            <div style="
                background: white;
                color: #333;
                border-radius: 10px;
                box-shadow: 0 3px 15px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1);
                overflow: hidden;
                margin-bottom: 10px;
                height: 100%;
                display: flex;
                flex-direction: column;
                border: 1px solid #f0f0f0;
                transition: all 0.2s ease;
                position: relative;
            " onmouseover="this.style.boxShadow='0 5px 20px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1)'; this.style.transform='translateY(-2px)'"
               onmouseout="this.style.boxShadow='0 3px 15px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)'; this.style.transform='translateY(0)'">
                <div style="
                    background: ${bgGradient};
                    padding: 12px 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid ${accentColor};
                ">
                    <h3 style="
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                        color: ${accentColor};
                        letter-spacing: 0.3px;
                    ">${title}${data.titleBadge ? ` ${data.titleBadge}` : ''}</h3>
                    
                    ${logoUrl ? `
                        <img src="${logoUrl}" alt="Vendor Logo" style="
                            height: 20px;
                            width: auto;
                            max-width: 50px;
                            object-fit: contain;
                        " />
                    ` : ''}
                </div>
                
                <div style="padding: 12px 15px; flex: 1; display: flex; flex-direction: column;">
                    ${imageContent}
                    
                    <!-- Basic System Information -->
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                        gap: 10px;
                        font-size: 12px;
                        margin-bottom: ${specs.some(spec => spec.section === 'id' || spec.section === 'network') ? '15px' : '0'};
                    ">
                        ${specs.filter(spec => !spec.section).map(spec => `
                            <div>
                                <span style="
                                    display: block;
                                    color: #666;
                                    font-size: 10px;
                                    letter-spacing: 0.3px;
                                    margin-bottom: 2px;
                                    text-transform: uppercase;
                                ">${spec.label}</span>
                                <span style="
                                    display: block;
                                    color: #333;
                                    white-space: nowrap;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    font-weight: 500;
                                ">${spec.value}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- System Identification Section -->
                    ${specs.some(spec => spec.section === 'id') ? `
                        <div style="margin-top: 10px;">
                            <div style="
                                font-size: 12px;
                                font-weight: 600;
                                color: ${accentColor};
                                margin-bottom: 8px;
                                border-bottom: 1px solid #eee;
                                padding-bottom: 3px;
                            ">System Identification</div>
                            
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${specs.filter(spec => spec.section === 'id').map(spec => `
                                    <div style="display: flex; align-items: center; justify-content: space-between;">
                                        <div style="flex: 1;">
                                            <span style="
                                                display: block;
                                                color: #666;
                                                font-size: 10px;
                                                letter-spacing: 0.3px;
                                                margin-bottom: 3px;
                                                text-transform: uppercase;
                                            ">${spec.label}</span>
                                            <span style="
                                                display: block;
                                                color: #333;
                                                font-family: monospace;
                                                font-size: 11px;
                                                overflow: hidden;
                                                text-overflow: ellipsis;
                                                background: #f8f9fa;
                                                padding: 4px 6px;
                                                border-radius: 3px;
                                                border: 1px solid #f0f0f0;
                                            ">${spec.value}</span>
                                        </div>
                                        <div style="
                                            width: 28px;
                                            height: 28px;
                                            display: flex;
                                            justify-content: center;
                                            align-items: center;
                                            margin-left: 8px;
                                            cursor: pointer;
                                            background: #f0f0f0;
                                            border-radius: 4px;
                                            transition: background-color 0.2s ease;
                                        " title="Copy to clipboard"
                                           onclick="navigator.clipboard.writeText('${spec.value}'); this.innerHTML='✓'; setTimeout(() => { this.innerHTML='<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' fill=\\'currentColor\\' viewBox=\\'0 0 16 16\\'><path d=\\'M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z\\'/><path d=\\'M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z\\'/></svg>'; }, 1000);"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                            </svg>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Network Addresses Section -->
                    ${specs.some(spec => spec.section === 'network') ? `
                        <div style="margin-top: 15px;">
                            <div style="
                                font-size: 12px;
                                font-weight: 600;
                                color: ${accentColor};
                                margin-bottom: 8px;
                                border-bottom: 1px solid #eee;
                                padding-bottom: 3px;
                            ">Network Addresses</div>
                            
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${specs.filter(spec => spec.section === 'network').map(spec => `
                                    <div style="
                                        display: inline-flex;
                                        align-items: center;
                                        background: #f8f9fa;
                                        border: 1px solid #f0f0f0;
                                        border-radius: 4px;
                                        padding: 4px 8px;
                                        font-family: monospace;
                                        font-size: 12px;
                                    ">
                                        ${spec.value}
                                        <div style="
                                            width: 18px;
                                            height: 18px;
                                            display: flex;
                                            justify-content: center;
                                            align-items: center;
                                            margin-left: 6px;
                                            cursor: pointer;
                                            border-radius: 3px;
                                            transition: background-color 0.2s ease;
                                        " title="Copy to clipboard"
                                           onclick="navigator.clipboard.writeText('${spec.value}'); this.innerHTML='✓'; setTimeout(() => { this.innerHTML='<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'12\\' height=\\'12\\' fill=\\'currentColor\\' viewBox=\\'0 0 16 16\\'><path d=\\'M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z\\'/><path d=\\'M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z\\'/></svg>'; }, 1000);"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                            </svg>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } else if (title === 'Display') {
        // Special layout for Display
        // Calculate display dimensions for visualization
        let displayVisualization = '';
        if (data.sizeXcm && data.sizeYcm) {
            // Base dimensions - keep proportional to the actual display
            const containerWidth = 200;
            const containerHeight = 120;
            
            // Calculate scaled dimensions maintaining aspect ratio
            const aspectRatio = data.sizeXcm / data.sizeYcm;
            let displayWidth, displayHeight;
            
            if (aspectRatio > containerWidth / containerHeight) {
                // Width constrained
                displayWidth = Math.round(containerWidth * 0.8);
                displayHeight = Math.round(displayWidth / aspectRatio);
            } else {
                // Height constrained
                displayHeight = Math.round(containerHeight * 0.8);
                displayWidth = Math.round(displayHeight * aspectRatio);
            }
            
            // Calculate diagonal size in inches
            const diagonalInches = (Math.sqrt(Math.pow(data.sizeXcm, 2) + Math.pow(data.sizeYcm, 2)) / 2.54).toFixed(1);
            
            displayVisualization = `
                <div style="
                    padding: 15px 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                ">
                    <div style="
                        width: ${displayWidth}px;
                        height: ${displayHeight}px;
                        background: linear-gradient(45deg, #2c3e50, #3498db);
                        border-radius: 4px;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                        position: relative;
                    ">
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            color: white;
                            text-align: center;
                            white-space: nowrap;
                            text-shadow: 1px 1px 2px rgba(0,0,0,0.4);
                        ">
                            <div style="font-size: 14px; margin-bottom: 4px;">${data.sizeXcm}cm × ${data.sizeYcm}cm</div>
                            <div style="font-size: 12px; opacity: 0.8;">(${diagonalInches}")</div>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div style="
                background: white;
                color: #333;
                border-radius: 10px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1);
                overflow: hidden;
                margin-bottom: 10px;
                height: 100%;
                display: flex;
                flex-direction: column;
                border: 1px solid #f0f0f0;
                transition: all 0.2s ease;
            " onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)'"
               onmouseout="this.style.boxShadow='0 3px 10px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1)'">
                <div style="
                    background: ${bgGradient};
                    padding: 10px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid ${accentColor};
                ">
                    <h3 style="
                        margin: 0;
                        font-size: 15px;
                        font-weight: 600;
                        color: ${accentColor};
                        letter-spacing: 0.3px;
                    ">${title}${data.titleBadge ? ` ${data.titleBadge}` : ''}</h3>
                    
                    ${logoUrl ? `
                        <img src="${logoUrl}" alt="Vendor Logo" style="
                            height: 20px;
                            width: auto;
                            max-width: 50px;
                            object-fit: contain;
                        " />
                    ` : ''}
                </div>
                
                <div style="padding: 12px; flex: 1; display: flex; flex-direction: column;">
                    ${displayVisualization}
                    
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                        gap: 10px;
                        font-size: 12px;
                    ">
                        ${specs.map(spec => `
                            <div>
                                <span style="
                                    display: block;
                                    color: #666;
                                    font-size: 10px;
                                    letter-spacing: 0.3px;
                                    margin-bottom: 2px;
                                    text-transform: uppercase;
                                ">${spec.label}</span>
                                <span style="
                                    display: block;
                                    color: #333;
                                    white-space: nowrap;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    font-weight: 500;
                                ">${spec.value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } else {
        // Design for other cards (CPU, BIOS, Baseboard)
        return `
            <div style="
                background: white;
                color: #333;
                border-radius: 10px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1);
                overflow: hidden;
                margin-bottom: 10px;
                height: 100%;
                display: flex;
                flex-direction: column;
                border: 1px solid #f0f0f0;
                transition: all 0.2s ease;
            " onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)'"
               onmouseout="this.style.boxShadow='0 3px 10px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1)'">
                <div style="
                    background: ${bgGradient};
                    padding: 10px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid ${accentColor};
                ">
                    <h3 style="
                        margin: 0;
                        font-size: 15px;
                        font-weight: 600;
                        color: ${accentColor};
                        letter-spacing: 0.3px;
                    ">${title}</h3>
                    
                    ${logoUrl ? `
                        <img src="${logoUrl}" alt="Vendor Logo" style="
                            height: 20px;
                            width: auto;
                            max-width: 50px;
                            object-fit: contain;
                        " />
                    ` : ''}
                </div>
                
                ${title === 'CPU' ? `
                    <div style="padding: 12px; flex: 1;">
                        <div style="display: flex; margin-bottom: 10px;">
                            ${imageContent}
                            
                            <div style="flex: 1; min-width: 0;">
                                <!-- Basic CPU info highlighted -->
                                <div style="margin-bottom: 5px;">
                                    <span style="
                                        display: block;
                                        color: #333;
                                        font-size: 14px;
                                        font-weight: 600;
                                    ">${data.brand}</span>
                                </div>
                                
                                <!-- Speed information -->
                                <div style="margin-bottom: 5px; display: flex; gap: 10px; align-items: center;">
                                    <span style="
                                        font-size: 13px;
                                        font-weight: 600;
                                        color: ${data.speed === data.speedMin ? '#ffc107' : '#28a745'};
                                    ">${data.speed} GHz</span>
                                    
                                    <span style="color: #666; font-size: 11px;">
                                        (Range: ${data.speedMin} - ${data.speedMax} GHz)
                                    </span>
                                </div>
                                
                                <!-- Core information -->
                                <div style="margin-bottom: 5px; display: flex; gap: 10px;">
                                    <span style="font-size: 12px; color: #666;">
                                        <b>${data.physicalCores}</b> physical cores
                                    </span>
                                    <span style="font-size: 12px; color: #666;">
                                        <b>${data.cores}</b> logical cores
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        ${cpuStats ? `
                        <!-- CPU Usage visualization -->
                        <div style="margin: 15px 0; padding-top: 15px; border-top: 1px solid #eee;">
                            <div style="font-size: 12px; font-weight: 600; color: ${accentColor}; margin-bottom: 10px;
                                        border-bottom: 1px solid #eee; padding-bottom: 3px;">
                                CPU Usage
                            </div>
                            <div style="display: flex; align-items: flex-start;">
                                <div style="position: relative; width: 90px; height: 90px; margin-right: 15px;">
                                    ${(() => {
                                        // Determine color based on usage
                                        const cpuPercentage = Math.max(cpuStats.totalCpuUsage, 0.1);
                                        const getUsageColor = (percent) => {
                                            if (percent < 60) return '#28a745'; // Green for low usage
                                            if (percent < 80) return '#ffc107'; // Yellow for moderate usage
                                            return '#dc3545'; // Red for high usage
                                        };
                                        const usageColor = getUsageColor(cpuPercentage);
                                        
                                        return `
                                        <svg width="90" height="90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="transparent" stroke="#f3f3f3" stroke-width="10"></circle>
                                            <circle cx="50" cy="50" r="45" fill="transparent" stroke="${usageColor}" stroke-width="10" 
                                                    stroke-dasharray="${2 * Math.PI * 45}" 
                                                    stroke-dashoffset="${2 * Math.PI * 45 * (1 - cpuPercentage / 100)}" 
                                                    transform="rotate(-90 50 50)"></circle>
                                        </svg>
                                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                                            <div style="font-size: 22px; font-weight: bold; color: ${usageColor};">${cpuPercentage.toFixed(1)}%</div>
                                            <div style="font-size: 11px; color: #666;">Used</div>
                                        </div>
                                        `;
                                    })()}
                                </div>
                                <div style="flex-grow: 1;">
                                    <div style="margin-bottom: 5px;">
                                        <span style="font-size: 12px; color: #666;">Process Count: </span>
                                        <span style="font-size: 12px; font-weight: 500;">${cpuStats.processCount}</span>
                                    </div>
                                    <div style="margin: 8px 0 5px 0; font-size: 12px; font-weight: 500;">Top Processe:</div>
                                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                        ${cpuStats.topProcesses.slice(0, 1).map(p => `
                                        <tr>
                                            <td style="padding: 2px 0;">${p.name}</td>
                                            <td style="padding: 2px 0; text-align: right; font-weight: 500;">${p.usage.toFixed(2)}%</td>
                                        </tr>
                                        `).join('')}
                                    </table>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                        
                        <!-- Organized sections -->
                        <div style="margin-top: 15px;">
                            ${data.cache ? `
                                <div style="margin-bottom: 10px;">
                                    <div style="font-size: 12px; font-weight: 600; color: ${accentColor}; margin-bottom: 5px; 
                                                border-bottom: 1px solid #eee; padding-bottom: 3px;">
                                        Cache Memory
                                    </div>
                                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; font-size: 12px;">
                                        ${data.cache.l1d ? `
                                            <div>
                                                <span style="color: #666;">L1 Data:</span>
                                                <span style="font-weight: 500;">${formatBytes(data.cache.l1d)}</span>
                                            </div>
                                        ` : ''}
                                        
                                        ${data.cache.l1i ? `
                                            <div>
                                                <span style="color: #666;">L1 Instruction:</span>
                                                <span style="font-weight: 500;">${formatBytes(data.cache.l1i)}</span>
                                            </div>
                                        ` : ''}
                                        
                                        ${data.cache.l2 ? `
                                            <div>
                                                <span style="color: #666;">L2:</span>
                                                <span style="font-weight: 500;">${formatBytes(data.cache.l2)}</span>
                                            </div>
                                        ` : ''}
                                        
                                        ${data.cache.l3 ? `
                                            <div>
                                                <span style="color: #666;">L3:</span>
                                                <span style="font-weight: 500;">${formatBytes(data.cache.l3)}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            ` : ''}
                            
                            <div style="margin-bottom: 10px;">
                                <div style="font-size: 12px; font-weight: 600; color: ${accentColor}; margin-bottom: 5px;
                                            border-bottom: 1px solid #eee; padding-bottom: 3px;">
                                    Technical Details
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; font-size: 12px;">
                                    ${data.family ? `
                                        <div>
                                            <span style="color: #666;">Family:</span>
                                            <span style="font-weight: 500;">${data.family}</span>
                                        </div>
                                    ` : ''}
                                    
                                    ${data.model ? `
                                        <div>
                                            <span style="color: #666;">Model:</span>
                                            <span style="font-weight: 500;">${data.model}</span>
                                        </div>
                                    ` : ''}
                                    
                                    ${data.stepping ? `
                                        <div>
                                            <span style="color: #666;">Stepping:</span>
                                            <span style="font-weight: 500;">${data.stepping}</span>
                                        </div>
                                    ` : ''}
                                    
                                    ${data.socket ? `
                                        <div>
                                            <span style="color: #666;">Socket:</span>
                                            <span style="font-weight: 500;">${data.socket}</span>
                                        </div>
                                    ` : ''}
                                    
                                    ${data.virtualization !== undefined ? `
                                        <div>
                                            <span style="color: #666;">Virtualization:</span>
                                            <span style="font-weight: 500; color: ${data.virtualization ? '#28a745' : '#dc3545'}">
                                                ${data.virtualization ? 'Supported' : 'Not Supported'}
                                            </span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            ${data.flags ? `
                                <div style="margin-bottom: 10px;">
                                    <div style="font-size: 12px; font-weight: 600; color: ${accentColor}; margin-bottom: 5px;
                                                border-bottom: 1px solid #eee; padding-bottom: 3px;">
                                        CPU Flags (Instruction Sets)
                                    </div>
                                    <div style="font-size: 12px; line-height: 1.4; color: #666;">
                                        ${getFlagDescription(data.flags)}
                                    </div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px;">
                                        ${data.flags.split(' ').map(flag => `
                                            <span style="
                                                display: inline-block;
                                                padding: 2px 6px;
                                                background: #f5f5f5;
                                                border-radius: 3px;
                                                font-size: 11px;
                                                color: #555;
                                                font-family: monospace;
                                                border: 1px solid #e0e0e0;
                                            " title="${getFlagTitle(flag)}">${flag}</span>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : title === 'Motherboard' ? `
                    <div style="padding: 12px; flex: 1;">
                        <div style="display: flex; margin-bottom: 10px;">
                            ${imageContent}
                            
                            <div style="flex: 1; min-width: 0;">
                                <!-- Basic info highlighted -->
                                <div style="margin-bottom: 5px;">
                                    <span style="
                                        display: block;
                                        color: #333;
                                        font-size: 14px;
                                        font-weight: 600;
                                    ">${data.baseboard?.manufacturer || data.bios?.vendor || 'System Hardware'}</span>
                                </div>
                                <div style="font-size: 12px; color: #666;">
                                    ${data.baseboard?.model ? `Model: <b>${data.baseboard.model}</b>` : ''}
                                    ${data.bios?.version ? `${data.baseboard?.model ? ' • ' : ''}BIOS: <b>${data.bios.version}</b>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Baseboard section -->
                        <div style="margin-top: 15px;">
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 12px; font-weight: 600; color: ${accentColor}; margin-bottom: 5px;
                                            border-bottom: 1px solid #eee; padding-bottom: 3px;">
                                    Motherboard
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; font-size: 12px;">
                                    ${specs.filter(spec => spec.section === 'baseboard').map(spec => `
                                        <div>
                                            <span style="color: #666;">${spec.label}:</span>
                                            <span style="font-weight: 500;">${spec.value}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <!-- BIOS section -->
                            <div style="margin-bottom: 10px;">
                                <div style="font-size: 12px; font-weight: 600; color: ${accentColor}; margin-bottom: 5px;
                                            border-bottom: 1px solid #eee; padding-bottom: 3px;">
                                    BIOS
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; font-size: 12px;">
                                    ${specs.filter(spec => spec.section === 'bios').map(spec => `
                                        <div>
                                            <span style="color: #666;">${spec.label}:</span>
                                            <span style="font-weight: 500;">${spec.value}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                ` : title === 'Battery' ? `
                    <div style="padding: 12px; flex: 1;">
                        <div style="display: flex; margin-bottom: 15px;">
                            ${imageContent || `
                                <div style="
                                    width: 80px;
                                    height: 80px;
                                    margin-right: 12px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    border-radius: 8px;
                                    overflow: hidden;
                                    background: ${bgGradient};
                                ">
                                    <span style="font-size: 32px;">🔋</span>
                                </div>
                            `}
                            
                            <div style="flex: 1; min-width: 0;">
                                <!-- Status info as a row with improved spacing -->
                                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                    ${specs.filter(spec => spec.section === 'status').map((spec, index) => {
                                        let statusIcon = '';
                                        let statusColor = '#333';
                                        
                                        if (spec.label === 'Status') {
                                            if (spec.value.toLowerCase().includes('charging')) {
                                                statusIcon = '⚡';
                                                statusColor = '#28a745';
                                            } else if (spec.value.toLowerCase().includes('discharg')) {
                                                statusIcon = '🔋';
                                                statusColor = '#fd7e14';
                                            }
                                        } else if (spec.label === 'Charge') {
                                            const charge = parseInt(spec.value);
                                            if (charge <= 20) statusColor = '#dc3545';
                                            else if (charge <= 50) statusColor = '#fd7e14';
                                            else if (charge <= 80) statusColor = '#28a745';
                                            else statusColor = '#28a745';
                                        } else if (spec.label === 'Health') {
                                            const health = parseInt(spec.value);
                                            if (health <= 50) statusColor = '#dc3545';
                                            else if (health <= 80) statusColor = '#fd7e14';
                                            else statusColor = '#28a745';
                                        }
                                        
                                        return `
                                            <div style="
                                                text-align: center; 
                                                padding: 0 5px;
                                                flex: 1;
                                                ${index > 0 ? 'border-left: 1px solid #f0f0f0;' : ''}
                                            ">
                                                <span style="
                                                    display: block;
                                                    color: #666;
                                                    font-size: 11px;
                                                    letter-spacing: 0.3px;
                                                    text-transform: uppercase;
                                                    margin-bottom: 6px;
                                                ">${spec.label}</span>
                                                <span style="
                                                    display: block;
                                                    color: ${statusColor};
                                                    font-size: 15px;
                                                    font-weight: 600;
                                                ">${statusIcon} ${spec.value}</span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                                
                                <!-- Futuristic battery visualization -->
                                ${(() => {
                                    // Extract battery data from specs
                                    const currentCapacitySpec = specs.find(s => s.label === 'Current' && s.section === 'capacity');
                                    const maxCapacitySpec = specs.find(s => s.label === 'Maximum' && s.section === 'capacity');
                                    const designedCapacitySpec = specs.find(s => s.label === 'Designed' && s.section === 'capacity');
                                    const chargeSpec = specs.find(s => s.label === 'Charge' && s.section === 'status');
                                    
                                    if (!currentCapacitySpec || !maxCapacitySpec || !designedCapacitySpec || !chargeSpec) {
                                        return '';
                                    }
                                    
                                    // Parse values
                                    const currentCapacity = parseInt(currentCapacitySpec.value);
                                    const maxCapacity = parseInt(maxCapacitySpec.value);
                                    const designedCapacity = parseInt(designedCapacitySpec.value);
                                    const chargePercent = parseInt(chargeSpec.value);
                                    const capacityUnit = currentCapacitySpec.value.split(' ')[1] || 'mWh';
                                    
                                    // Calculate percentages for visualization
                                    const healthPercent = Math.round((maxCapacity / designedCapacity) * 100);
                                    const currentChargeValue = Math.round((currentCapacity * chargePercent) / 100);
                                    
                                    // Visual colors
                                    const healthColor = healthPercent <= 50 ? '#dc3545' : healthPercent <= 80 ? '#fd7e14' : '#28a745';
                                    const chargeColor = chargePercent <= 20 ? '#dc3545' : chargePercent <= 50 ? '#fd7e14' : '#22c55e';
                                    
                                    return `
                                    <div style="margin-bottom: 20px;">
                                        <!-- Battery capacity visualization -->
                                        <div style="position: relative; margin-bottom: 25px;">
                                            <!-- Labels for the battery visualization -->
                                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; color: #666;">
                                                <div>0 ${capacityUnit}</div>
                                                <div style="position: absolute; left: ${(maxCapacity / designedCapacity) * 100}%; transform: translateX(-50%);">
                                                    <div style="width: 1px; height: 5px; background: ${healthColor}; margin: 0 auto;"></div>
                                                    <div>Max: ${maxCapacity} ${capacityUnit}</div>
                                                </div>
                                                <div>${designedCapacity} ${capacityUnit}</div>
                                            </div>
                                            
                                            <!-- Battery shape -->
                                            <div style="height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; box-shadow: inset 0 0 5px rgba(0,0,0,0.1);">
                                                <!-- Health indicator (max capacity vs designed) -->
                                                <div style="height: 100%; width: ${(maxCapacity / designedCapacity) * 100}%; background: linear-gradient(to right, ${healthColor}20, ${healthColor}40);
                                                            border-right: 2px dashed ${healthColor}; position: relative;">
                                                    <!-- Charge indicator (current charge) -->
                                                    <div style="height: 100%; width: ${chargePercent}%; background: linear-gradient(to right, ${chargeColor}80, ${chargeColor});
                                                                border-radius: 10px 0 0 10px; box-shadow: 0 0 10px ${chargeColor}60;">
                                                        <!-- Animated glow effect -->
                                                        <div style="position: absolute; top: 0; right: 0; height: 100%; width: 15px; 
                                                                    background: linear-gradient(to right, transparent, ${chargeColor}80);
                                                                    animation: pulse 1.5s infinite alternate;"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <!-- Futuristic detail display below battery -->
                                            <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 12px;">
                                                <div style="text-align: center; flex: 1;">
                                                    <div style="font-weight: 600; color: ${chargeColor};">Current Charge</div>
                                                    <div style="font-size: 14px;">${currentChargeValue} ${capacityUnit}</div>
                                                    <div style="font-size: 11px; color: #666;">(${chargePercent}% of ${currentCapacity} ${capacityUnit})</div>
                                                </div>
                                                <div style="text-align: center; flex: 1; border-left: 1px solid #f0f0f0; border-right: 1px solid #f0f0f0;">
                                                    <div style="font-weight: 600; color: ${healthColor};">Battery Health</div>
                                                    <div style="font-size: 14px;">${healthPercent}%</div>
                                                    <div style="font-size: 11px; color: #666;">(${maxCapacity} of ${designedCapacity} ${capacityUnit})</div>
                                                </div>
                                                <div style="text-align: center; flex: 1;">
                                                    <div style="font-weight: 600; color: #666;">Capacity Loss</div>
                                                    <div style="font-size: 14px;">${designedCapacity - maxCapacity} ${capacityUnit}</div>
                                                    <div style="font-size: 11px; color: #666;">(${100 - healthPercent}%)</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <style>
                                            @keyframes pulse {
                                                0% { opacity: 0.4; }
                                                100% { opacity: 0.8; }
                                            }
                                        </style>
                                    </div>
                                    `;
                                })()}
                            </div>
                        </div>
                        
                        <!-- Sections side by side for wider layout -->
                        <div style="display: flex; gap: 20px;">
                            <!-- Technical details section, now taking full width -->
                            <div style="flex: 1;">
                                <div style="font-size: 12px; font-weight: 600; color: ${accentColor}; margin-bottom: 8px;
                                            border-bottom: 1px solid #eee; padding-bottom: 3px;">
                                    Technical Details
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(1, 1fr); gap: 8px; font-size: 12px;">
                                    ${specs.filter(spec => spec.section === 'details').map(spec => `
                                        <div>
                                            <span style="color: #666; display: inline-block; width: 100px;">${spec.label}:</span>
                                            <span style="font-weight: 500;">${spec.value}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div style="padding: 12px; flex: 1;">
                        <div style="display: flex; margin-bottom: 10px;">
                            ${imageContent}
                            
                            <div style="flex: 1; min-width: 0;">
                                <div style="
                                    font-size: 12px;
                                    margin-bottom: 8px;
                                    color: #666;
                                ">
                                    ${specs.slice(0, 2).map(spec => `
                                        <div style="margin-bottom: 5px;">
                                            <span style="
                                                display: inline-block;
                                                color: #666;
                                                font-size: 10px;
                                                letter-spacing: 0.3px;
                                                text-transform: uppercase;
                                                margin-right: 5px;
                                            ">${spec.label}:</span>
                                            <span style="
                                                color: #333;
                                                white-space: nowrap;
                                                overflow: hidden;
                                                text-overflow: ellipsis;
                                                font-weight: 500;
                                            ">${spec.value}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <div style="
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                            gap: 8px;
                            font-size: 12px;
                        ">
                            ${specs.slice(2).map(spec => `
                                <div>
                                    <span style="
                                        display: block;
                                        color: #666;
                                        font-size: 10px;
                                        letter-spacing: 0.3px;
                                        margin-bottom: 1px;
                                        text-transform: uppercase;
                                    ">${spec.label}</span>
                                    <span style="
                                        display: block;
                                        color: #333;
                                        white-space: nowrap;
                                        overflow: hidden;
                                        text-overflow: ellipsis;
                                        font-weight: 500;
                                    ">${spec.value}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `}
            </div>
        `;
    }
}

// Create all hardware components
function createHardwareComponents(systeminfoData) {
    let components = [];
    let usedTypes = new Set();

    // CPU Component
    if (systeminfoData.cpu) {
        components.push(createHardwareCard('CPU', systeminfoData.cpu));
        usedTypes.add('cpu');
    }

    // Combine Baseboard and BIOS into a single Motherboard card if both exist
    if (systeminfoData.baseboard && systeminfoData.bios) {
        const combinedData = {
            baseboard: systeminfoData.baseboard,
            bios: systeminfoData.bios
        };
        components.push(createHardwareCard('Motherboard', combinedData));
        usedTypes.add('baseboard');
        usedTypes.add('bios');
    } else {
        // Handle them separately if only one exists
        if (systeminfoData.baseboard) {
            components.push(createHardwareCard('Baseboard', systeminfoData.baseboard));
            usedTypes.add('baseboard');
        }
        
        if (systeminfoData.bios) {
            components.push(createHardwareCard('BIOS', systeminfoData.bios));
            usedTypes.add('bios');
        }
    }

    // Add any remaining hardware components that weren't handled above
    for (let key in systeminfoData) {
        if (!usedTypes.has(key) && typeof systeminfoData[key] === 'object' && key !== 'time') {
            components.push(createHardwareCard(key.charAt(0).toUpperCase() + key.slice(1), systeminfoData[key]));
        }
    }

    return components.join('');
}

export { createHardwareCard, createHardwareComponents };