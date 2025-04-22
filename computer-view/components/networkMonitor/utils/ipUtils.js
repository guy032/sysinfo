/**
 * IP Address Utilities
 * Provides utilities for handling and processing IP addresses
 */

/**
 * Checks if an IP address is private/local
 * @param {string} ip - The IP address to check
 * @returns {boolean} True if the IP is private/local, false if public
 */
function isPrivateIP(ip) {
    // IPv4 private address patterns
    if (
        ip.startsWith('10.') || 
        ip.startsWith('127.') || 
        ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) || 
        ip.match(/^192\.168\./) ||
        ip.match(/^169\.254\./) ||
        ip === 'localhost' ||
        ip === '0.0.0.0'
    ) {
        return true;
    }
    
    // IPv6 private address patterns
    if (
        ip.startsWith('::1') || 
        ip.startsWith('fc') || 
        ip.startsWith('fd') || 
        ip.startsWith('fe80:')
    ) {
        return true;
    }
    
    return false;
}

/**
 * Filters connections to only show WAN (public internet) connections
 * @param {Array} connections - Array of connections to filter
 * @returns {Array} Filtered connections
 */
function getWANConnections(connections) {
    return connections.filter(conn => !isPrivateIP(conn.peerAddress));
}

/**
 * Filters connections to only show LAN (local network) connections
 * @param {Array} connections - Array of connections to filter
 * @returns {Array} Filtered connections
 */
function getLANConnections(connections) {
    return connections.filter(conn => isPrivateIP(conn.peerAddress));
}

/**
 * Analyzes VirusTotal data to determine security risk level and details
 * @param {Object} vtData - VirusTotal data for an IP
 * @returns {Object} Security assessment with risk level and details
 */
