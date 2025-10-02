import { useState, useCallback } from 'react';

// Mock interface to match the original hook
interface WebSocketOptions {
  onConnect?: () => void;
  onMessage?: (data: any) => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * Mock WebSocket hook that doesn't actually create any connections
 * This completely eliminates the WebSocket reconnection issues
 */
export function useWebSocket(_options: WebSocketOptions = {}) {
  // Keep minimal state for compatibility
  const [lastMessage] = useState<any>(null);
  const [notifications] = useState<any[]>([]);
  
  // Dummy functions that do nothing
  const sendMessage = useCallback(() => false, []);
  const clearNotifications = useCallback(() => {}, []);
  const connect = useCallback(() => {}, []);
  
  // Return mock values to prevent errors in components using this hook
  return {
    socket: null,
    isConnected: false,
    lastMessage,
    notifications,
    sendMessage,
    clearNotifications,
    reconnect: connect
  };
}