const serverIdToClientId = new Map<string, string>();

/**
 * Links a confirmed server message ID to its client-generated ID
 * so the message maintains a stable React key from pending to confirmed.
 */
export function linkServerIdToClientId(serverId: string, clientId: string): void {
  serverIdToClientId.set(serverId, clientId);
  if (serverIdToClientId.size > 1000) {
    const oldestKey = serverIdToClientId.keys().next().value;
    if (oldestKey) serverIdToClientId.delete(oldestKey);
  }
}

/**
 * Returns the client-generated ID associated with a server message ID, if known.
 */
export function getClientIdForServerId(serverId: string): string | undefined {
  return serverIdToClientId.get(serverId);
}