function analyzeSecurityRisk(vtData) {
    // Default security assessment for cases where vtData is null or incomplete
    const defaultAssessment = {
        riskLevel: 'UNKNOWN',
        riskScore: 0,
        maliciousCount: 0,
        suspiciousCount: 0,
        harmlessCount: 0,
        undetectedCount: 0,
        asOwner: null,
        country: null,
        network: null,
        asn: null,
        registrar: null,
        whoisData: null,
        certificateInfo: null,
        detectionDetails: [],
        securityNotes: [],
        tags: []
    };
    
    // Return default if no vtData or malformed data
    if (!vtData || !vtData.data || !vtData.data.attributes) {
        return defaultAssessment;
    }
    
    const attr = vtData.data.attributes;
    
    // Extract key security metrics
    const stats = attr.last_analysis_stats || {};
    const maliciousCount = stats.malicious || 0;
    const suspiciousCount = stats.suspicious || 0;
    const harmlessCount = stats.harmless || 0;
    const undetectedCount = stats.undetected || 0;
    const totalVotes = attr.total_votes || { harmless: 0, malicious: 0 };
    
    // Extract network information
    const asOwner = attr.as_owner || null;
    const country = attr.country || null;
    const network = attr.network || null;
    const asn = attr.asn || null;
    const registrar = attr.regional_internet_registry || null;
    const ipTags = attr.tags || [];
    
    // Parse WHOIS data if available
    let whoisSummary = null;
    if (attr.whois) {
        // Extract key information from WHOIS
        const whoisLines = attr.whois.split('\n');
        const whoisInfo = {};
        
        // Look for specific fields in WHOIS data
        const whoisKeys = [
            'org-name', 'netname', 'country', 'address', 
            'created', 'last-modified', 'org-type', 'status'
        ];
        
        whoisLines.forEach(line => {
            const match = line.match(/^([^:]+):\s*(.+)$/);
            if (match) {
                const key = match[1].trim().toLowerCase();
                const value = match[2].trim();
                
                if (whoisKeys.includes(key)) {
                    whoisInfo[key] = value;
                }
            }
        });
        
        whoisSummary = whoisInfo;
    }
    
    // Extract certificate info if available
    let certInfo = null;
    if (attr.last_https_certificate) {
        const cert = attr.last_https_certificate;
        certInfo = {
            subject: cert.subject ? (cert.subject.CN || cert.subject.O) : null,
            issuer: cert.issuer ? (cert.issuer.CN || cert.issuer.O) : null,
            validFrom: cert.validity ? cert.validity.not_before : null,
            validTo: cert.validity ? cert.validity.not_after : null,
            altNames: cert.extensions && cert.extensions.subject_alternative_name ? 
                cert.extensions.subject_alternative_name : []
        };
    }
    
    // Calculate risk score (0-100)
    // Weight: malicious findings are weighted more heavily
    const totalEngines = maliciousCount + suspiciousCount + harmlessCount + undetectedCount;
    let riskScore = 0;
    
    if (totalEngines > 0) {
        // Base the score primarily on the proportion of malicious/suspicious findings
        riskScore = Math.round(
            ((maliciousCount * 100) + (suspiciousCount * 50)) / totalEngines
        );
        
        // Adjust based on community votes (if any)
        const totalVoteCount = totalVotes.harmless + totalVotes.malicious;
        if (totalVoteCount > 0) {
            const voteRiskFactor = Math.round((totalVotes.malicious * 100) / totalVoteCount);
            // Blend engine results with community votes (70/30 weight)
            riskScore = Math.round((riskScore * 0.7) + (voteRiskFactor * 0.3));
        }
        
        // Adjust for reputation if available
        if (attr.reputation !== undefined) {
            // Calculate harmless ratio - higher means more security vendors found it harmless
            const harmlessRatio = harmlessCount / totalEngines;
            
            // Reputation in VT is negative for bad reputation
            if (attr.reputation < 0) {
                // For significant negative reputation, still increase the risk
                if (attr.reputation < -5) {
                    const repBoost = Math.min(20, Math.abs(attr.reputation));
                    riskScore = Math.min(100, riskScore + repBoost);
                } 
                // For minor negative reputation with high harmless ratio, reduce the impact
                else if (harmlessRatio > 0.5) {
                    // Minor negative reputation has less impact when many vendors say it's harmless
                    const reducedRepBoost = Math.min(10, Math.abs(attr.reputation)) * (1 - harmlessRatio);
                    riskScore = Math.min(100, riskScore + reducedRepBoost);
                }
                // For minor negative reputation without high harmless ratio
                else {
                    const repBoost = Math.min(15, Math.abs(attr.reputation));
                    riskScore = Math.min(100, riskScore + repBoost);
                }
            } else if (attr.reputation > 5) {
                // Slightly decrease risk for good reputation
                riskScore = Math.max(0, riskScore - 5);
            }
        }
        
        // Apply harmless bias: if many engines say it's harmless and none say it's malicious,
        // reduce the score more aggressively
        if (maliciousCount === 0 && harmlessCount > 30) {
            const harmlessRatio = harmlessCount / totalEngines;
            // Reduce score based on how many engines found it harmless
            const harmlessReduction = Math.round(riskScore * (harmlessRatio * 0.8));
            riskScore = Math.max(0, riskScore - harmlessReduction);
            
            // Cap the score for IPs with very high harmless counts and zero malicious
            if (harmlessCount > 50) {
                riskScore = Math.min(riskScore, 15); // Cap at 15 (LOW) for highly vetted IPs
            }
        }
    }
    
    // Determine risk level based on score with adjusted thresholds
    let riskLevel = 'LOW';
    if (riskScore >= 60) {
        riskLevel = 'HIGH';
    } else if (riskScore >= 20) {
        // Add special case for borderline MEDIUM risk with high harmless count
        if (riskScore < 25 && harmlessCount > 40 && maliciousCount === 0) {
            riskLevel = 'LOW';
        } else {
            riskLevel = 'MEDIUM';
        }
    } else if (riskScore > 0) {
        riskLevel = 'LOW';
    } else if (riskScore === 0 && harmlessCount > 10) {
        riskLevel = 'CLEAN'; // Many engines explicitly marked it clean
    } else {
        riskLevel = 'UNKNOWN';
    }
    
    // Extract notable detection details
    const detectionDetails = [];
    const results = attr.last_analysis_results || {};
    
    for (const engine in results) {
        const result = results[engine];
        if (result.category === 'malicious' || result.category === 'suspicious') {
            detectionDetails.push({
                engine: result.engine_name,
                category: result.category,
                result: result.result
            });
        }
    }
    
    // Generate security insights
    const securityNotes = [];
    
    // Add detection information
    if (maliciousCount > 0) {
        securityNotes.push(`Flagged as malicious by ${maliciousCount} security vendors`);
    }
    
    if (suspiciousCount > 0) {
        securityNotes.push(`Marked as suspicious by ${suspiciousCount} security vendors`);
    }
    
    if (harmlessCount > 0 && maliciousCount === 0 && suspiciousCount === 0) {
        securityNotes.push(`Considered harmless by ${harmlessCount} security vendors`);
    }
    
    // Add organization information
    if (asOwner) {
        const orgNote = `IP belongs to ${asOwner}`;
        securityNotes.push(orgNote);
        
        // Special handling for known organizations
        const lcOwner = asOwner.toLowerCase();
        if (lcOwner.includes('cloud') || 
            lcOwner.includes('aws') || 
            lcOwner.includes('azure') || 
            lcOwner.includes('google') || 
            lcOwner.includes('alibaba')) {
            securityNotes.push('Cloud provider IP address - potential legitimate service');
        }
        
        if (lcOwner.includes('cdn') || 
            lcOwner.includes('akamai') || 
            lcOwner.includes('cloudflare') || 
            lcOwner.includes('fastly')) {
            securityNotes.push('Content Delivery Network - often used for legitimate services');
        }
        
        if (lcOwner.includes('game') || 
            lcOwner.includes('steam') || 
            lcOwner.includes('blizzard') || 
            lcOwner.includes('valve') || 
            lcOwner.includes('riot') || 
            lcOwner.includes('nintendo') || 
            lcOwner.includes('sony') || 
            lcOwner.includes('microsoft') || 
            lcOwner.includes('gaming')) {
            securityNotes.push('Gaming-related service - commonly used for online games');
        }
    }
    
    // Add country information
    if (country) {
        securityNotes.push(`Located in ${country}`);
    }
    
    // Add reputation information
    if (attr.reputation !== undefined) {
        if (attr.reputation < 0) {
            securityNotes.push(`Negative community reputation: ${attr.reputation}`);
        } else if (attr.reputation > 0) {
            securityNotes.push(`Positive community reputation: ${attr.reputation}`);
        }
    }
    
    // Add certificate information
    if (certInfo && certInfo.subject) {
        securityNotes.push(`HTTPS certificate issued to: ${certInfo.subject}`);
        if (certInfo.issuer) {
            securityNotes.push(`Certificate issued by: ${certInfo.issuer}`);
        }
    }
    
    // Add WHOIS information
    if (whoisSummary) {
        if (whoisSummary['org-name']) {
            securityNotes.push(`Registered to: ${whoisSummary['org-name']}`);
        }
        if (whoisSummary['org-type']) {
            securityNotes.push(`Organization type: ${whoisSummary['org-type']}`);
        }
        if (whoisSummary['created']) {
            securityNotes.push(`Registration date: ${whoisSummary['created']}`);
        }
    }
    
    return {
        riskLevel,
        riskScore,
        maliciousCount,
        suspiciousCount,
        harmlessCount,
        undetectedCount,
        asOwner,
        country,
        network,
        asn,
        registrar,
        whoisData: whoisSummary,
        certificateInfo: certInfo,
        detectionDetails,
        securityNotes,
        tags: ipTags
    };
}

