import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { notFound, errorHandler } from './utils/errors.js';

import authRoutes from './routes/auth.js';
import businessRoutes from './routes/businesses.js';
import employeeRoutes from './routes/employees.js';
import cardRoutes from './routes/cards.js';
import publicRoutes from './routes/public.js';
import stampRoutes from './routes/stamps.js';
import rewardRoutes from './routes/rewards.js';
import clientRoutes from './routes/clients.js';
import uploadRoutes from './routes/upload.js';

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((s) => s.trim()).filter(Boolean)
  : null;

app.use(
  cors({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'loyalty-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/stamps', stampRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/upload', uploadRoutes);
// Rutas públicas del cliente (sin cuenta)
app.use('/api/public', publicRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
