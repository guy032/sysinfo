/**
 * Creates an elegant card-based layout to display user information
 * @param {Array} users - Array of user objects
 * @returns {string} HTML string for the users component
 */
function createUsersCard(users) {
    if (!users || users.length === 0) return '';
    
    // Count total users
    const userCount = users.length;
    
    return `
        <div class="section users-section">
            <div class="section-title">Users (${userCount} ${userCount === 1 ? 'item' : 'items'})</div>
            
            <div class="users-container">
                ${users.map(user => {
                    // Extract user data with fallbacks
                    const username = user.user || 'Unknown';
                    const tty = user.tty || '-';
                    const date = user.date || '-';
                    const time = user.time || '-';
                    const ip = user.ip || '-';
                    const command = user.command || '-';
                    const sessionId = user.sessionId || '-';
                    const sessionDetails = JSON.stringify(user.sessionDetails || {});
                    
                    // Generate avatar background based on username
                    const avatarColors = [
                        '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
                        '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad'
                    ];
                    const colorIndex = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarColors.length;
                    const avatarColor = avatarColors[colorIndex];
                    
                    // Get initials for avatar
                    const initials = username.slice(0, 2).toUpperCase();
                    
                    // Determine session status icon/color
                    let sessionStatusIcon = "question-mark";
                    let sessionStatusColor = "#6c757d";  // Default gray
                    
                    if (sessionDetails.includes("logonTime")) {
                        sessionStatusIcon = "check-circle";
                        sessionStatusColor = "#28a745";  // Green
                    }
                    
                    return `
                        <div class="user-card">
                            <div class="user-header">
                                <div class="user-avatar" style="background-color: ${avatarColor}">
                                    ${initials}
                                </div>
                                <div class="user-title">
                                    <div class="username">${username}</div>
                                    <div class="user-status">
                                        <svg class="status-icon" style="color: ${sessionStatusColor}" viewBox="0 0 24 24" width="16" height="16">
                                            ${getStatusIcon(sessionStatusIcon)}
                                        </svg>
                                        <span>${tty}</span>
                                    </div>
                                </div>
                                <div class="user-time">
                                    <div class="time-detail">
                                        <svg viewBox="0 0 24 24" width="14" height="14">
                                            <path fill="currentColor" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />
                                        </svg>
                                        <span>${date} ${time}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="user-details">
                                <div class="detail-item">
                                    <div class="detail-label">IP Address</div>
                                    <div class="detail-value">${ip}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Command</div>
                                    <div class="detail-value command">${command}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Session ID</div>
                                    <div class="detail-value">${sessionId}</div>
                                </div>
                            </div>
                            
                            <div class="user-session-details">
                                <div class="session-toggle" onclick="toggleSessionDetails(this)">
                                    <span>Session Details</span>
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <path fill="currentColor" d="M7,10L12,15L17,10H7Z" />
                                    </svg>
                                </div>
                                <div class="session-details-content">
                                    <pre>${formatSessionDetails(user.sessionDetails || {})}</pre>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <script>
                function toggleSessionDetails(element) {
                    const content = element.nextElementSibling;
                    const icon = element.querySelector('svg');
                    
                    if (content.style.maxHeight) {
                        content.style.maxHeight = null;
                        icon.style.transform = 'rotate(0deg)';
                    } else {
                        content.style.maxHeight = content.scrollHeight + "px";
                        icon.style.transform = 'rotate(180deg)';
                    }
                }
            </script>
            
            <style>
                .users-section {
                    margin-bottom: 25px;
                }
                .users-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 20px;
                    padding: 15px;
                }
                .user-card {
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .user-header {
                    display: flex;
                    align-items: center;
                    padding: 15px;
                    border-bottom: 1px solid #f0f0f0;
                }
                .user-avatar {
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 18px;
                    margin-right: 12px;
                    flex-shrink: 0;
                }
                .user-title {
                    flex: 1;
                    overflow: hidden;
                }
                .username {
                    font-weight: 600;
                    font-size: 16px;
                    color: #333;
                    margin-bottom: 3px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .user-status {
                    display: flex;
                    align-items: center;
                    font-size: 12px;
                    color: #666;
                }
                .status-icon {
                    margin-right: 5px;
                }
                .user-time {
                    text-align: right;
                    font-size: 12px;
                    color: #6c757d;
                }
                .time-detail {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    margin-bottom: 3px;
                }
                .time-detail svg {
                    margin-right: 4px;
                }
                .user-details {
                    padding: 15px;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 15px;
                    border-bottom: 1px solid #f0f0f0;
                }
                .detail-item {
                    overflow: hidden;
                }
                .detail-label {
                    font-size: 12px;
                    color: #6c757d;
                    margin-bottom: 5px;
                }
                .detail-value {
                    font-size: 14px;
                    color: #333;
                    word-break: break-word;
                }
                .detail-value.command {
                    font-family: monospace;
                    background: #f5f7fa;
                    padding: 4px 6px;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .user-session-details {
                    border-top: 1px solid #f0f0f0;
                }
                .session-toggle {
                    padding: 12px 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    background: #f8f9fa;
                    transition: background-color 0.2s;
                }
                .session-toggle:hover {
                    background: #e9ecef;
                }
                .session-toggle svg {
                    transition: transform 0.3s;
                }
                .session-details-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease-out;
                    background: #f8f9fa;
                    font-family: monospace;
                    font-size: 12px;
                }
                .session-details-content pre {
                    margin: 0;
                    padding: 15px;
                    white-space: pre-wrap;
                    word-break: break-all;
                    color: #333;
                }
                
                @media (max-width: 768px) {
                    .users-container {
                        grid-template-columns: 1fr;
                    }
                    .user-details {
                        grid-template-columns: 1fr 1fr;
                    }
                }
            </style>
        </div>
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

export { createUsersCard }; 