/**
 * IP Information Manager
 * Handles fetching and caching IP address information from ipinfo.io and VirusTotal
 */
const IPInfoManager = {
    // Cache key prefix (changed to invalidate old cache)
    cacheKeyPrefix: 'ipdata_',
    vtCacheKeyPrefix: 'vtdata_', // New prefix for VirusTotal data cache
    
    // API tokens
    ipinfoToken: 'c5eaed9fc0b066',
    virusTotalApiKey: '14d1769c13fa573d68b21242af046fee49cf70fe0af8bda8f27685ce7a43754e',
    
    /**
     * Get combined IP information from cache or fetch from APIs
     * @param {string} ip - IP address to lookup
     * @returns {Promise<Object>} Combined IP information
     */
    async getIPInfo(ip) {
        // Skip for private IPs
        if (isPrivateIP(ip)) {
            return {
                ip,
                isPrivate: true,
                hostname: 'Local Network',
                city: '',
                region: '',
                country: '',
                loc: '',
                org: '',
                timezone: '',
                vtData: null,
                securityInfo: {
                    riskLevel: 'INTERNAL',
                    riskScore: 0,
                    securityNotes: ['Internal/Private IP address']
                }
            };
        }
        
        try {
            // Check cache for ipinfo data
            const cachedIpinfoData = this.getCachedIPInfo(ip);
            
            // Check cache for VirusTotal data separately
            const cachedVtData = this.getCachedVTData(ip);
            
            // Variables to hold our data
            let ipinfoData;
            let vtData;
            
            // Fetch ipinfo data if not in cache
            if (cachedIpinfoData) {
                ipinfoData = cachedIpinfoData;
            } else {
                ipinfoData = await this.fetchIpinfoData(ip);
                // Cache ipinfo data
                this.cacheIPInfo(ip, ipinfoData);
            }
            
            // Fetch VirusTotal data if not in cache
            if (cachedVtData) {
                vtData = cachedVtData;
            } else {
                vtData = await this.fetchVirusTotalData(ip);
                // Cache VirusTotal data separately
                if (vtData) {
                    this.cacheVTData(ip, vtData);
                }
            }
            
            // Analyze security risk based on VirusTotal data - this is done fresh each time
            const securityInfo = analyzeSecurityRisk(vtData);
            
            // Combine the data but don't cache the analysis results
            return {
                ...ipinfoData,
                vtData,
                securityInfo
            };
        } catch (error) {
            console.error(`Error fetching IP info for ${ip}:`, error);
            return {
                ip,
                error: true,
                errorMessage: error.name === 'AbortError' ? 'Request timed out' : error.message,
                securityInfo: {
                    riskLevel: 'UNKNOWN',
                    riskScore: 0,
                    securityNotes: ['Failed to retrieve security information']
                }
            };
        }
    },
    
    /**
     * Fetch data from ipinfo.io API
     * @param {string} ip - IP address to lookup
     * @returns {Promise<Object>} IP information from ipinfo.io
     */
    async fetchIpinfoData(ip) {
        // Set a timeout for the fetch request (10 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
            const response = await fetch(`https://ipinfo.io/${ip}/json?token=${this.ipinfoToken}`, {
                signal: controller.signal
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch IP info: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } finally {
            clearTimeout(timeoutId);
        }
    },
    
    /**
     * Fetch data from VirusTotal API
     * @param {string} ip - IP address to lookup
     * @returns {Promise<Object>} IP information from VirusTotal
     */
    async fetchVirusTotalData(ip) {
        // Set a timeout for the fetch request (10 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
            const response = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
                headers: { 'x-apikey': this.virusTotalApiKey },
                signal: controller.signal
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch VirusTotal data: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error fetching VirusTotal data for ${ip}:`, error);
            return null;
        } finally {
            clearTimeout(timeoutId);
        }
    },
    
    /**
     * Get IP information from cache
     * @param {string} ip - IP address to lookup in cache
     * @returns {Object|null} Cached IP information or null if not found
     */
    getCachedIPInfo(ip) {
        try {
            const cachedData = localStorage.getItem(this.cacheKeyPrefix + ip);
            if (cachedData) {
                const data = JSON.parse(cachedData);
                
                // Check if cache is expired (cache for 7 days)
                const now = new Date().getTime();
                if (data.timestamp && (now - data.timestamp) < 7 * 24 * 60 * 60 * 1000) {
                    return data.info;
                } else {
                    // Clear expired cache
                    localStorage.removeItem(this.cacheKeyPrefix + ip);
                }
            }
        } catch (error) {
            console.error('Error accessing cache:', error);
        }
        
        return null;
    },
    
    /**
     * Get VirusTotal data from cache
     * @param {string} ip - IP address to lookup in cache
     * @returns {Object|null} Cached VirusTotal data or null if not found
     */
    getCachedVTData(ip) {
        try {
            const cachedData = localStorage.getItem(this.vtCacheKeyPrefix + ip);
            if (cachedData) {
                const data = JSON.parse(cachedData);
                
                // Check if cache is expired (cache for 7 days)
                const now = new Date().getTime();
                if (data.timestamp && (now - data.timestamp) < 7 * 24 * 60 * 60 * 1000) {
                    return data.vtData;
                } else {
                    // Clear expired cache
                    localStorage.removeItem(this.vtCacheKeyPrefix + ip);
                }
            }
        } catch (error) {
            console.error('Error accessing VirusTotal cache:', error);
        }
        
        return null;
    },
    
    /**
     * Cache IP information
     * @param {string} ip - IP address to cache
     * @param {Object} data - IP information to cache
     */
    cacheIPInfo(ip, data) {
        try {
            const cacheData = {
                timestamp: new Date().getTime(),
                info: data
            };
            
            localStorage.setItem(this.cacheKeyPrefix + ip, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error caching IP info:', error);
        }
    },
    
    /**
     * Cache VirusTotal data separately
     * @param {string} ip - IP address to cache
     * @param {Object} vtData - VirusTotal data to cache
     */
    cacheVTData(ip, vtData) {
        try {
            const cacheData = {
                timestamp: new Date().getTime(),
                vtData: vtData
            };
            
            localStorage.setItem(this.vtCacheKeyPrefix + ip, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error caching VirusTotal data:', error);
        }
    },
    
    /**
     * Clear all cached IP information
     */
    clearCache() {
        try {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.cacheKeyPrefix) || key.startsWith(this.vtCacheKeyPrefix)) {
                    keys.push(key);
                }
            }
            
            keys.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    },
    
    /**
     * Clear only the analysis results cache, keeping raw API data
     */
    clearAnalysisCache() {
        try {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.cacheKeyPrefix)) {
                    keys.push(key);
                }
            }
            
            keys.forEach(key => localStorage.removeItem(key));
            console.log(`Cleared ${keys.length} analysis cache entries`);
        } catch (error) {
            console.error('Error clearing analysis cache:', error);
        }
    }
};

export {
    isPrivateIP,
    getWANConnections,
    getLANConnections,
    analyzeSecurityRisk,
    IPInfoManager
}; 