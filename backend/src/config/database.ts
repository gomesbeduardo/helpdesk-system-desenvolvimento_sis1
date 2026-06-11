/**
 * Configuração e exportação do pool de conexões com o PostgreSQL.
 *
 * O Pool reutiliza conexões abertas em vez de criar uma nova por requisição,
 * reduzindo latência e consumo de recursos no banco.
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host:     process.env['DB_HOST'] || 'localhost',
  port:     Number(process.env['DB_PORT']) || 5432,
  database: process.env['DB_NAME'] || 'helpdesk',
  user:     process.env['DB_USER'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'postgres',
});

// Encerra o processo se uma conexão ociosa do pool emitir erro inesperado.
// Sem esse handler, o erro seria silenciado e o pool poderia ficar em estado inconsistente.
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
