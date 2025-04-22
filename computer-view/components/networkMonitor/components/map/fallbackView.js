/**
 * Fallback View Module
 * Provides a fallback table view when the map cannot be loaded
 */

import { generateFallbackTableRows } from './connectionsList.js';

/**
 * Creates a fallback view when the map can't be loaded
 * @param {string} mapId - Map element ID
 * @param {Array} connections - Array of network connections
 * @param {Object} connectionsByIp - Connections grouped by IP address
 */
function createFallbackView(mapId, connections, connectionsByIp = {}) {
    const mapContainer = document.getElementById(`${mapId}-map`);
    if (!mapContainer) return;
    
    // Clear existing content
    mapContainer.innerHTML = '';
    
    // Add a message and a table of connections
    const fallbackHtml = `
        <div class="fallback-container">
            <div class="fallback-message">
                <div class="fallback-icon">⚠️</div>
                <div class="fallback-text">
                    <h3>Interactive map could not be loaded</h3>
                    <p>Displaying connection data in table format instead.</p>
                </div>
            </div>
            <div class="fallback-data">
                <table class="fallback-table">
                    <thead>
                        <tr>
                            <th>IP Address</th>
                            <th>Location</th>
                            <th>Ports</th>
                            <th>Connections</th>
                            <th>Risk Level</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateFallbackTableRows(connectionsByIp)}
                    </tbody>
                </table>
            </div>
        </div>
        <style>
            .fallback-container {
                width: 100%;
                height: 100%;
                background: #0f172a;
                color: #e2e8f0;
                padding: 20px;
                overflow: auto;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .fallback-message {
                display: flex;
                align-items: center;
                gap: 15px;
                background: rgba(234, 88, 12, 0.1);
                border-left: 4px solid #ea580c;
                padding: 15px;
                border-radius: 4px;
            }
            .fallback-icon {
                font-size: 24px;
            }
            .fallback-text h3 {
                margin: 0 0 5px 0;
                color: #ea580c;
            }
            .fallback-text p {
                margin: 0;
                color: #cbd5e1;
            }
            .fallback-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 14px;
            }
            .fallback-table th, .fallback-table td {
                padding: 10px;
                text-align: left;
                border-bottom: 1px solid #1e293b;
            }
            .fallback-table th {
                background: #1e293b;
                color: #e2e8f0;
            }
            .fallback-table tr:hover {
                background: #1e293b;
            }
            .risk-high {
                color: #ef4444;
                font-weight: bold;
            }
            .risk-medium {
                color: #f59e0b;
                font-weight: bold;
            }
            .risk-low {
                color: #10b981;
            }
            .fallback-ports {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
            }
            .fallback-port {
                background: #334155;
                padding: 2px 6px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
            }
            .fallback-port.high-risk {
                background: #7f1d1d;
                color: #fecaca;
            }
            .fallback-port.medium-risk {
                background: #78350f;
                color: #fed7aa;
            }
        </style>
    `;
    
    mapContainer.innerHTML = fallbackHtml;
    
    // Update the threat level indicator
    const threatElement = document.getElementById(`${mapId}-threat-level`);
    if (threatElement) {
        threatElement.textContent = 'OFFLINE';
        threatElement.style.color = '#ef4444';
    }
}

export { createFallbackView }; 