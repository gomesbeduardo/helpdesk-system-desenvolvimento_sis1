/**
 * Ponto de entrada da aplicação.
 * Configura middlewares globais, registra as rotas e inicializa o servidor HTTP.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

import authRoutes     from './routes/auth.routes';
import userRoutes     from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import ticketRoutes   from './routes/ticket.routes';
import { errorHandler } from './middlewares/error.middleware';

if (!process.env['JWT_SECRET']) {
  console.error('FATAL: JWT_SECRET não definido. Configure o arquivo .env e reinicie.');
  process.exit(1);
}

const app = express();

const allowedOrigin = process.env['FRONTEND_URL'] || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
});

// Habilita parsing de JSON no corpo das requisições
app.use(express.json());

// Log de todas as requisições no formato compacto (método, rota, status, tempo)
app.use(morgan('dev'));

// Rotas da aplicação
app.use('/auth',       authLimiter, authRoutes);
app.use('/users',      userRoutes);
app.use('/categories', categoryRoutes);
app.use('/tickets',    ticketRoutes);

// Endpoint de verificação de saúde — útil para monitoramento e CI/CD
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Middleware de tratamento global de erros — deve ser registrado por último
app.use(errorHandler);

const PORT = process.env['PORT'] || 3001;

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});

export default app;
