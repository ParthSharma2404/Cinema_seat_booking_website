const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer, WebSocket } = require('ws');
const { EventEmitter } = require('events');

// Shared in-process event bus for Next.js API routes & WebSocket server
if (!globalThis.__wsEventBus) {
  globalThis.__wsEventBus = new EventEmitter();
  globalThis.__wsEventBus.setMaxListeners(300);
}
const wsEventBus = globalThis.__wsEventBus;

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('HTTP Request handling error:', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Attach WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  // Map of showId -> Set of active WebSocket client connections
  const rooms = new Map();

  function addToRoom(showId, ws) {
    if (!showId) return;
    if (!rooms.has(showId)) {
      rooms.set(showId, new Set());
    }
    rooms.get(showId).add(ws);
    ws.__subscribedShowId = showId;
  }

  function removeFromRoom(showId, ws) {
    if (!showId || !rooms.has(showId)) return;
    const clientSet = rooms.get(showId);
    clientSet.delete(ws);
    if (clientSet.size === 0) {
      rooms.delete(showId);
    }
  }

  function removeClientFromAllRooms(ws) {
    if (ws.__subscribedShowId) {
      removeFromRoom(ws.__subscribedShowId, ws);
      ws.__subscribedShowId = null;
    }
    for (const [showId, clientSet] of rooms.entries()) {
      if (clientSet.has(ws)) {
        clientSet.delete(ws);
        if (clientSet.size === 0) {
          rooms.delete(showId);
        }
      }
    }
  }

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    const parsedUrl = parse(req.url, true);
    const showId = parsedUrl.query.showId;
    if (showId) {
      addToRoom(showId, ws);
    }

    // Welcome handshake
    ws.send(
      JSON.stringify({
        type: 'CONNECTED',
        message: 'CineBook WebSocket live sync connected',
        subscribedShowId: showId || null,
        timestamp: Date.now(),
      })
    );

    ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.action === 'SUBSCRIBE' && payload.showId) {
          if (ws.__subscribedShowId && ws.__subscribedShowId !== payload.showId) {
            removeFromRoom(ws.__subscribedShowId, ws);
          }
          addToRoom(payload.showId, ws);
          ws.send(
            JSON.stringify({
              type: 'SUBSCRIBED',
              showId: payload.showId,
              timestamp: Date.now(),
            })
          );
        } else if (payload.action === 'UNSUBSCRIBE' && payload.showId) {
          removeFromRoom(payload.showId, ws);
        } else if (payload.action === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        }
      } catch (e) {
        // Invalid json, ignore
      }
    });

    ws.on('close', () => {
      removeClientFromAllRooms(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket client error:', err);
      removeClientFromAllRooms(ws);
    });
  });

  // Listen for seat events emitted by API route handlers & database transactions
  wsEventBus.on('seat-update', (event) => {
    const message = JSON.stringify({
      type: event.type,
      showId: event.showId,
      seatIds: event.seatIds || [],
      userId: event.userId || null,
      expiresAt: event.expiresAt || null,
      timestamp: Date.now(),
    });

    if (event.showId === '*' || !event.showId) {
      // Broadcast to all active clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } else {
      // Broadcast to clients subscribed to this show
      const clients = rooms.get(event.showId);
      if (clients && clients.size > 0) {
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    }
  });

  // Handle HTTP upgrade requests on /api/ws and /ws
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url);
    if (pathname === '/api/ws' || pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Heartbeat interval to prune dead connections (every 30 seconds)
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        removeClientFromAllRooms(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port} (Next.js + WebSocket Server)`);
  });
});
