/**
 * This file contains all the styling functions for the application
 */

// Add CSS styles for the application
function addStyles() {
    document.head.insertAdjacentHTML('beforeend', `
        <style>
            .scrollable-section {
                max-height: 500px;
                overflow-y: auto;
                scrollbar-width: thin;
                scroll-behavior: smooth;
            }
            .section {
                margin-bottom: 20px;
                border: 1px solid #ddd;
                border-radius: 5px;
                overflow: hidden;
            }
            .section-title {
                padding: 10px 15px;
                background-color: #f8f9fa;
                border-bottom: 1px solid #ddd;
                font-weight: bold;
            }
            .data-group {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #007bff;
            }
            .data-group-title {
                font-size: 1.5em;
                margin-bottom: 15px;
                color: #007bff;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 14px;
            }
            th {
                background-color: #f0f0f0;
                text-align: left;
                padding: 8px;
                border-bottom: 2px solid #ddd;
                position: sticky;
                top: 0;
                z-index: 10;
            }
            td {
                padding: 8px;
                border-bottom: 1px solid #eee;
                vertical-align: top;
                max-width: 300px;
                overflow-wrap: break-word;
            }
            tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            tr:hover {
                background-color: #f0f0f0;
            }
            .json-value {
                max-height: 150px;
                overflow-y: auto;
                background-color: #f5f5f5;
                padding: 4px;
                border-radius: 3px;
                font-family: monospace;
                font-size: 12px;
            }
            #map {
                height: 400px;
                width: 100%;
                border-radius: 4px;
                margin-top: 10px;
            }
            .map-container {
                padding: 15px;
            }
            .gps-details {
                margin-top: 15px;
                background-color: #f5f5f5;
                padding: 10px;
                border-radius: 4px;
                font-family: monospace;
            }
            .hardware-card {
                display: flex;
                padding: 15px;
                background-color: #fff;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                margin-bottom: 20px;
            }
            .hardware-image {
                width: 150px;
                height: 150px;
                margin-right: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #f9f9f9;
                border-radius: 5px;
                overflow: hidden;
            }
            .hardware-image img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            }
            .hardware-image .no-image {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                color: #777;
                font-weight: bold;
                font-size: 16px;
            }
            .vendor-logo {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 60px;
                height: 30px;
                object-fit: contain;
            }
            .hardware-details {
                flex: 1;
                position: relative;
            }
            .hardware-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
                padding-right: 70px;
            }
            .hardware-specs {
                list-style-type: none;
                padding: 0;
                margin: 0;
            }
            .hardware-specs li {
                margin-bottom: 5px;
                display: flex;
            }
            .hardware-specs .label {
                font-weight: bold;
                width: 120px;
                color: #555;
            }
            .hardware-specs .value {
                flex: 1;
            }
            .hardware-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                gap: 20px;
                margin-top: 15px;
            }
            
            /* Resource cards styles */
            .resource-card {
                display: flex;
                padding: 20px;
                background-color: #fff;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                margin-bottom: 20px;
            }
            .donut-chart-container {
                width: 150px;
                height: 150px;
                margin-right: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .donut-chart {
                width: 100%;
                height: 100%;
                position: relative;
            }
            .resource-details {
                flex: 1;
            }
            .resource-details h3 {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 15px;
                color: #333;
            }
            .resource-stats {
                width: 100%;
                border-collapse: collapse;
            }
            .resource-stats td {
                padding: 6px 0;
                border-bottom: 1px solid #eee;
            }
            .resource-stats td:first-child {
                font-weight: bold;
                color: #555;
                width: 40%;
            }
            
            .memory-stats-chart {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 15px;
            }
            .memory-chart {
                width: 100%;
                height: 30px;
                background-color: #e9ecef;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 10px;
                margin-top: 15px;
            }
            .memory-chart-used {
                height: 100%;
                background-color: #007bff;
                border-radius: 4px;
            }
            .memory-label {
                font-size: 14px;
                font-weight: bold;
            }
            .memory-stats-card .hardware-image {
                width: 200px;
            }
            /* New memory gauge styles */
            .memory-gauge-container {
                position: relative;
                width: 120px;
                height: 120px;
            }
            .memory-gauge {
                transform-origin: 50% 50%;
            }
            .memory-gauge-text {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                pointer-events: none;
            }
            .memory-gauge-percentage {
                font-size: 24px;
                font-weight: bold;
                color: #ffc107; /* Will be dynamically set */
                line-height: 1;
            }
            .memory-gauge-label {
                font-size: 12px;
                color: #666;
                margin-top: 4px;
            }
            .pie-segment {
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                transform-origin: 50% 50%;
            }
            
            /* Battery card styles */
            .battery-card {
                overflow: hidden;
                display: flex;
            }
            .battery-left-section {
                display: flex;
                flex-direction: column;
                align-items: center; 
                margin-right: 20px;
                min-width: 320px;
                max-width: 320px;
            }
            .battery-image-container {
                position: relative;
                width: 320px;
                height: 200px;
                border-radius: 5px;
                overflow: hidden;
                background-color: #fff;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 20px;
            }
            .battery-image {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            }
            .battery-gauges {
                display: flex;
                justify-content: space-between;
                width: 100%;
                margin-top: 0;
            }
            .gauge-container {
                text-align: center;
                margin: 0 10px;
            }
            .gauge-label {
                font-weight: bold;
                margin-bottom: 5px;
                font-size: 14px;
                color: #555;
            }
            .circular-gauge {
                position: relative;
            }
            .gauge-text {
                font-size: 24px;
                font-weight: bold;
            }
            /* Define stroke and text colors */
            .battery-critical-stroke { stroke: #dc3545; }
            .battery-low-stroke { stroke: #fd7e14; }
            .battery-medium-stroke { stroke: #ffc107; }
            .battery-full-stroke { stroke: #28a745; }
            .health-poor-stroke { stroke: #dc3545; }
            .health-fair-stroke { stroke: #fd7e14; }
            .health-good-stroke { stroke: #ffc107; }
            .health-excellent-stroke { stroke: #28a745; }
            
            .battery-critical-text { fill: #dc3545; }
            .battery-low-text { fill: #fd7e14; }
            .battery-medium-text { fill: #ffc107; }
            .battery-full-text { fill: #28a745; }
            .health-poor-text { fill: #dc3545; }
            .health-fair-text { fill: #fd7e14; }
            .health-good-text { fill: #ffc107; }
            .health-excellent-text { fill: #28a745; }
            
            .battery-section-header {
                font-size: 16px;
                margin-top: 15px;
                margin-bottom: 8px;
                color: #333;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }
            .spec-table {
                width: 100%;
                margin-bottom: 15px;
            }
            .spec-label {
                font-weight: bold;
                color: #555;
                width: 140px;
            }
            .spec-value {
                font-family: monospace;
            }
            
            /* Status colors */
            .battery-charging {
                color: #ffc107;
                font-weight: bold;
            }
            .battery-plugged {
                color: #28a745;
                font-weight: bold;
            }
            .battery-discharging {
                color: #007bff;
                font-weight: bold;
            }
            
            /* Responsive adjustments */
            @media (max-width: 1100px) {
                .battery-card {
                    flex-direction: column;
                }
                .battery-left-section {
                    width: 100% !important;
                    margin-bottom: 20px;
                    align-items: center;
                }
            }
            
            /* Storage card styles */
            .storage-section-header {
                font-size: 16px;
                color: #007bff;
                margin: 25px 0 10px 0;
                padding-bottom: 5px;
                border-bottom: 1px solid #e9ecef;
            }
            .storage-info-container {
                margin-top: 15px;
                padding-right: 10px;
            }
            .storage-specs-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 10px;
                margin-bottom: 20px;
            }
            .storage-spec {
                padding: 8px;
                background-color: #f8f9fa;
                border-radius: 4px;
            }
            .storage-spec-label {
                font-weight: bold;
                color: #495057;
                margin-bottom: 5px;
                font-size: 12px;
            }
            .storage-spec-value {
                font-size: 14px;
            }
            .storage-spec-monospace {
                font-family: monospace;
                font-size: 12px;
                word-break: break-all;
            }
            .storage-spec-wide {
                grid-column: 1 / -1;
            }
            .storage-left-section {
                display: flex;
                flex-direction: column;
                margin-right: 20px;
                width: 150px;
            }
            .storage-image-container {
                width: 150px;
                height: 150px;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #f9f9f9;
                border-radius: 5px;
                overflow: hidden;
                margin-bottom: 15px;
            }
            .storage-image {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            }
            .storage-gauge-container {
                width: 150px;
                display: flex;
                justify-content: center;
            }
            .gauge-container {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .gauge-label {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 5px;
                color: #495057;
            }
            .storage-usage-container {
                margin: 15px 0;
            }
            .storage-usage-bar {
                height: 8px;
                background-color: #e9ecef;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 5px;
            }
            .storage-usage-fill {
                height: 100%;
                border-radius: 4px;
            }
            .storage-usage-text {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
            }
            .storage-used {
                font-weight: bold;
            }
            .storage-good {
                color: #28a745;
            }
            .storage-warning {
                color: #ffc107;
            }
            .storage-critical {
                color: #dc3545;
            }
            .storage-model {
                color: #6c757d;
                font-size: 14px;
                margin-bottom: 10px;
            }
            .storage-vendor {
                font-weight: bold;
                margin-right: 5px;
            }
            .storage-size {
                font-weight: normal;
                font-size: 14px;
                color: #6c757d;
                margin-left: 5px;
            }
            .storage-capabilities-list {
                margin: 0;
                padding-left: 20px;
                font-size: 12px;
            }
            .storage-capabilities-list li {
                margin-bottom: 3px;
            }
            
            /* Filesystem Gauge Styles */
            .fs-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                padding: 15px;
            }
            
            .fs-stat-item {
                background-color: #fff;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .fs-stat-label {
                font-size: 14px;
                color: #6c757d;
                margin-bottom: 10px;
                font-weight: bold;
                text-align: center;
            }
            
            .fs-stat-value {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 15px;
                text-align: center;
            }
            
            .fs-speed-gauge-container {
                width: 120px;
                height: 120px;
                position: relative;
                margin: 10px auto;
            }
            
            .fs-speed-value {
                text-align: center;
                font-weight: bold;
                font-size: 16px;
                margin-top: 10px;
            }
            
            canvas {
                max-width: 100%;
                height: auto;
            }

            /* Graphics card styles */
            .graphics-card {
                overflow: visible;
                display: flex;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                margin-bottom: 20px;
                padding: 20px;
            }
            .graphics-left-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-right: 30px;
                min-width: 250px;
                max-width: 250px;
            }
            .graphics-image-container {
                position: relative;
                width: 100%;
                height: 150px;
                border-radius: 8px;
                overflow: hidden;
                background-color: #f8f9fa;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 20px;
                border: 1px solid #e9ecef;
            }
            .graphics-image {
                max-width: 90%;
                max-height: 90%;
                object-fit: contain;
            }
            .graphics-type-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 15px;
            }
            .graphics-type-badge.integrated {
                background-color: #e9ecef;
                color: #495057;
            }
            .graphics-type-badge.discrete {
                background-color: #28a745;
                color: white;
            }
            .graphics-gauge-container {
                width: 100%;
                display: flex;
                justify-content: center;
            }
            .hardware-specs-container {
                margin-top: 15px;
                background: #f8f9fa;
                border-radius: 6px;
                padding: 15px;
            }
            .hardware-specs {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .hardware-specs li {
                display: flex;
                margin-bottom: 8px;
                font-size: 14px;
            }
            .hardware-specs li:last-child {
                margin-bottom: 0;
            }
            .hardware-specs .label {
                font-weight: 600;
                color: #495057;
                width: 120px;
                flex-shrink: 0;
            }
            .hardware-specs .value {
                color: #212529;
            }

            /* Display card styles */
            .display-card {
                overflow: visible;
                display: flex;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                margin-bottom: 20px;
                padding: 20px;
            }
            .display-left-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-right: 30px;
                min-width: 250px;
                max-width: 250px;
            }
            .display-image-container {
                position: relative;
                width: 100%;
                height: 150px;
                border-radius: 8px;
                overflow: hidden;
                background-color: #000;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 20px;
            }
            .display-screen {
                width: 90%;
                height: auto;
                background: linear-gradient(45deg, #2c3e50, #3498db);
                border: 2px solid #34495e;
                border-radius: 4px;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-family: monospace;
                padding: 20px;
                box-shadow: 0 0 20px rgba(52, 152, 219, 0.3);
            }
            .display-resolution {
                font-size: 14px;
                text-align: center;
                text-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
                font-weight: 600;
            }
            .display-resolution-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 15px;
                background-color: #17a2b8;
                color: white;
            }
            .vendor-logo {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 60px;
                height: 30px;
                object-fit: contain;
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .graphics-card,
                .display-card {
                    flex-direction: column;
                }
                .graphics-left-section,
                .display-left-section {
                    width: 100% !important;
                    min-width: unset;
                    max-width: unset;
                    margin-right: 0;
                    margin-bottom: 20px;
                }
                .graphics-image-container,
                .display-image-container {
                    height: 180px;
                }
                .hardware-specs .label {
                    width: 140px;
                }
            }
        </style>
    `);
}

