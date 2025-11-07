import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import movieRoutes from './routes/movies.routes.js';
import rentalRoutes from './routes/rentals.routes.js';
import subscriptionRoutes from './routes/subscriptions.routes.js';
import paymentRoutes from './routes/payments.routes.js';
import invoiceRoutes from './routes/invoices.routes.js';
import ticketRoutes from './routes/tickets.routes.js';
import tmdbRoutes from './routes/tmdb.routes.js';
import { requireAuth, requireAdmin } from './middleware/auth.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Demasiados intentos de autenticación, intenta de nuevo más tarde.'
  },
});

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-dominio.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(limiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'cinespark', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Public routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tmdb', tmdbRoutes); // Rutas públicas para explorar TMDb
app.use('/api/movies', movieRoutes); // Rutas GET públicas, POST/PUT/DELETE protegidas en el router
app.use('/api/rentals', requireAuth, rentalRoutes);
app.use('/api/subscriptions', requireAuth, subscriptionRoutes);
app.use('/api/pagos', requireAuth, paymentRoutes);
app.use('/api/facturas', requireAuth, invoiceRoutes);
app.use('/api/tickets', requireAuth, ticketRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

