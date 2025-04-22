/**
 * Creates an elegant card to display time information
 * @param {Object} timeInfo - The time information object
 * @returns {string} HTML string for the time card
 */
function createTimeCard(timeInfo) {
    if (!timeInfo) return '';

    // Extract time data
    const timestamp = timeInfo.current ? Number(timeInfo.current) : Date.now();
    const uptime = timeInfo.uptime ? Number(timeInfo.uptime) : 0;
    const timezone = timeInfo.timezone || 'Unknown';
    const timezoneName = timeInfo.timezoneName || 'Unknown';
    
    // Format the current date and time
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    
    // Format uptime in a human-readable way
    const formatUptime = (seconds) => {
        if (seconds < 60) return `${seconds} seconds`;
        
        const days = Math.floor(seconds / 86400);
        seconds %= 86400;
        const hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        const minutes = Math.floor(seconds / 60);
        seconds %= 60;
        
        let result = '';
        if (days > 0) result += `${days} day${days > 1 ? 's' : ''}, `;
        if (hours > 0 || days > 0) result += `${hours} hour${hours > 1 ? 's' : ''}, `;
        if (minutes > 0 || hours > 0 || days > 0) result += `${minutes} minute${minutes > 1 ? 's' : ''}, `;
        result += `${seconds} second${seconds > 1 ? 's' : ''}`;
        
        return result;
    };
    
    // Get hours for the analog clock 
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    // Calculate clock hand rotations
    const hourRotation = (hours % 12) * 30 + minutes * 0.5; // 30 degrees per hour plus adjustment for minutes
    const minuteRotation = minutes * 6; // 6 degrees per minute
    const secondRotation = seconds * 6; // 6 degrees per second
    
    return `
        <div class="section time-section">
            <div class="section-title">Time Information</div>
            <div class="time-container">
                <div class="time-card clock-card">
                    <div class="card-title">
                        <svg class="time-icon" viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />
                        </svg>
                        <span>Current Time</span>
                    </div>
                    
                    <div class="clock-container">
                        <div class="analog-clock">
                            <div class="clock-face">
                                <div class="hour-hand" style="transform: rotate(${hourRotation}deg)"></div>
                                <div class="minute-hand" style="transform: rotate(${minuteRotation}deg)"></div>
                                <div class="second-hand" style="transform: rotate(${secondRotation}deg)"></div>
                                <div class="clock-center"></div>
                                ${[...Array(12)].map((_, i) => 
                                    `<div class="hour-marker" style="transform: rotate(${i * 30}deg)">
                                        <div class="marker"></div>
                                    </div>`
                                ).join('')}
                            </div>
                        </div>
                        
                        <div class="digital-clock">
                            <div class="date-display">${formattedDate}</div>
                            <div class="time-display">${formattedTime}</div>
                            <div class="timestamp-label">Unix Timestamp</div>
                            <div class="timestamp-value">${timestamp}</div>
                        </div>
                    </div>
                </div>
                
                <div class="time-card uptime-card">
                    <div class="card-title">
                        <svg class="time-icon" viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M13 2.05V4.07C16.95 4.56 20 7.92 20 12C20 16.42 16.28 20 11.72 20C7.72 20 4.4 16.96 4.04 13H2.03C2.39 18.1 6.63 22 11.72 22C17.38 22 22 17.51 22 12C22 6.95 18 2.75 13 2.05M11 7V13L16.25 16.15L17 14.92L12.5 12.25V7H11Z" />
                        </svg>
                        <span>System Uptime</span>
                    </div>
                    
                    <div class="uptime-container">
                        <div class="uptime-value">${formatUptime(uptime)}</div>
                        <div class="uptime-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(100, uptime / (30 * 24 * 60 * 60) * 100)}%"></div>
                            </div>
                            <div class="progress-label">
                                ${uptime > 30 * 24 * 60 * 60 
                                    ? 'Over 30 days' 
                                    : `${Math.floor(uptime / (24 * 60 * 60))} days of uptime`}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="time-card timezone-card">
                    <div class="card-title">
                        <svg class="time-icon" viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M7,10L12,15L17,10H7Z" />
                        </svg>
                        <span>Timezone</span>
                    </div>
                    
                    <div class="timezone-container">
                        <div class="timezone-name">
                            <div class="tz-label">Name:</div>
                            <div class="tz-value">${timezoneName}</div>
                        </div>
                        <div class="timezone-offset">
                            <div class="tz-label">Offset:</div>
                            <div class="tz-value">${timezone}</div>
                        </div>
                        <div class="timezone-visualization">
                            <div class="world-map">
                                <!-- World map silhouette -->
                                <svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet" class="map-svg">
                                    <path d="M0,25 Q25,35 50,25 T100,25 L100,50 L0,50 Z" fill="#e0e0e0" />
                                    <path d="M20,15 Q30,10 40,15 T60,15 Q70,10 80,15" stroke="#ccc" fill="none" stroke-width="0.5" />
                                </svg>
                                
                                <!-- Place a dot approximately where the timezone would be -->
                                <div class="timezone-dot" style="left: ${getTimezoneDotPosition(timezone)}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .time-section {
                    margin-bottom: 25px;
                }
                .time-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    padding: 15px;
                }
                .time-card {
                    flex: 1;
                    min-width: 250px;
                    background: #fff;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    overflow: hidden;
                }
                .card-title {
                    display: flex;
                    align-items: center;
                    font-weight: 500;
                    color: #444;
                    margin-bottom: 15px;
                    font-size: 16px;
                    border-bottom: 1px solid #f0f0f0;
                    padding-bottom: 10px;
                }
                .time-icon {
                    margin-right: 10px;
                    color: #1976D2;
                }
                
                /* Clock styles */
                .clock-container {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                }
                .analog-clock {
                    width: 120px;
                    height: 120px;
                    position: relative;
                    margin: 0 auto;
                }
                .clock-face {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: #f8f9fa;
                    border: 2px solid #dee2e6;
                    position: relative;
                }
                .hour-hand, .minute-hand, .second-hand {
                    position: absolute;
                    background: #333;
                    transform-origin: bottom center;
                    border-radius: 4px;
                    left: 50%;
                }
                .hour-hand {
                    width: 4px;
                    height: 35px;
                    margin-left: -2px;
                    top: 25px;
                    background: #333;
                }
                .minute-hand {
                    width: 3px;
                    height: 45px;
                    margin-left: -1.5px;
                    top: 15px;
                    background: #555;
                }
                .second-hand {
                    width: 1px;
                    height: 50px;
                    margin-left: -0.5px;
                    top: 10px;
                    background: #dc3545;
                }
                .clock-center {
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background: #333;
                    border-radius: 50%;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }
                .hour-marker {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                }
                .marker {
                    position: absolute;
                    width: 3px;
                    height: 8px;
                    background: #555;
                    top: 1px;
                    left: 50%;
                    transform: translateX(-50%);
                }
                
                .digital-clock {
                    flex: 1;
                    margin-left: 20px;
                    text-align: center;
                }
                .date-display {
                    font-size: 14px;
                    font-weight: 500;
                    color: #555;
                    margin-bottom: 5px;
                }
                .time-display {
                    font-size: 20px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 15px;
                }
                .timestamp-label {
                    font-size: 12px;
                    color: #6c757d;
                    margin-bottom: 3px;
                }
                .timestamp-value {
                    font-family: monospace;
                    background: #f5f7fa;
                    padding: 5px;
                    border-radius: 4px;
                    font-size: 13px;
                    color: #666;
                }
                
                /* Uptime styles */
                .uptime-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                .uptime-value {
                    font-size: 16px;
                    font-weight: 500;
                    margin-bottom: 20px;
                    color: #495057;
                    text-align: center;
                }
                .uptime-progress {
                    margin-top: auto;
                }
                .progress-bar {
                    height: 8px;
                    background-color: #e9ecef;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }
                .progress-fill {
                    height: 100%;
                    background-color: #28a745;
                    border-radius: 4px;
                    transition: width 0.5s;
                }
                .progress-label {
                    text-align: center;
                    font-size: 12px;
                    color: #6c757d;
                }
                
                /* Timezone styles */
                .timezone-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                .timezone-name, .timezone-offset {
                    display: flex;
                    margin-bottom: 10px;
                }
                .tz-label {
                    font-weight: 500;
                    width: 80px;
                    color: #6c757d;
                }
                .tz-value {
                    flex: 1;
                    font-family: system-ui, -apple-system, sans-serif;
                }
                .timezone-visualization {
                    margin-top: 15px;
                    position: relative;
                    flex-grow: 1;
                }
                .world-map {
                    position: relative;
                    width: 100%;
                    height: 70px;
                }
                .map-svg {
                    width: 100%;
                    height: 100%;
                }
                .timezone-dot {
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    background-color: #dc3545;
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    top: 50%;
                    z-index: 2;
                    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.3);
                }
                
                @media (max-width: 768px) {
                    .time-container {
                        flex-direction: column;
                    }
                    .time-card {
                        width: 100%;
                    }
                    .clock-container {
                        flex-direction: column;
                    }
                    .digital-clock {
                        margin-left: 0;
                        margin-top: 20px;
                    }
                }
            </style>
        </div>
    `;
}

/**
 * Get a horizontal position for the timezone dot based on timezone string
 * @param {string} timezone - Timezone string like "(UTC+02:00) Jerusalem"
 * @returns {number} - Position percentage (0-100)
 */
function getTimezoneDotPosition(timezone) {
    // Default to center
    if (!timezone) return 50;
    
    // Try to extract the UTC offset
    const match = timezone.match(/UTC([+-]\d+)/i);
    if (!match) return 50;
    
    const offset = parseInt(match[1]);
    
    // Convert UTC offset (-12 to +14) to a position percentage (0-100)
    // Map the range -12 to +14 (26 total) to 10-90 (80% of width)
    return 10 + ((offset + 12) / 26) * 80;
}

export { createTimeCard }; 