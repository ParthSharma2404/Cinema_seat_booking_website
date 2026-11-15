import { EventEmitter } from 'events';

export type SeatUpdateEvent = {
  showId: string;
  type: 'SEAT_HELD' | 'SEAT_RELEASED' | 'SEAT_BOOKED' | 'SEAT_EXPIRED' | 'REFRESH';
  seatIds?: string[];
  userId?: string;
  expiresAt?: string | null;
};

class WebSocketEventBus extends EventEmitter {}

// Global singleton so it persists across modules in the same Node.js process
const globalForWs = globalThis as unknown as { __wsEventBus?: WebSocketEventBus };
export const wsEventBus: WebSocketEventBus = globalForWs.__wsEventBus || new WebSocketEventBus();
wsEventBus.setMaxListeners(200);

if (process.env.NODE_ENV !== 'production') {
  globalForWs.__wsEventBus = wsEventBus;
}

/**
 * Broadcast an event to all connected WebSocket clients subscribed to a show
 */
export function broadcastSeatEvent(event: SeatUpdateEvent) {
  try {
    wsEventBus.emit('seat-update', event);
  } catch (err) {
    console.error('Failed to emit WebSocket event:', err);
  }
}
