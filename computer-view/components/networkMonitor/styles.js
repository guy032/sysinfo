/**
 * Network Monitor Styles
 * Contains the CSS styles for the network monitor component
 */

/**
 * Gets the global CSS styles for the network monitor
 * @returns {string} CSS styles as a string
 */
function getNetworkMonitorStyles() {
    return `
        .network-connections-section {
            margin-bottom: 25px;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            color: #1e293b;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
        }
        
        .network-connections-section .section-title {
            background: linear-gradient(90deg, #f8fafc, #f1f5f9);
            color: #334155;
            padding: 15px 20px;
            font-size: 18px;
            font-weight: 600;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .network-dashboard {
            padding: 20px;
        }
        
        .dashboard-header {
            margin-bottom: 25px;
        }
        
        .connection-stats {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .stat-card {
            background: #f8fafc;
            border-radius: 10px;
            padding: 15px;
            display: flex;
            align-items: center;
            min-width: 160px;
            flex: 1;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid #e2e8f0;
            position: relative;
        }
        
        .stat-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1);
        }
        
        .stat-card.active {
            background: #ffffff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transform: translateY(-3px);
        }
        
        .stat-card.active:after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 3px;
            background: currentColor;
            border-bottom-left-radius: 10px;
            border-bottom-right-radius: 10px;
        }
        
        .stat-card.active[data-tab="listen"]:after {
            background: #3b82f6;
        }
        
        .stat-card.active[data-tab="established"]:after {
            background: #10b981;
        }
        
        .stat-card.active[data-tab="udp"]:after {
            background: #f59e0b;
        }
        
        .stat-card.active[data-tab="insights"]:after {
            background: #8b5cf6;
        }
        
        .stat-icon {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
        }
        
        .listen-icon {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
        }
        
        .established-icon {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
        }
        
        .udp-icon {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
        }
        
        .other-icon {
            background: linear-gradient(135deg, #8b5cf6, #6d28d9);
            color: white;
        }
        
        .insights-icon {
            background: linear-gradient(135deg, #ec4899, #be185d);
            color: white;
        }
        
        .stat-info {
            flex: 1;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
            color: #0f172a;
        }
        
        .stat-label {
            font-size: 14px;
            color: #64748b;
        }
        
        .network-tabs {
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        
        .tab-content {
            padding: 20px;
            margin-top: 15px;
        }
        
        .connection-subtabs {
            display: flex;
            border-bottom: 1px solid #e2e8f0;
            margin-bottom: 15px;
        }
        
        .subtab {
            padding: 8px 16px;
            cursor: pointer;
            font-size: 14px;
            color: #64748b;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }
        
        .subtab:hover {
            color: #334155;
            background: #f8fafc;
        }
        
        .subtab.active {
            color: #0f172a;
            border-bottom: 2px solid #3b82f6;
            font-weight: 500;
        }
        
        .subtab-label {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .subtab-content {
            margin-top: 15px;
        }
        
        .pane-header {
            margin-bottom: 20px;
        }
        
        .pane-header h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 5px 0;
            color: #0f172a;
        }
        
        .pane-description {
            color: #64748b;
            font-size: 14px;
        }
        
        .empty-state {
            text-align: center;
            padding: 30px;
            color: #64748b;
            font-style: italic;
        }
        
        .network-globe-container {
            display: flex;
            gap: 20px;
        }
        
        .network-globe-placeholder {
            width: 300px;
            height: 300px;
            background: #f8fafc;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #64748b;
            border: 1px solid #e2e8f0;
        }
        
        .globe-icon {
            width: 100px;
            height: 100px;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%2364748b" d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,7C13.1,7 14,7.9 14,9C14,10.1 13.1,11 12,11C10.9,11 10,10.1 10,9C10,7.9 10.9,7 12,7M17,12C17,13.1 16.1,14 15,14C13.9,14 13,13.1 13,12C13,10.9 13.9,10 15,10C16.1,10 17,10.9 17,12M7,12C7,10.9 7.9,10 9,10C10.1,10 11,10.9 11,12C11,13.1 10.1,14 9,14C7.9,14 7,13.1 7,12Z"/></svg>') center no-repeat;
            margin-bottom: 15px;
        }
        
        .insights-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .insight-section {
            background: #f8fafc;
            border-radius: 8px;
            padding: 15px;
            border: 1px solid #e2e8f0;
        }
        
        .insight-section h4 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
            color: #0f172a;
        }
        
        .process-graph {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .process-bar {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .process-pid {
            font-family: monospace;
            min-width: 60px;
            color: #334155;
        }
        
        .process-name {
            font-size: 11px;
            color: #64748b;
            font-family: system-ui, -apple-system, sans-serif;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100px;
        }
        
        .bar-container {
            flex: 1;
            height: 25px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            position: relative;
        }
        
        .bar-segment {
            height: 100%;
            position: absolute;
            top: 0;
        }
        
        .bar-listen {
            background: #3b82f6;
            left: 0;
        }
        
        .bar-established {
            background: #10b981;
        }
        
        .bar-udp {
            background: #f59e0b;
        }
        
        .bar-other {
            background: #8b5cf6;
        }
        
        .connection-count {
            min-width: 40px;
            text-align: right;
            color: #334155;
        }
        
        .external-connections {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .external-domain {
            background: #ffffff;
            border-radius: 6px;
            padding: 10px;
            font-size: 12px;
            flex: 1;
            min-width: 150px;
            border: 1px solid #e2e8f0;
        }
        
        .domain-name {
            font-weight: 600;
            margin-bottom: 5px;
            color: #0f172a;
        }
        
        .domain-info {
            color: #64748b;
            display: flex;
            justify-content: space-between;
        }
        
        .risk-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 5px;
        }
        
        .risk-low {
            background: #10b981;
        }
        
        .risk-medium {
            background: #f59e0b;
        }
        
        .risk-high {
            background: #ef4444;
        }
        
        .ip-details-container {
            margin-top: 8px;
            font-size: 12px;
            color: #334155;
            background: #f8fafc;
            padding: 6px 8px;
            border-radius: 4px;
            border-left: 2px solid #3b82f6;
        }
        
        .ip-details-loading {
            font-style: italic;
            color: #94a3b8;
        }
        
        .ip-details-error {
            color: #ef4444;
            font-style: italic;
        }
        
        .ip-details {
            padding: 4px 0;
        }
        
        .ip-detail {
            margin: 3px 0;
        }
        
        .detail-label {
            font-weight: 600;
            color: #475569;
        }
        
        .country-flag {
            display: inline-block;
            margin: 0 4px;
            font-size: 10px;
            padding: 1px 3px;
            background: #f1f5f9;
            border-radius: 3px;
            color: #334155;
            text-transform: uppercase;
            font-weight: bold;
        }
        
        .ip-enhanced {
            padding-bottom: 6px;
        }
        
        .refresh-button {
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            font-size: 12px;
            cursor: pointer;
            margin-left: 10px;
            transition: background 0.2s;
        }
        
        .refresh-button:hover {
            background: #2563eb;
        }
        
        .ip-location::before {
            content: "";
            display: inline-block;
            width: 14px;
            height: 14px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'%3E%3C/path%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'%3E%3C/path%3E%3C/svg%3E");
            background-size: contain;
            margin-right: 6px;
        }
        
        .ip-coordinates {
            display: flex;
            align-items: center;
            color: #334155;
            font-size: 11px;
        }
        
        .ip-coordinates::before {
            content: "";
            display: inline-block;
            width: 14px;
            height: 14px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'%3E%3C/path%3E%3C/svg%3E");
            background-size: contain;
            margin-right: 6px;
        }
        
        .ip-org {
            display: flex;
            align-items: center;
        }
        
        .ip-org::before {
            content: "";
            display: inline-block;
            width: 14px;
            height: 14px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'%3E%3C/path%3E%3C/svg%3E");
            background-size: contain;
            margin-right: 6px;
        }
        
        .ip-hostname {
            display: flex;
            align-items: center;
            font-family: monospace;
            word-break: break-all;
        }
        
        .ip-hostname::before {
            content: "";
            display: inline-block;
            width: 14px;
            height: 14px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'%3E%3C/path%3E%3C/svg%3E");
            background-size: contain;
            margin-right: 6px;
        }
        
        .country-flag {
            display: inline-block;
            margin-left: 6px;
            text-transform: uppercase;
            font-size: 9px;
            font-weight: 600;
            padding: 2px 4px;
            border-radius: 3px;
            background: #3b82f6;
            color: white;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 1200px) {
            .insights-container {
                grid-template-columns: 1fr;
            }
            
            .network-globe-container {
                flex-direction: column;
            }
            
            .network-globe-placeholder {
                width: 100%;
                height: 200px;
            }
        }
        
        @media (max-width: 768px) {
            .tab-container {
                flex-wrap: wrap;
            }
            
            .tab {
                min-width: 50%;
            }
        }

        /* Reagraph network view styles */
        .reagraph-network-view {
            width: 100%;
            height: 700px;
            margin: 0 auto;
            padding: 0;
            position: relative;
        }
    `;
}

export default getNetworkMonitorStyles; 