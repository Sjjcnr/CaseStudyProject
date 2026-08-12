import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import apiRoutes from './routes';
import { globalErrorHandler } from './middlewares/errorHandler';
import { sendSuccess, sendError } from './utils/response';

const app = express();

// CORS setup - restricted origin, explicitly allow Authorization header
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy restricts access from origin ${origin}`));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// GET / - Root welcome endpoint
app.get('/', (req: Request, res: Response) => {
  return sendSuccess(res, {
    service: 'Mini ERP + CRM Backend API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1',
    },
  });
});

// GET /health - Unauthenticated health check endpoint
app.get('/health', (req: Request, res: Response) => {
  return sendSuccess(res, {
    status: 'ok',
    service: 'mini-erp-crm-backend',
    timestamp: new Date().toISOString(),
  });
});

// API v1 Routes
app.use('/api/v1', apiRoutes);

// 404 Handler for undefined routes
app.use((req: Request, res: Response) => {
  return sendError(res, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, [], 404);
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
