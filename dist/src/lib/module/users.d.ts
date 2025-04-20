export interface UserOptions {
    platform?: string;
    [key: string]: any;
}
export interface UserInfo {
    user: string;
    tty: string;
    date: string;
    time: string;
    ip: string;
    command: string;
    sessionId?: string;
    sessionDetails?: SessionDetails;
    allSessions?: UserSession[];
}
export interface WhoUserInfo {
    user: string;
    tty: string;
    date: string;
    time: string;
    ip: string;
}
export interface WUserInfo {
    user: string;
    tty: string;
    ip: string;
    command: string;
}
export interface SessionDetails {
    domain: string;
    logonTime: string;
    authPackage: string;
    logonType: string;
    logonTypeDescription: string;
}
export interface UserSession {
    id: string;
    domain: string;
    logonTime: string;
    authPackage: string;
    logonType: string;
    logonTypeDescription: string;
    startTime: string;
    startTimeFormatted: string;
    endTime: string;
    endTimeFormatted: string;
    duration: string;
    status: string;
}
export interface QueryUserInfo {
    user: string;
    tty: string;
    date: string;
    time: string;
}
export interface LoginLogoffInfo {
    username: string;
    logonTime: string | null;
    logoffTime: string | null;
}
export interface SessionInfo {
    startTime: string;
    authPackage?: string;
    logonType?: string;
    logonTypeDescription?: string;
    endTime?: string | null;
}
export interface LoggedOnUserInfo {
    domain: string;
    user: string;
    authPackage?: string;
    logonType?: string;
    logonTypeDescription?: string;
    dateTime?: string;
}
export interface FormattedDate {
    isoString: string;
    formatted: string;
}
/**
 * Get logged in user information
 * @param options User options
 * @param callback Optional callback function
 * @returns Promise resolving to user information
 */
export declare function users(options?: UserOptions, callback?: (data: UserInfo[]) => void): Promise<UserInfo[]>;
//# sourceMappingURL=users.d.ts.map