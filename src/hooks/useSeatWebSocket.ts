'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketSeatMessage {
  type:
    | 'CONNECTED'
    | 'SUBSCRIBED'
    | 'SEAT_HELD'
    | 'SEAT_RELEASED'
    | 'SEAT_BOOKED'
    | 'SEAT_EXPIRED'
    | 'REFRESH'
    | 'PONG';
  showId?: string;
  seatIds?: string[];
  userId?: string | null;
  expiresAt?: string | null;
  timestamp?: number;
}

/**
 * Real-time WebSocket hook for synchronizing seat occupancy and holds across browsers
 */
export function useSeatWebSocket(
  showId: string | null | undefined,
  onSeatMessage?: (msg: WebSocketSeatMessage) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onSeatMessageRef = useRef(onSeatMessage);
  onSeatMessageRef.current = onSeatMessage;

  useEffect(() => {
    if (!showId) return;
    const activeShowId: string = showId;

    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws?showId=${encodeURIComponent(
          activeShowId
        )}`;

        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) {
            ws.close();
            return;
          }
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data: WebSocketSeatMessage = JSON.parse(event.data);
            if (onSeatMessageRef.current) {
              onSeatMessageRef.current(data);
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          // Auto-reconnect after 2.5s
          if (!reconnectTimerRef.current) {
            reconnectTimerRef.current = setTimeout(() => {
              reconnectTimerRef.current = null;
              connect();
            }, 2500);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.warn('Failed to establish WebSocket connection:', err);
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            connect();
          }, 3000);
        }
      }
    }

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [showId]);

  return { isConnected };
}
