/**
 * Printer components for ComputerView
 * Displays printers in an elegant card layout
 */

import { formatColumnName, formatCellValue } from '../utils.js';

/**
 * Creates a grid of printer cards
 * @param {Array} printers - Array of printer data
 * @returns {string} HTML string for printer visualization
 */
function createPrintersGrid(printers) {
    if (!Array.isArray(printers) || printers.length === 0) {
        return '';
    }
    
    // Sort printers to put network printers first
    const sortedPrinters = [...printers].sort((a, b) => {
        // Network printers (with IP address) come first
        if (a.ipAddress && !b.ipAddress) return -1;
        if (!a.ipAddress && b.ipAddress) return 1;
        return 0;
    });
    
    return `
        <div class="section-title">Printers (${printers.length} items)</div>
        <div class="printers-grid">
            ${sortedPrinters.map(printer => createPrinterCard(printer)).join('')}
        </div>
        <style>
            .printers-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                gap: 20px;
                margin-top: 15px;
                margin-bottom: 30px;
            }
            .printer-card {
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
            .printer-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 6px 16px rgba(0,0,0,0.12);
            }
            .printer-header {
                padding: 15px;
                display: flex;
                align-items: center;
                border-bottom: 1px solid #f0f0f0;
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            }
            .printer-icon {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                background: #34a853;
                color: white;
                margin-right: 12px;
                flex-shrink: 0;
            }
            .printer-icon svg {
                width: 24px;
                height: 24px;
            }
            .printer-title {
                font-size: 16px;
                font-weight: 600;
                flex-grow: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .printer-model {
                font-size: 13px;
                color: #5f6368;
                margin-top: 2px;
            }
            .printer-specs {
                padding: 15px;
                flex-grow: 1;
            }
            .printer-spec-item {
                display: flex;
                margin-bottom: 8px;
                font-size: 14px;
            }
            .printer-spec-label {
                color: #5f6368;
                flex-basis: 40%;
                flex-shrink: 0;
            }
            .printer-spec-value {
                color: #202124;
                flex-grow: 1;
                word-break: break-word;
            }
            .printer-footer {
                padding: 10px 15px;
                background: #f8f9fa;
                border-top: 1px solid #f0f0f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #5f6368;
            }
            .printer-status {
                display: flex;
                align-items: center;
                font-size: 12px;
                font-weight: 500;
            }
            .printer-status::before {
                content: "";
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 6px;
            }
            .printer-status.idle::before {
                background-color: #34a853;
            }
            .printer-status.busy::before {
                background-color: #fbbc05;
            }
            .printer-status.error::before {
                background-color: #ea4335;
            }
            .printer-status.offline::before {
                background-color: #9aa0a6;
            }
            .printer-badges {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-top: 10px;
            }
            .printer-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
                letter-spacing: 0.3px;
            }
            .printer-badge.default {
                background-color: #e8f0fe;
                color: #1967d2;
            }
            .printer-badge.local {
                background-color: #e6f4ea;
                color: #137333;
            }
            .printer-badge.shared {
                background-color: #fce8e6;
                color: #d93025;
            }
            .printer-badge.not-shared {
                background-color: #f1f3f4;
                color: #5f6368;
            }
            .printer-badge.network {
                background-color: #fff8e1;
                color: #e37400;
            }
            .printer-connection {
                display: flex;
                align-items: center;
                margin-top: 10px;
                padding: 8px 12px;
                background: #f1f3f4;
                border-radius: 6px;
                font-size: 13px;
            }
            .printer-connection svg {
                width: 16px;
                height: 16px;
                margin-right: 8px;
                opacity: 0.7;
            }
            @media (max-width: 768px) {
                .printers-grid {
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                }
            }
        </style>
    `;
}

/**
 * Creates a single printer card
 * @param {Object} printer - The printer data
 * @returns {string} HTML string for a single printer card
 */
function createPrinterCard(printer) {
    // Prepare specs for display
    const specs = [];
    
    if (printer.location) specs.push({ label: 'Location', value: printer.location });
    if (printer.ipAddress) specs.push({ label: 'IP Address', value: printer.ipAddress });
    if (printer.driverName) specs.push({ label: 'Driver', value: printer.driverName });
    if (printer.portHostAddress) specs.push({ label: 'Port Host', value: printer.portHostAddress });
    if (printer.portDescription) specs.push({ label: 'Port Description', value: printer.portDescription });
    if (printer.uuid) specs.push({ label: 'UUID', value: printer.uuid });
    
    // Create connection URI display
    let connectionDisplay = '';
    if (printer.uri) {
        connectionDisplay = `
            <div class="printer-connection">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#5f6368">
                    <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                </svg>
                ${printer.uri}
            </div>
        `;
    }
    
    // Determine printer status for indicator
    const statusClass = getPrinterStatusClass(printer.status);
    
    // Create feature badges
    const badges = [];
    if (printer.default === 'Yes') badges.push({ type: 'default', label: 'Default' });
    if (printer.local === 'Yes') badges.push({ type: 'local', label: 'Local' });
    if (printer.shared === 'Yes') {
        badges.push({ type: 'shared', label: 'Shared' });
    } else if (printer.shared === 'No') {
        badges.push({ type: 'not-shared', label: 'Not Shared' });
    }
    if (printer.ipAddress) badges.push({ type: 'network', label: 'Network' });
    
    const badgesHTML = badges.length > 0 ? `
        <div class="printer-badges">
            ${badges.map(badge => `
                <div class="printer-badge ${badge.type}">${badge.label}</div>
            `).join('')}
        </div>
    ` : '';
    
    // Create a printer title from name
    const printerName = printer.name || 'Unknown Printer';
    const printerModel = printer.model || '';
    
    return `
        <div class="printer-card">
            <div class="printer-header">
                <div class="printer-icon">
                    ${getPrinterIcon(printerName)}
                </div>
                <div>
                    <div class="printer-title" title="${printerName}">
                        ${printerName}
                    </div>
                    ${printerModel ? `<div class="printer-model">${printerModel}</div>` : ''}
                </div>
            </div>
            <div class="printer-specs">
                ${connectionDisplay}
                ${badgesHTML}
                ${specs.map(spec => `
                    <div class="printer-spec-item">
                        <div class="printer-spec-label">${spec.label}:</div>
                        <div class="printer-spec-value">${formatCellValue(spec.value)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="printer-footer">
                <div class="printer-status ${statusClass}">
                    ${printer.status || 'Unknown'}
                </div>
                <div class="printer-id">ID: ${printer.id || ''}</div>
            </div>
        </div>
    `;
}

/**
 * Returns appropriate status class based on printer status
 * @param {string} status - The printer status string
 * @returns {string} CSS class for the status
 */
function getPrinterStatusClass(status) {
    if (!status) return 'offline';
    
    status = status.toLowerCase();
    if (status.includes('idle')) return 'idle';
    if (status.includes('busy') || status.includes('printing')) return 'busy';
    if (status.includes('error') || status.includes('jam') || status.includes('out')) return 'error';
    if (status.includes('offline')) return 'offline';
    
    return 'idle'; // Default to idle
}

/**
 * Returns an SVG icon for the printer
 * @param {string} printerName - The printer name to help determine type
 * @returns {string} SVG icon HTML
 */
function getPrinterIcon(printerName) {
    // Default printer icon
    return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
            <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
        </svg>
    `;
}

export { createPrintersGrid }; 