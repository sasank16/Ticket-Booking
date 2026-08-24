import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { initSocket } from './services/socketService';
import { startTtlWorker } from './jobs/ttlWorker';

const startServer = async () => {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize Real-time WebSockets
  initSocket(server, config.clientUrl);

  // Start TTL Background Worker
  startTtlWorker(10000); // Check every 10 seconds

  server.listen(config.port, () => {
    console.log(`?? Ticket Booking Engine running on http://localhost:${config.port}`);
    console.log(`?? WebSocket Gateway ready on port ${config.port}`);
  });
};

startServer().catch((err) => {
  console.error('Fatal Server Error:', err);
  process.exit(1);
});
