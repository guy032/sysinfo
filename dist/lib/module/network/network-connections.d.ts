interface NetworkConnection {
    protocol: string;
    localAddress: string;
    localPort: string;
    peerAddress: string;
    peerPort: string;
    state: string | null;
    pid: number | null;
    process?: string;
}
/**
 * Get network connections (sockets)
 * @param options Optional parameters
 * @param callback Optional callback function
 * @returns Promise resolving to network connections
 */
export declare function networkConnections(options?: any, callback?: (connections: NetworkConnection[]) => void): Promise<NetworkConnection[]>;
export {};
//# sourceMappingURL=network-connections.d.ts.map