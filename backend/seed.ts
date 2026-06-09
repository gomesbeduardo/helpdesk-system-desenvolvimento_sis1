import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './src/config/database';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Iniciando seed...');

  const adminHash = await bcrypt.hash('admin123', 10);
  const techHash = await bcrypt.hash('tech123', 10);
  const userHash = await bcrypt.hash('user123', 10);

  await pool.query(`
    INSERT INTO users (id, name, email, password, role) VALUES
      ($1, 'Administrador', 'admin@helpdesk.com', $2, 'admin'),
      ($3, 'Técnico Silva', 'tecnico@helpdesk.com', $4, 'technician'),
      ($5, 'João Usuário', 'joao@helpdesk.com', $6, 'user')
    ON CONFLICT (email) DO NOTHING
  `, [uuidv4(), adminHash, uuidv4(), techHash, uuidv4(), userHash]);

  console.log('✅ Usuários criados:');
  console.log('   admin@helpdesk.com / admin123 (admin)');
  console.log('   tecnico@helpdesk.com / tech123 (technician)');
  console.log('   joao@helpdesk.com / user123 (user)');

  await pool.end();
}

seed().catch(console.error);
