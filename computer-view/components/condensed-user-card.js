/**
 * Creates a row-based user card that matches the screenshot's design
 * @param {Object} user - User object with details
 * @returns {string} HTML string for the user card
 */
function createCondensedUserCard(user) {
  if (!user) return '';
  
  // Skip disabled users - check both capitalized and lowercase "enabled" properties
  if (!user.localUserDetails || 
      (user.localUserDetails.Enabled !== true && 
       user.localUserDetails.enabled !== true)) {
    return '';
  }
  
  // Extract essential user data
  const username = user.user || '';
  const fullName = user.localUserDetails?.FullName || user.localUserDetails?.fullName || '';
  const isActive = user.loggedIn || false;
  const tty = user.tty || '';
  const domain = user.sessionDetails?.domain || '';
  const sessions = user.allSessions || [];
  const sessionCount = sessions.length || 0;
  
  // Get authentication types
  const authTypes = [...new Set(sessions.map(s => s.Auth || s.auth || s.authPackage).filter(Boolean))];
  const authBadge = authTypes.length > 0 ? authTypes[0] : '';
  
  // Activity summary from sessions
  let activitySummary = '';
  let loginDuration = '';
  
  if (sessionCount > 0) {
    // Sort sessions by start time
    const sortedSessions = [...sessions].sort((a, b) => {
      const timeA = new Date(a.startTime || a.logonTime || 0);
      const timeB = new Date(b.startTime || b.logonTime || 0);
      return timeA - timeB;
    });
    
    // Get first and most recent session
    const firstSession = sortedSessions[0];
    const lastSession = sortedSessions[sortedSessions.length - 1];
    
    // Count active sessions
    const activeSessions = sessions.filter(s => s.status === 'Active').length;
    
    // Calculate login duration if user is active
    if (isActive && lastSession) {
      const startTime = new Date(lastSession.startTime || lastSession.logonTime || 0);
      if (!isNaN(startTime.getTime())) {
        loginDuration = formatDuration(startTime);
      }
    }
    
    // Get unique authentication methods
    const authMethods = [...new Set(sessions.map(s => 
      s.Auth || s.auth || s.authPackage
    ).filter(Boolean))];
    
    // Format first activity
    const firstActivity = firstSession?.startTime || firstSession?.logonTime 
      ? formatDateDisplay(firstSession.startTime || firstSession.logonTime, true)
      : 'Unknown';
      
    // Format most recent activity
    const recentActivity = lastSession?.startTime || lastSession?.logonTime
      ? formatDateDisplay(lastSession.startTime || lastSession.logonTime, true)
      : 'Unknown';
    
    activitySummary = `
      <div class="activity-details">
        <div><span>First seen:</span> ${firstActivity}</div>
        <div><span>Latest:</span> ${recentActivity}</div>
        <div><span>Active sessions:</span> ${activeSessions} of ${sessionCount}</div>
        ${authMethods.length > 0 ? `<div><span>Auth methods:</span> ${authMethods.join(', ')}</div>` : ''}
        ${loginDuration ? `<div><span>Logged in for:</span> ${loginDuration}</div>` : ''}
      </div>
    `;
  }
  
  // Account details - check both capitalized and lowercase properties
  const accountExpires = (user.localUserDetails?.AccountExpires || user.localUserDetails?.accountExpires)
    ? formatDateDisplay(user.localUserDetails.AccountExpires || user.localUserDetails.accountExpires) 
    : 'Never Expires';
    
  // Password security details
  const passwordLastSet = formatDateDisplay(
    user.localUserDetails?.PasswordLastSet || 
    user.localUserDetails?.passwordLastSet
  );
  
  const passwordRequired = (user.localUserDetails?.PasswordRequired !== undefined) 
    ? user.localUserDetails.PasswordRequired 
    : (user.localUserDetails?.passwordRequired !== undefined)
      ? user.localUserDetails.passwordRequired
      : true;
      
  const mayChangePassword = (user.localUserDetails?.UserMayChangePassword !== undefined)
    ? user.localUserDetails.UserMayChangePassword
    : (user.localUserDetails?.userMayChangePassword !== undefined)
      ? user.localUserDetails.userMayChangePassword
      : false;

  // Security indicator based on password requirements
  const securityStatus = !passwordRequired ? 'insecure' : 'secure';
  
  // Generate avatar background color
  const avatarColors = {
    'gu': '#e74c3c', // Red for guy03/guest
    'ad': '#f39c12', // Orange for Administrator
    'de': '#9b59b6', // Purple for DefaultAccount
    'vi': '#d35400', // Rust for Visitor
    'wd': '#3498db', // Blue for WDAGUtilityAccount
    'wi': '#e67e22'  // Orange-brown for winrmuser
  };
  
  // Get first two letters of username for avatar and lookup color or use default
  const initials = username.slice(0, 2).toUpperCase();
  const avatarColor = avatarColors[initials.toLowerCase()] || '#7f8c8d';
  
  // Determine if we should show the activity toggle (only if sessions exist)
  const showActivityToggle = sessionCount > 0;
  
  return `
    <div class="user-row ${isActive ? 'user-active' : ''}">
      <div class="user-avatar" style="background-color: ${avatarColor}">
        <span>${initials}</span>
      </div>
      
      <div class="user-info">
        <div class="user-name">${username}</div>
        ${fullName ? `<div class="user-fullname">${fullName}</div>` : ''}
      </div>
      
      ${isActive ? `
        <div class="user-badge login-status">
          <span class="status-dot"></span>
          ${loginDuration ? `Logged in (${loginDuration})` : 'Active'}
        </div>
      ` : ''}
      
      ${tty ? `<div class="user-badge connection">${tty}</div>` : ''}
      
      ${domain ? `<div class="user-badge domain">${domain}</div>` : ''}
      
      ${sessionCount > 0 ? `
        <div class="user-badge sessions">
          <span>${sessionCount} sess</span>
          ${showActivityToggle ? `
            <button class="activity-toggle" onclick="event.stopPropagation(); this.closest('.user-row').classList.toggle('show-activity');">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          ` : ''}
        </div>
      ` : ''}
      
      ${authBadge ? `<div class="user-badge auth">${authBadge}</div>` : ''}
      
      <div class="user-badge ${securityStatus} tooltip">
        ${accountExpires}
        <span class="tooltiptext">
          <div>Password Last Set: ${passwordLastSet || 'Never'}</div>
          <div>Password Required: ${passwordRequired ? 'Yes' : 'No'}</div>
          <div>Can Change Password: ${mayChangePassword ? 'Yes' : 'No'}</div>
        </span>
      </div>
      
      ${showActivityToggle ? `
        <div class="activity-summary">
          ${activitySummary}
        </div>
      ` : ''}
    </div>
    
    <style>
      .user-row {
        display: flex;
        align-items: center;
        background: white;
        border-radius: 8px;
        padding: 6px 14px;
        margin-bottom: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        border-left: 2px solid transparent;
        gap: 12px;
        flex-wrap: wrap;
        position: relative;
        transition: all 0.3s ease;
      }
      
      .user-active {
        border-left: 2px solid #2ecc71;
      }
      
      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 14px;
        flex-shrink: 0;
      }
      
      .user-info {
        min-width: 120px;
        max-width: 180px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      
      .user-name {
        font-weight: 600;
        font-size: 14px;
        color: #333;
      }
      
      .user-fullname {
        font-size: 12px;
        color: #666;
      }
      
      .user-badge {
        font-size: 12px;
        padding: 3px 10px;
        border-radius: 4px;
        background-color: #f8f9fa;
        color: #333;
        white-space: nowrap;
      }
      
      .user-badge.connection {
        background-color: #e3f2fd;
        color: #0366d6;
        font-family: monospace;
      }
      
      .user-badge.time {
        background-color: #fff3e0;
        color: #e67e22;
      }
      
      .user-badge.domain {
        background-color: #f3e5f5;
        color: #9c27b0;
      }
      
      .user-badge.sessions {
        background-color: #e8f5e9;
        color: #2ecc71;
        display: flex;
        align-items: center;
        gap: 5px;
        padding-right: 6px;
      }
      
      .activity-toggle {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        color: #2ecc71;
        border-radius: 50%;
        transition: transform 0.3s ease;
      }
      
      .user-row.show-activity .activity-toggle {
        transform: rotate(180deg);
      }
      
      .user-badge.auth {
        background-color: #ffebee;
        color: #e53935;
      }
      
      .user-badge.secure {
        background-color: #f5f5f5;
        color: #616161;
        margin-left: auto;
      }
      
      .user-badge.insecure {
        background-color: #ffebee;
        color: #e53935;
        margin-left: auto;
      }
      
      .activity-summary {
        display: none;
        width: 100%;
        margin-top: 8px;
        background-color: #f9f9f9;
        border-radius: 4px;
        padding: 8px 12px;
        font-size: 11px;
        color: #555;
        border-left: 3px solid #2ecc71;
      }
      
      .user-row.show-activity .activity-summary {
        display: block;
      }
      
      .activity-details {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 8px;
      }
      
      .activity-details span {
        color: #777;
        margin-right: 4px;
      }
      
      /* Tooltip styles */
      .tooltip {
        position: relative;
        cursor: help;
      }
      
      .tooltip .tooltiptext {
        visibility: hidden;
        width: 220px;
        background-color: #333;
        color: #fff;
        text-align: left;
        border-radius: 6px;
        padding: 8px 10px;
        position: absolute;
        z-index: 1;
        bottom: 125%;
        left: 50%;
        margin-left: -110px;
        opacity: 0;
        transition: opacity 0.3s;
        font-size: 11px;
        line-height: 1.5;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
      }
      
      .tooltip .tooltiptext::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #333 transparent transparent transparent;
      }
      
      .tooltip:hover .tooltiptext {
        visibility: visible;
        opacity: 1;
      }
      
      .user-badge.login-status {
        background-color: #e8f5e9;
        color: #2e7d32;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      .status-dot {
        width: 6px;
        height: 6px;
        background-color: #2ecc71;
        border-radius: 50%;
        display: inline-block;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7);
        }
        70% {
          box-shadow: 0 0 0 5px rgba(46, 204, 113, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(46, 204, 113, 0);
        }
      }
    </style>
  `;
}

