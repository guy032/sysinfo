/**
 * Creates an elegant card-based layout to display user information
 * @param {Array} users - Array of user objects
 * @returns {string} HTML string for the users component
 */
function createUsersCard(users) {
    if (!users || users.length === 0) return '';
    
    // Count total users and logged in users
    const userCount = users.length;
    const loggedInCount = users.filter(user => user.loggedIn).length;
    
    return `
                ${users.map(user => {
                    // Extract user data with fallbacks
                    const username = user.user || 'Unknown';
                    const tty = user.tty || '';
                    const date = user.date || '';
                    const time = user.time || '';
                    const ip = user.ip || '';
                    const command = user.command || '';
                    const sessionId = user.sessionId || '';
                    const isLoggedIn = user.loggedIn || false;
                    const localDetails = user.localUserDetails || {};
                    const sessionDetails = user.sessionDetails || {};
                    
                    // Ensure sessions have the right structure for consolidation
                    let allSessions = user.allSessions || [];
                    
                    // Map sessions to consistent format if they don't have expected properties
                    allSessions = allSessions.map(session => {
                        // If the session has Id, Start, Duration, Auth properties (from screenshot)
                        // but not our expected properties, create a mapped version
                        if ((session.Id || session.Start || session.Duration || session.Auth) && 
                            !(session.id || session.startTimeFormatted || session.duration || session.authPackage)) {
                            
                            return {
                                id: session.Id,
                                sessionId: session.Id,
                                startTimeFormatted: session.Start,
                                startTime: session.Start,
                                duration: session.Duration,
                                authPackage: session.Auth,
                                status: session.Active ? 'Active' : (session.Status || ''),
                                logonType: session['Logon Type'] || session.LogonType,
                                domain: session.Domain,
                                // Keep original properties too
                                ...session
                            };
                        }
                        return session;
                    });
                    
                    // Consolidate similar sessions
                    allSessions = consolidateSimilarSessions(allSessions);
                    
                    // Get local user details - fix case sensitivity issues
                    const fullName = localDetails.FullName || '';
                    const description = localDetails.Description || '';
                    const enabled = localDetails.Enabled === true;
                    const lastLogon = formatDateDisplay(localDetails.LastLogon);
                    const passwordLastSet = formatDateDisplay(localDetails.PasswordLastSet);
                    const passwordRequired = localDetails.PasswordRequired;
                    const accountExpires = formatDateDisplay(localDetails.AccountExpires);
                    const passwordExpires = formatDateDisplay(localDetails.PasswordExpires);
                    const userMayChangePassword = localDetails.UserMayChangePassword;
                    
                    // Generate avatar background based on username
                    const avatarColors = [
                        '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
                        '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad'
                    ];
                    const colorIndex = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarColors.length;
                    const avatarColor = avatarColors[colorIndex];
                    
                    // Get initials for avatar (use first two characters of username)
                    const initials = username.slice(0, 2).toUpperCase();
                    
                    // Determine status icon/color based on login state and enabled status
                    let statusIcon = "alert-circle";
                    let statusColor = "#dc3545";  // Red for disabled
                    let statusText = "Disabled";
                    
                    if (enabled) {
                        if (isLoggedIn) {
                            statusIcon = "check-circle";
                            statusColor = "#28a745";  // Green
                            statusText = "Active";
                        } else {
                            statusIcon = "account";
                            statusColor = "#6c757d";  // Gray
                            statusText = "Inactive";
                        }
                    }
                    
                    // Card border style based on login status
                    const cardBorderStyle = isLoggedIn ? 
                        'border-left: 3px solid #28a745;' : 
                        (enabled ? 'border-left: 3px solid #6c757d;' : 'border-left: 3px solid #dc3545;');
                    
                    return `
                        <div class="user-card" style="${cardBorderStyle}">
                            <div class="user-header">
                                <div class="user-avatar" style="background-color: ${avatarColor}">
                                    ${initials}
                                </div>
                                <div class="user-title">
                                    <div class="username">${username}</div>
                                    ${fullName ? `<div class="user-fullname">${fullName}</div>` : ''}
                                    <div class="user-status">
                                        <svg class="status-icon" style="color: ${statusColor}" viewBox="0 0 24 24" width="14" height="14">
                                            ${getStatusIcon(statusIcon)}
                                        </svg>
                                        <span>${statusText}</span>
                                        ${tty ? `<span class="terminal-info">(${tty})</span>` : ''}
                                    </div>
                                </div>
                                <div class="user-time">
                                    ${date && time ? `
                                        <div class="time-detail">
                                            <svg viewBox="0 0 24 24" width="12" height="12">
                                                <path fill="currentColor" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />
                                            </svg>
                                            <span>${date} ${time}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="user-details">
                                <div class="user-account-info">
                                    <!-- Account Status -->
                                    <div class="detail-item">
                                        <div class="user-detail-label">Status</div>
                                        <div class="detail-value">${enabled ? 'Enabled' : 'Disabled'}</div>
                                    </div>
                                    
                                    <!-- Last logon information -->
                                    ${lastLogon && lastLogon !== '-' ? `
                                        <div class="detail-item">
                                            <div class="user-detail-label">Last Logon</div>
                                            <div class="detail-value">${lastLogon}</div>
                                        </div>
                                    ` : ''}
                                    
                                    <!-- Password information -->
                                    ${passwordLastSet && passwordLastSet !== '-' ? `
                                        <div class="detail-item">
                                            <div class="user-detail-label">Password Set</div>
                                            <div class="detail-value">${passwordLastSet}</div>
                                        </div>
                                    ` : ''}
                                    
                                    <!-- Description -->
                                    ${description ? `
                                        <div class="detail-item description">
                                            <div class="user-detail-label">Description</div>
                                            <div class="detail-value">${description}</div>
                                        </div>
                                    ` : ''}
                                </div>
                                
                                ${isLoggedIn ? `
                                    <div class="session-info">
                                        <div class="section-label">Current Session</div>
                                        
                                        ${ip ? `
                                            <div class="detail-item">
                                                <div class="user-detail-label">IP</div>
                                                <div class="detail-value">${ip}</div>
                                            </div>
                                        ` : ''}
                                        
                                        ${command ? `
                                            <div class="detail-item">
                                                <div class="user-detail-label">Command</div>
                                                <div class="detail-value command">${command}</div>
                                            </div>
                                        ` : ''}
                                        
                                        ${sessionDetails.domain ? `
                                            <div class="detail-item">
                                                <div class="user-detail-label">Domain</div>
                                                <div class="detail-value">${sessionDetails.domain}</div>
                                            </div>
                                        ` : ''}
                                    </div>
                                ` : ''}
                            </div>
                            
                            ${(allSessions && allSessions.length > 0) || Object.keys(localDetails).length > 0 ? `
                                <div>
                                    ${allSessions && allSessions.length > 0 ? `
                                        <div class="section-header">Sessions (${allSessions.length})</div>
                                        <div class="sessions-section">
                                            <div class="sessions-list">
                                                ${allSessions.map((session, index) => `
                                                    <div class="session-item ${session.status === 'Active' ? 'active-session' : ''}">
                                                        <div class="session-item-details">
                                                            <!-- Start time -->
                                                            ${(session.Start || session.startTimeFormatted || session.startTime) ? `
                                                                <div class="session-detail-row">
                                                                    <span class="session-detail-label">Start:</span>
                                                                    <span class="session-detail-value">${session.Start || session.startTimeFormatted || session.startTime}</span>
                                                                </div>
                                                            ` : ''}
                                                            
                                                            <!-- Duration -->
                                                            ${(session.Duration || session.duration) ? `
                                                                <div class="session-detail-row">
                                                                    <span class="session-detail-label">Duration:</span>
                                                                    <span class="session-detail-value">${session.Duration || session.duration}</span>
                                                                </div>
                                                            ` : ''}
                                                            
                                                            <!-- Authentication -->
                                                            ${(session.Auth || session.auth || session.authPackage) ? `
                                                                <div class="session-detail-row">
                                                                    <span class="session-detail-label">Auth:</span>
                                                                    <span class="session-detail-value">${session.Auth || session.auth || session.authPackage}</span>
                                                                </div>
                                                            ` : ''}
                                                            
                                                            <!-- Domain - only if different from current machine -->
                                                            ${session.Domain && !session.Domain.includes('DESKTOP-DF7VJM1') ? `
                                                                <div class="session-detail-row">
                                                                    <span class="session-detail-label">Domain:</span>
                                                                    <span class="session-detail-value">${session.Domain}</span>
                                                                </div>
                                                            ` : ''}
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${Object.keys(localDetails).length > 0 ? `
                                        <div class="section-header">Account Details</div>
                                        <div class="account-details-section">
                                            <pre>${formatAccountDetails(localDetails)}</pre>
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            
            <script>
                function toggleUserDetail(id) {
                    console.log('Toggling section:', id);
                    const element = document.getElementById(id);
                    if (element) {
                        console.log('Element found:', element);
                        if (element.classList.contains('hidden-section-visible')) {
                            console.log('Hiding section');
                            element.classList.remove('hidden-section-visible');
                        } else {
                            console.log('Showing section');
                            // Close any other open sections
                            document.querySelectorAll('.hidden-section-visible').forEach(el => {
                                if (el.id !== id) {
                                    el.classList.remove('hidden-section-visible');
                                }
                            });
                            element.classList.add('hidden-section-visible');
                        }
                    } else {
                        console.error('Element not found:', id);
                    }
                }
            </script>
            
            <style>
                .users-section {
                    margin-bottom: 25px;
                }
                .users-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 15px;
                    padding: 15px;
                }
                .user-card {
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .user-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .user-header {
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    border-bottom: 1px solid #f0f0f0;
                }
                .user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 16px;
                    margin-right: 10px;
                    flex-shrink: 0;
                }
                .user-title {
                    flex: 1;
                    overflow: hidden;
                }
                .username {
                    font-weight: 600;
                    font-size: 15px;
                    color: #333;
                    margin-bottom: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .user-fullname {
                    font-size: 13px;
                    color: #333;
                    font-weight: 500;
                    margin-bottom: 2px;
                }
                .user-status {
                    display: flex;
                    align-items: center;
                    font-size: 11px;
                    color: #666;
                }
                .terminal-info {
                    margin-left: 5px;
                    font-family: monospace;
                    color: #6c757d;
                }
                .status-icon {
                    margin-right: 4px;
                }
                .user-time {
                    text-align: right;
                    font-size: 11px;
                    color: #6c757d;
                }
                .time-detail {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                }
                .time-detail svg {
                    margin-right: 3px;
                }
                .user-details {
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    font-size: 12px;
                }
                .user-account-info, .session-info {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    width: 100%;
                }
                .section-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #444;
                    width: 100%;
                    margin-bottom: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .detail-item {
                    background: #f8f9fa;
                    border-radius: 4px;
                    padding: 5px 8px;
                    flex: 1 1 auto;
                    min-width: calc(50% - 8px);
                    max-width: 100%;
                }
                .detail-item.description {
                    width: 100%;
                    flex-basis: 100%;
                }
                .user-detail-label {
                    font-size: 10px;
                    color: #444;
                    margin-bottom: 3px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 600;
                }
                .detail-value {
                    font-size: 12px;
                    color: #333;
                    word-break: break-word;
                }
                .detail-value.command {
                    font-family: monospace;
                    background: #f0f2f5;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-size: 11px;
                }
                .user-footer {
                    display: flex;
                    border-top: 1px solid #f0f0f0;
                }
                .detail-button {
                    flex: 1;
                    background: none;
                    border: none;
                    padding: 8px;
                    font-size: 12px;
                    color: #444;
                    cursor: pointer;
                    text-align: center;
                    transition: background-color 0.2s, color 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .detail-button::after {
                    content: "▼";
                    font-size: 9px;
                    margin-left: 5px;
                    transition: transform 0.2s;
                }
                .detail-button:hover {
                    background-color: #f0f0f0;
                    color: #000;
                }
                .detail-button:hover::after {
                    transform: translateY(2px);
                }
                .detail-button:not(:last-child) {
                    border-right: 1px solid #f0f0f0;
                }
                .hidden-section {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                    background: #f8f9fa;
                    border-top: 1px solid #f0f0f0;
                }
                .hidden-section-visible {
                    max-height: 800px !important;
                    overflow-y: auto;
                }
                .hidden-section pre {
                    margin: 0;
                    padding: 12px;
                    font-family: monospace;
                    font-size: 11px;
                    white-space: pre-wrap;
                    word-break: break-all;
                    color: #333;
                }
                .sessions-list {
                    padding: 12px;
                }
                .session-item {
                    background: #fff;
                    border-radius: 6px;
                    margin-bottom: 8px;
                    padding: 8px;
                    border: 1px solid #dee2e6;
                }
                .session-item.active-session {
                    border-left: 3px solid #28a745;
                }
                .session-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                    font-size: 11px;
                }
                .session-number {
                    font-weight: 600;
                    color: #444;
                }
                .session-status {
                    font-weight: 500;
                }
                .session-item-details {
                    font-size: 11px;
                }
                .session-detail-row {
                    display: flex;
                    margin-bottom: 3px;
                }
                .session-detail-label {
                    flex: 0 0 45px;
                    color: #444;
                    font-weight: 600;
                }
                .session-detail-value {
                    flex: 1;
                    color: #333;
                }
                
                @media (max-width: 768px) {
                    .users-container {
                        grid-template-columns: 1fr;
                    }
                }
                .section-header {
                    font-size: 12px;
                    font-weight: 600;
                    color: #444;
                    padding: 10px;
                    background-color: #f8f9fa;
                    border-top: 1px solid #f0f0f0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .sessions-section, .account-details-section {
                    background: #f8f9fa;
                    border-top: 1px solid #f0f0f0;
                    max-height: none;
                }
                .consolidated-badge {
                    background-color: #17a2b8;
                    color: white;
                    border-radius: 10px;
                    padding: 1px 6px;
                    font-size: 9px;
                    margin-left: 5px;
                }
            </style>
    `;
}

/**
 * Get SVG path for status icon
 * @param {string} iconName - The icon name
 * @returns {string} SVG path markup
 */
function getStatusIcon(iconName) {
    switch (iconName) {
        case 'check-circle':
            return '<path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />';
        case 'alert-circle':
            return '<path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />';
        case 'account':
            return '<path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />';
        case 'question-mark':
        default:
            return '<path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M13,19H11V17H13V19M13,15H11V7H13V15Z" />';
    }
}

/**
 * Format session details for display
 * @param {Object} details - Session details object
 * @returns {string} Formatted string
 */
function formatSessionDetails(details) {
    if (!details || Object.keys(details).length === 0) {
        return 'No session details available';
    }
    
    try {
        if (typeof details === 'string') {
            // Try to parse if it's a string
            details = JSON.parse(details);
        }
        
        // Pretty print the object
        return JSON.stringify(details, null, 2);
    } catch (e) {
        // If it can't be parsed as JSON, return as is
        return typeof details === 'string' ? details : JSON.stringify(details);
    }
}

/**
 * Format account details for display
 * @param {Object} details - Account details object
 * @returns {string} Formatted string
 */
function formatAccountDetails(details) {
    if (!details || Object.keys(details).length === 0) {
        return 'No account details available';
    }
    
    try {
        if (typeof details === 'string') {
            // Try to parse if it's a string
            details = JSON.parse(details);
        }
        
        const formattedObj = { ...details };
        
        // Format date fields for better readability
        if (formattedObj.LastLogon) {
            formattedObj.LastLogon = formatDateDisplay(formattedObj.LastLogon);
        }
        if (formattedObj.PasswordLastSet) {
            formattedObj.PasswordLastSet = formatDateDisplay(formattedObj.PasswordLastSet);
        }
        if (formattedObj.PasswordExpires) {
            formattedObj.PasswordExpires = formatDateDisplay(formattedObj.PasswordExpires);
        }
        if (formattedObj.AccountExpires) {
            formattedObj.AccountExpires = formatDateDisplay(formattedObj.AccountExpires);
        }
        if (formattedObj.PasswordChangeableDate) {
            formattedObj.PasswordChangeableDate = formatDateDisplay(formattedObj.PasswordChangeableDate);
        }
        
        // Remove SID details to make output more readable
        if (formattedObj.SID && typeof formattedObj.SID === 'object') {
            formattedObj.SID = formattedObj.SID.Value || formattedObj.SID;
        }
        
        // Format boolean values as Yes/No
        for (const key in formattedObj) {
            if (typeof formattedObj[key] === 'boolean') {
                formattedObj[key] = formattedObj[key] ? 'Yes' : 'No';
            } else if (formattedObj[key] === null) {
                formattedObj[key] = 'Never';
            }
        }
        
        // Create a more readable format with key-value pairs
        const formatted = Object.entries(formattedObj)
            .filter(([key, value]) => value !== undefined)
            .map(([key, value]) => {
                // Format the key with spaces between camel case
                const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
                return `${formattedKey}: ${value}`;
            })
            .join('\n');
        
        return formatted;
    } catch (e) {
        // If it can't be parsed as JSON, return as is
        return typeof details === 'string' ? details : JSON.stringify(details);
    }
}

/**
 * Format MS JSON date to readable format
 * @param {string} dateStr - The date string
 * @returns {string} Formatted date string
 */
function formatDateDisplay(dateStr) {
    if (!dateStr) return '-';
    
    try {
        // Handle Microsoft JSON date format: /Date(timestamp)/
        if (typeof dateStr === 'string' && dateStr.includes('/Date(')) {
            const timestamp = parseInt(dateStr.match(/\d+/)[0]);
            const date = new Date(timestamp);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return '-';
            }
            
            // Format date with locale-specific formatting
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            
            // If it's today, show "Today at HH:MM:SS"
            if (date.toDateString() === now.toDateString()) {
                return `Today at ${date.toLocaleTimeString()}`;
            }
            // If it's yesterday, show "Yesterday at HH:MM:SS"
            else if (date.toDateString() === yesterday.toDateString()) {
                return `Yesterday at ${date.toLocaleTimeString()}`;
            }
            // Otherwise show full date and time
            else {
                return date.toLocaleString();
            }
        }
        
        // Regular date string
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date.toLocaleString();
        }
        
        return dateStr;
    } catch (e) {
        return dateStr;
    }
}

/**
 * Consolidates similar sessions based on close start times and matching fields
 * @param {Array} sessions - Array of session objects
 * @returns {Array} - Consolidated array of session objects
 */
function consolidateSimilarSessions(sessions) {
    if (!sessions || sessions.length <= 1) return sessions;
    
    // Clone sessions to avoid mutating original
    const originalSessions = [...sessions];
    const consolidatedSessions = [];
    const processed = new Set();
    
    // Parse start times to allow matching within a time window
    const sessionWithParsedTimes = originalSessions.map((session, index) => {
        // Try to parse the start time
        const startStr = session.Start || session.start || session.startTime || session.startTimeFormatted || '';
        let timestamp = null;
        
        if (startStr) {
            // Extract time from strings like "Yesterday at 05:40:21"
            const timeMatch = startStr.match(/(\d{2}):(\d{2}):(\d{2})/);
            if (timeMatch) {
                const [_, hours, minutes, seconds] = timeMatch;
                timestamp = (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + parseInt(seconds);
            }
        }
        
        return {
            session,
            index,
            timestamp,
            duration: session.Duration || session.duration || '',
            auth: session.Auth || session.auth || session.authPackage || ''
        };
    });
    
    // Process each session
    for (let i = 0; i < sessionWithParsedTimes.length; i++) {
        if (processed.has(i)) continue;
        
        const current = sessionWithParsedTimes[i];
        processed.add(i);
        
        // Skip if we couldn't parse the time
        if (current.timestamp === null) {
            consolidatedSessions.push(current.session);
            continue;
        }
        
        // Find similar sessions (same auth/duration, start time within 15 seconds)
        const similarSessions = [];
        
        for (let j = 0; j < sessionWithParsedTimes.length; j++) {
            if (i === j || processed.has(j)) continue;
            
            const other = sessionWithParsedTimes[j];
            
            // Skip if we couldn't parse the time for the other session
            if (other.timestamp === null) continue;
            
            // Check if similar: same auth, same duration, start time within 15 seconds
            const timeDiff = Math.abs(current.timestamp - other.timestamp);
            if (current.auth === other.auth && 
                current.duration === other.duration && 
                timeDiff <= 15) {
                
                similarSessions.push(other);
                processed.add(j);
            }
        }
        
        if (similarSessions.length > 0) {
            // Create a consolidated session
            const consolidatedSession = { ...current.session };
            
            // Combine all session IDs
            const allSessions = [current, ...similarSessions];
            const ids = allSessions
                .map(item => item.session.Id || item.session.id || '')
                .filter(Boolean);
            
            // Combine all logon types
            const types = allSessions
                .map(item => item.session['Logon Type'] || item.session.logonType || '')
                .filter(Boolean);
            
            // Update the consolidated session
            consolidatedSession.consolidatedCount = similarSessions.length + 1;
            consolidatedSession.consolidatedIds = ids;
            consolidatedSession.consolidatedTypes = [...new Set(types)];
            
            // Use special property names to display in the session item
            consolidatedSession['Session IDs'] = ids.join(', ');
            
            consolidatedSessions.push(consolidatedSession);
        } else {
            // No similar sessions found
            consolidatedSessions.push(current.session);
        }
    }
    
    return consolidatedSessions;
}

export { createUsersCard };