import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatHandler from './api/chat.js';
import healthHandler from './api/health.js';

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Routes - mirroring Vercel's file based routing
app.get('/api/health', healthHandler);
app.post('/api/chat', chatHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`----------------------------------------------------------------`);
  console.log(`> Local Server running on http://localhost:${PORT}`);
  console.log(`> Ready to handle requests at /api/chat and /api/health`);
  console.log(`----------------------------------------------------------------`);
});