/**
 * Format date display for the condensed user card
 * @param {string} dateStr - Date string to format
 * @param {boolean} includeTime - Whether to include time in the output
 * @returns {string} Formatted date string
 */
function formatDateDisplay(dateStr, includeTime = false) {
  if (!dateStr) return 'Never';
  if (dateStr === 'null' || dateStr === null) return 'Never Expires';
  
  try {
    // Handle Microsoft JSON date format: /Date(timestamp)/
    if (typeof dateStr === 'string' && dateStr.includes('/Date(')) {
      const timestamp = parseInt(dateStr.match(/\d+/)[0]);
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Never';
      }
      
      // Check if the date is far in the future (typical for "never expires")
      const now = new Date();
      const yearsDiff = date.getFullYear() - now.getFullYear();
      if (yearsDiff > 50) {
        return 'Never Expires';
      }
      
      // Format based on whether we need time
      if (includeTime) {
        return `${date.getMonth()+1}/${date.getDate()}/${String(date.getFullYear()).slice(2)} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
      } else {
        // Format as MM/DD/YY
        return `${date.getMonth()+1}/${date.getDate()}/${String(date.getFullYear()).slice(2)}`;
      }
    }
    
    // Try to parse regular date string
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      if (includeTime) {
        return `${date.getMonth()+1}/${date.getDate()}/${String(date.getFullYear()).slice(2)} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
      } else {
        return `${date.getMonth()+1}/${date.getDate()}/${String(date.getFullYear()).slice(2)}`;
      }
    }
    
    return 'Never';
  } catch (e) {
    return 'Never';
  }
}

/**
 * Format a duration from a start date until now
 * @param {Date} startDate - The start date to calculate duration from
 * @returns {string} Formatted duration string
 */
function formatDuration(startDate) {
  const now = new Date();
  const diffMs = now - startDate;
  
  // Convert to seconds
  let seconds = Math.floor(diffMs / 1000);
  
  // Calculate days, hours, minutes, seconds
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  
  // Format the duration
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

export { createCondensedUserCard }; 