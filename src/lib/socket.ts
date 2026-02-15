import { Server } from 'socket.io';

export const setupSocket = (io: Server, opts?: { dev?: boolean }) => {
  const dev = Boolean(opts?.dev);
  io.on('connection', (socket) => {
    if (dev) console.log('Client connected:', socket.id);
    
    // Minimal production-safe events.
    // In dev we keep a simple echo for testing.
    socket.on('ping', (cb?: (payload: { ok: true; ts: string }) => void) => {
      cb?.({ ok: true, ts: new Date().toISOString() });
    });

    if (dev) {
    socket.on('message', (msg: { text: string; senderId: string }) => {
      socket.emit('message', {
          text: `Echo: ${String(msg?.text ?? '')}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    socket.emit('message', {
        text: 'Welcome to WebSocket Echo Server (dev only).',
      senderId: 'system',
      timestamp: new Date().toISOString(),
      });
    }

    // Handle disconnect
    socket.on('disconnect', () => {
      if (dev) console.log('Client disconnected:', socket.id);
    });
  });
};