// Styles for file system visualizations
const fsStatsStyles = `
.fs-stats-card, .fs-openfiles-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    margin-bottom: 20px;
    overflow: hidden;
}

.fs-stats-title, .fs-openfiles-title {
    background: #f8f9fa;
    padding: 12px 15px;
    font-weight: 600;
    border-bottom: 1px solid #e9ecef;
}

.fs-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    padding: 15px;
}

.fs-stat-item {
    padding: 10px;
    border-radius: 5px;
    background: #f8f9fa;
}

.fs-stat-label {
    font-size: 0.85rem;
    color: #6c757d;
    margin-bottom: 5px;
}

.fs-stat-value {
    font-size: 1.2rem;
    font-weight: 600;
}

.fs-stat-secondary {
    font-size: 0.8rem;
    color: #6c757d;
    margin-top: 3px;
}

.fs-response-time {
    grid-column: 1 / -1;
}

.fs-response-gauge-container {
    display: flex;
    align-items: center;
    margin-top: 8px;
}

.fs-response-gauge {
    flex-grow: 1;
    height: 10px;
    background: #e9ecef;
    border-radius: 5px;
    overflow: hidden;
    margin-right: 10px;
}

.fs-response-gauge-fill {
    height: 100%;
    border-radius: 5px;
}

.fs-response-value {
    font-weight: 600;
    min-width: 65px;
    text-align: right;
}

/* Open Files Visualization */
.fs-openfiles-content {
    display: flex;
    padding: 15px;
}

.fs-openfiles-gauge-container {
    width: 120px;
    flex-shrink: 0;
}

.fs-openfiles-gauge {
    position: relative;
    width: 100%;
}

.gauge-svg {
    transform: rotate(0deg);
}

.fs-openfiles-gauge-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

.fs-openfiles-gauge-percentage {
    font-size: 1.2rem;
    font-weight: 700;
}

.fs-openfiles-gauge-label {
    font-size: 0.7rem;
    color: #6c757d;
}

.fs-openfiles-stats {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding-left: 20px;
}

.fs-openfiles-stat {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.fs-openfiles-stat-label {
    color: #6c757d;
}

.fs-openfiles-stat-value {
    font-weight: 600;
}

/* Storage tabs and technical details */
.storage-tabs-container {
    margin-top: 15px;
}

.storage-tabs {
    display: flex;
    border-bottom: 1px solid #dee2e6;
    margin-bottom: 15px;
}

.storage-tab {
    background: none;
    border: none;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    color: #6c757d;
}

.storage-tab:hover {
    color: #007bff;
    background-color: #f8f9fa;
}

.storage-tab-active {
    color: #007bff;
    border-bottom-color: #007bff;
    font-weight: bold;
}

.storage-tab-content {
    display: none;
}

.storage-tab-content-active {
    display: block;
}

.storage-spec-wide {
    grid-column: 1 / -1;
}

.storage-spec-monospace {
    font-family: monospace;
    font-size: 12px;
    word-break: break-all;
}

.storage-capabilities-list {
    margin: 0;
    padding-left: 20px;
}

.storage-capabilities-list li {
    margin-bottom: 4px;
}
`;

