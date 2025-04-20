interface WebsiteCheckResult {
    url: string;
    statusCode: number;
    message: string;
    time: number;
}
/**
 * Check if a website is reachable and get response details
 * @param {string} url URL to check
 * @param {number} [timeout=5000] Timeout in ms
 * @returns {Promise<WebsiteCheckResult>} Object with status info
 */
declare function checkWebsite(url: string, timeout?: number): Promise<WebsiteCheckResult>;
export default checkWebsite;
//# sourceMappingURL=check-website.d.ts.map