/**
 * Network Connection Utilities
 * Provides utilities for handling and processing network connection data
 */

/**
 * Consolidates connections based on port, process ID, and network properties
 * @param {Array} connections - Array of connections to consolidate 
 * @param {boolean} [includeRemote=false] - Whether to include remote endpoint in consolidation key
 * @param {boolean} [isUdp=false] - Whether these are UDP connections
 * @returns {Array} Array of consolidated connections
 */
function consolidateConnections(connections, includeRemote = false, isUdp = false) {
    const consolidatedMap = new Map();
    
    connections.forEach(conn => {
        let key = `${conn.localPort}-${conn.pid}`;
        
        if (includeRemote && conn.peerAddress && conn.peerPort) {
            // For established connections, include remote endpoint
            key += `-${conn.peerAddress}:${conn.peerPort}`;
        } else if (isUdp) {
            // For UDP, include remote endpoint if available
            const remote = `${conn.peerAddress || '*'}:${conn.peerPort || '*'}`;
            key += `-${remote}`;
        }
        
        if (!consolidatedMap.has(key)) {
            consolidatedMap.set(key, {
                ...conn,
                localAddresses: [conn.localAddress]
            });
        } else {
            consolidatedMap.get(key).localAddresses.push(conn.localAddress);
        }
    });
    
    return Array.from(consolidatedMap.values());
}

/**
 * Finds process name by PID
 * @param {Array} processesList - List of processes
 * @param {number} pid - Process ID to find
 * @returns {string|null} Process name or null if not found
 */
function findProcessNameByPid(processesList, pid) {
    if (!processesList || !pid) return null;
    
    // Convert pid to number for comparison
    const pidNum = parseInt(pid, 10);
    if (isNaN(pidNum)) return null;
    
    for (const processGroup of processesList) {
        // Check main process
        if (processGroup.pid === pidNum && processGroup.proc) {
            return processGroup.proc;
        }
        
        // Check subprocesses
        if (processGroup.processes) {
            for (const process of processGroup.processes) {
                if (process.pid === pidNum && process.name) {
                    return process.name;
                }
            }
        }
    }
    
    return null;
}

/**
 * Counts unique processes for a set of connections
 * @param {Array} connections - Array of connection objects
 * @param {Array} processesList - List of processes for name lookup
 * @returns {number} Count of unique processes
 */
function countUniqueProcesses(connections, processesList) {
    if (!connections.length) return 0;
    
    // Map to store unique process names/PIDs
    const processMap = new Map();
    
    connections.forEach(conn => {
        if (!conn.pid) return;
        
        const processName = findProcessNameByPid(processesList, conn.pid) || `PID ${conn.pid}`;
        processMap.set(processName, true);
    });
    
    return processMap.size;
}

/**
 * Get CSS class for port based on its number
 * @param {string|number} port - Port number
 * @returns {string} CSS class name
 */
function getPortClass(port) {
    const portNum = parseInt(port, 10);
    
    if (isNaN(portNum)) return 'port-dynamic';
    
    // Well-known ports
    if (portNum <= 1023) return 'port-well-known';
    
    // Known dangerous ports
    const dangerPorts = [3389, 22, 23, 1433, 1434, 3306, 5432, 5900, 6379];
    if (dangerPorts.includes(portNum)) return 'port-danger';
    
    // Registered ports
    if (portNum <= 49151) return 'port-registered';
    
    // Dynamic/private ports
    return 'port-dynamic';
}

/**
 * Get risk level based on port number
 * @param {string|number} port - Port number
 * @returns {string} Risk level (low, medium, high)
 */
function getRiskLevel(port) {
    const portNum = parseInt(port, 10);
    
    if (isNaN(portNum)) return 'low';
    
    // High-risk ports
    const highRiskPorts = [20, 21, 22, 23, 25, 53, 67, 68, 69, 123, 137, 138, 139, 161, 162, 389, 
                          445, 636, 1433, 1434, 3306, 3389, 5432, 5900, 6379];
    if (highRiskPorts.includes(portNum)) return 'high';
    
    // Medium-risk ports (well-known)
    if (portNum <= 1023) return 'medium';
    
    // Low-risk ports
    return 'low';
}

/**
 * Determines if a port is high risk
 * @param {number} port - Port number
 * @returns {boolean} True if high risk
 */
function isHighRiskPort(port) {
    const highRiskPorts = [20, 21, 22, 23, 25, 53, 67, 68, 110, 123, 
                          135, 137, 138, 139, 161, 162, 389, 445, 
                          1433, 1434, 3306, 3389, 5432, 5900, 8080];
    return highRiskPorts.includes(parseInt(port, 10));
}

export {
    consolidateConnections,
    findProcessNameByPid,
    countUniqueProcesses,
    getPortClass,
    getRiskLevel,
    isHighRiskPort
}; 