// Function to add file system styles to the document
function addFsStatsStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = fsStatsStyles;
    document.head.appendChild(styleElement);
}

// Add CSS styles for speed gauges
const speedGaugeStyles = `
.fs-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    padding: 15px;
}

.fs-stat-item {
    background-color: #fff;
    border-radius: 6px;
    padding: 15px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.fs-stat-label {
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 8px;
    text-align: center;
    font-weight: bold;
}

.fs-stat-value {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
    word-break: break-all;
    text-align: center;
}

.fs-speed-gauge-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 10px;
}

.fs-speed-gauge {
    width: 120px;
    height: 80px;
}

.fs-speed-gauge svg {
    width: 100%;
    height: 100%;
}

.gauge-indicator {
    transform-origin: center;
    transition: transform 0.5s ease-out;
}

.gauge-progress {
    transition: all 0.5s ease-out;
}

.fs-speed-value {
    text-align: center;
    font-weight: bold;
    margin-top: 5px;
}
`;

function addSpeedGaugeStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = speedGaugeStyles;
    document.head.appendChild(styleElement);
}

// Add styles for battery card
function addBatteryStyles() {
    document.head.insertAdjacentHTML('beforeend', `
        <style>
            .battery-card {
                overflow: hidden;
                display: flex;
            }
            .battery-left-section {
                display: flex;
                flex-direction: column;
                align-items: center; 
                margin-right: 20px;
                min-width: 320px;
                max-width: 320px;
            }
            .battery-image-container {
                position: relative;
                width: 320px;
                height: 200px;
                border-radius: 5px;
                overflow: hidden;
                background-color: #fff;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 20px;
            }
            .battery-image {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            }
            .battery-gauges {
                display: flex;
                justify-content: space-between;
                width: 100%;
                margin-top: 0;
            }
            .gauge-container {
                text-align: center;
                margin: 0 10px;
            }
            .gauge-label {
                font-weight: bold;
                margin-bottom: 5px;
                font-size: 14px;
                color: #555;
            }
            .circular-gauge {
                position: relative;
            }
            .gauge-text {
                font-size: 24px;
                font-weight: bold;
            }
            /* Define stroke and text colors */
            .battery-critical-stroke { stroke: #dc3545; }
            .battery-low-stroke { stroke: #fd7e14; }
            .battery-medium-stroke { stroke: #ffc107; }
            .battery-full-stroke { stroke: #28a745; }
            .health-poor-stroke { stroke: #dc3545; }
            .health-fair-stroke { stroke: #fd7e14; }
            .health-good-stroke { stroke: #ffc107; }
            .health-excellent-stroke { stroke: #28a745; }
            
            .battery-critical-text { fill: #dc3545; }
            .battery-low-text { fill: #fd7e14; }
            .battery-medium-text { fill: #ffc107; }
            .battery-full-text { fill: #28a745; }
            .health-poor-text { fill: #dc3545; }
            .health-fair-text { fill: #fd7e14; }
            .health-good-text { fill: #ffc107; }
            .health-excellent-text { fill: #28a745; }
            
            .battery-section-header {
                font-size: 16px;
                margin-top: 15px;
                margin-bottom: 8px;
                color: #333;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }
            .spec-table {
                width: 100%;
                margin-bottom: 15px;
            }
            .spec-label {
                font-weight: bold;
                color: #555;
                width: 140px;
            }
            .spec-value {
                font-family: monospace;
            }
            
            /* Status colors */
            .battery-charging {
                color: #ffc107;
                font-weight: bold;
            }
            .battery-plugged {
                color: #28a745;
                font-weight: bold;
            }
            .battery-discharging {
                color: #007bff;
                font-weight: bold;
            }
            
            /* Responsive adjustments */
            @media (max-width: 1100px) {
                .battery-card {
                    flex-direction: column;
                }
                .battery-left-section {
                    width: 100% !important;
                    margin-bottom: 20px;
                    align-items: center;
                }
            }
        </style>
    `);
}

// Initialize by adding styles and event listeners
function initialize() {
    addFsStatsStyles();
    addSpeedGaugeStyles();
    addBatteryStyles(); // Add the new battery styles
}

// Call initialize when the module is loaded
initialize();

export { addStyles, addFsStatsStyles, addSpeedGaugeStyles, addBatteryStyles }; 