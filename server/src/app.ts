import cors from 'cors';
import express from 'express';
import { businessDataRouter } from './routes/business-data.routes.js';
import { chatRouter } from './routes/chat.routes.js';
import { supportRouter } from './routes/support.routes.js';
import { isDatabaseConnected } from './db/mongoose.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (_request, response) => {
  response.json({
    name: 'ORVIX API',
    description: 'Autonomous customer support and root-cause engine',
    status: 'running',
    health: '/api/health'
  });
});

app.get('/api/health', (_request, response) => {
  const connected = isDatabaseConnected();
  response.status(connected ? 200 : 503).json({
    service: 'orvix-api',
    status: connected ? 'ok' : 'degraded',
    database: connected ? 'connected' : 'unavailable'
  });
});

app.use('/api', (_request, response, next) => {
  if (!isDatabaseConnected()) {
    response.status(503).json({ error: 'Support data is temporarily unavailable. Check the MongoDB connection and try again.' });
    return;
  }
  next();
});

app.use('/api/chat', chatRouter);
app.use('/api/support', supportRouter);
app.use('/api', businessDataRouter);

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found' });
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ error: 'Internal server error' });
});
