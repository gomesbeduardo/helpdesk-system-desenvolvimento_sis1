import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, role } = req.body;

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'E-mail já cadastrado.' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    // Role só pode ser definido por admin autenticado via PUT /users/:id
    const isAdmin = req.user?.role === 'admin';
    const userRole = (isAdmin && role) ? role : 'user';

    const result = await pool.query(
      `INSERT INTO users (id, name, email, password, role) VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, email, role, created_at`,
      [id, name, email, hash, userRole]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function getUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const requestUser = req.user!;

    // non-admins can only update themselves
    if (requestUser.role !== 'admin' && requestUser.id !== id) {
      res.status(403).json({ error: 'Acesso negado.' });
      return;
    }

    const { name, email, password, role } = req.body;

    const current = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const newName = name !== undefined ? name : current.rows[0].name;
    const newEmail = email !== undefined ? email : current.rows[0].email;

    if (email && email !== current.rows[0].email) {
      const dup = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (dup.rows.length > 0) {
        res.status(409).json({ error: 'E-mail já cadastrado por outro usuário.' });
        return;
      }
    }
    const newRole = (requestUser.role === 'admin' && role) ? role : current.rows[0].role;
    const newPassword = password ? await bcrypt.hash(password, 10) : current.rows[0].password;

    const result = await pool.query(
      `UPDATE users SET name=$1, email=$2, password=$3, role=$4, updated_at=NOW()
       WHERE id=$5 RETURNING id, name, email, role, created_at, updated_at`,
      [newName, newEmail, newPassword, newRole, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (req.user!.id === id) {
      res.status(400).json({ error: 'Não é possível excluir a própria conta.' });
      return;
    }
    const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
