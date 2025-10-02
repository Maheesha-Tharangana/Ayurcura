import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  // This is a dummy provider that doesn't actually connect to WebSocket
  // We're disabling WebSockets completely to prevent connection errors
  
  // Simply render children - we're not establishing any WebSocket connection
  return <>{children}</>;
}