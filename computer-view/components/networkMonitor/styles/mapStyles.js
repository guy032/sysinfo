/**
 * Map Styles Module
 * Contains CSS styles for the cyber network map
 */

/**
 * Gets CSS styles for cyber network map
 * @returns {string} CSS styles
 */
function getCyberNetworkMapStyles() {
    return `
        .cyber-network-map-container {
            width: 100%;
            background: #f8fafc;
            color: #334155;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 0 15px rgba(0, 30, 60, 0.15);
            font-family: 'Courier New', monospace;
        }
        
        .cn-grid-container {
            display: grid;
            grid-template-rows: auto 1fr;
            grid-template-columns: 1fr 300px;
            grid-template-areas: 
                "header header"
                "map sidebar";
        }
        
        .cn-header {
            grid-area: header;
            padding: 15px;
            background: #e2e8f0;
            border-bottom: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .cn-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #0369a1;
            text-shadow: 0 0 10px rgba(3, 105, 161, 0.2);
            letter-spacing: 1px;
        }
        
        .cn-stats {
            display: flex;
            gap: 20px;
        }
        
        .cn-stat {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .cn-stat-value {
            font-size: 1.2rem;
            font-weight: bold;
            color: #1e293b;
        }
        
        .cn-stat-label {
            font-size: 0.7rem;
            color: #64748b;
        }
        
        .cn-map-area {
            grid-area: map;
            position: relative;
            overflow: hidden;
            background: #f1f5f9;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .deck-gl-map {
            width: 100%;
            height: 100%;
        }
        
        .cn-data-panel {
            grid-area: sidebar;
            height: 100%;
            background: #e2e8f0;
            border-left: 1px solid #cbd5e1;
            overflow-y: auto;
            padding: 10px;
        }
        
        .cn-data-header {
            font-size: 0.9rem;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #cbd5e1;
            position: sticky;
            top: 0;
            background: #e2e8f0;
            z-index: 10;
        }
        
        .cn-process-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .cn-process-item {
            background: #f8fafc;
            border-radius: 4px;
            border-left: 3px solid #38bdf8;
            padding: 8px;
        }
        
        .cn-process-item.high-risk {
            border-left-color: #ef4444;
        }
        
        .cn-process-item.medium-risk {
            border-left-color: #f59e0b;
        }
        
        .cn-process-item.low-risk {
            border-left-color: #0f766e;
        }
        
        .cn-process-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
        }
        
        .cn-process-name {
            font-weight: bold;
            color: #1e293b;
        }
        
        .cn-process-stats {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .cn-process-count {
            background: #e2e8f0;
            color: #1e293b;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.7rem;
        }
        
        .cn-process-risk {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: bold;
        }
        
        .cn-process-risk.high-risk {
            background: #fee2e2;
            color: #b91c1c;
        }
        
        .cn-process-risk.medium-risk {
            background: #ffedd5;
            color: #c2410c;
        }
        
        .cn-process-risk.low-risk {
            background: #ccfbf1;
            color: #0f766e;
        }
        
        .cn-process-endpoints {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-top: 5px;
        }
        
        .cn-endpoint {
            background: #e2e8f0;
            border-radius: 3px;
            padding: 4px;
            font-size: 0.7rem;
        }
        
        .cn-endpoint-address {
            color: #475569;
            font-family: monospace;
        }
        
        .cn-endpoint-ports {
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
            margin-top: 2px;
        }
        
        .cn-port {
            background: #cbd5e1;
            color: #1e293b;
            padding: 1px 3px;
            border-radius: 2px;
            font-size: 0.65rem;
        }
        
        .cn-high-risk-port {
            background: #fee2e2;
            color: #b91c1c;
        }
        
        /* New Styles for External Connections Panel */
        .cn-external-connections {
            display: flex;
            flex-direction: column;
            gap: 10px;
            height: calc(100% - 30px);
            overflow-y: auto;
        }
        
        .cn-external-domain {
            background: #f8fafc;
            border-radius: 4px;
            padding: 10px;
            border-left: 3px solid #38bdf8;
            transition: all 0.2s ease;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .cn-external-domain:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            background: #ffffff;
        }
        
        .cn-external-domain.risk-high {
            border-left-color: #ef4444;
        }
        
        .cn-external-domain.risk-medium {
            border-left-color: #f59e0b;
        }
        
        .cn-external-domain.risk-low {
            border-left-color: #0f766e;
        }
        
        .cn-external-domain.cn-connection-active {
            background: #f0f9ff;
            box-shadow: 0 4px 12px rgba(3, 105, 161, 0.2);
            transform: translateY(-2px);
            border-width: 4px;
            position: relative;
        }
        
        .cn-external-domain.cn-connection-active .cn-domain-name {
            color: #0369a1;
            font-weight: bold;
        }
        
        .cn-domain-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .cn-domain-name {
            font-family: monospace;
            font-weight: bold;
            color: #1e293b;
        }
        
        .cn-connection-count {
            background: #e2e8f0;
            color: #1e293b;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.7rem;
        }
        
        .cn-domain-info {
            font-size: 0.8rem;
            color: #64748b;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .cn-domain-info > div {
            display: flex;
            align-items: center;
        }
        
        .cn-icon {
            margin-right: 5px;
            font-style: normal;
            display: inline-block;
            width: 16px;
        }
        
        .cn-location {
            color: #0369a1;
        }
        
        .cn-hostname {
            color: #6366f1;
            font-weight: 500;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .cn-processes {
            color: #4b5563;
            font-weight: 500;
        }
        
        .cn-asn {
            color: #8b5cf6;
            font-style: italic;
        }
        
        .cn-ports {
            font-family: monospace;
            margin-bottom: 2px;
        }
        
        .cn-risk-level {
            font-weight: 600;
        }
        
        .cn-risk-level .high-risk {
            color: #ef4444;
        }
        
        .cn-risk-level .medium-risk {
            color: #f59e0b;
        }
        
        .cn-risk-level .low-risk {
            color: #10b981;
        }
        
        .cn-empty-state {
            color: #64748b;
            text-align: center;
            padding: 20px;
            font-size: 0.9rem;
        }
        
        /* Tooltip styles for port tags */
        .port-tag {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 3px;
            background: #cbd5e1;
            color: #1e293b;
            margin-right: 2px;
            font-size: 0.75rem;
            font-family: monospace;
        }
        
        .port-tag.high-risk {
            background: #fee2e2;
            color: #b91c1c;
        }
        
        .port-tag.medium-risk {
            background: #ffedd5;
            color: #c2410c;
        }
        
        .tooltip-badge.medium-risk {
            background-color: #f59e0b;
        }
        
        .highlight-row {
            background: rgba(59, 130, 246, 0.1);
            padding: 4px;
            border-radius: 4px;
            margin-bottom: 6px;
        }
        
        .connection-count {
            font-weight: 600;
            color: #0369a1;
        }
        
        /* Media query for responsive layout */
        @media (max-width: 768px) {
            .cn-grid-container {
                grid-template-rows: auto 1fr auto;
                grid-template-columns: 1fr;
                grid-template-areas: 
                    "header"
                    "map"
                    "sidebar";
            }
            
            .cn-data-panel {
                border-left: none;
                border-top: 1px solid #cbd5e1;
                height: 250px;
            }
        }
        
        .cn-refresh-button {
            background: #0369a1;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 0.7rem;
            cursor: pointer;
            float: right;
            margin-top: -2px;
        }
        
        .cn-refresh-button:hover {
            background: #0284c7;
        }
    `;
}

export { getCyberNetworkMapStyles }; 