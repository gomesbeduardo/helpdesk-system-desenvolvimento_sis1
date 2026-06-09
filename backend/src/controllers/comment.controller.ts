import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';

export async function getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id: ticket_id } = req.params;

    const ticket = await pool.query('SELECT * FROM tickets WHERE id=$1', [ticket_id]);
    if (ticket.rows.length === 0) {
      res.status(404).json({ error: 'Chamado não encontrado.' });
      return;
    }

    if (user.role === 'user' && ticket.rows[0].user_id !== user.id) {
      res.status(403).json({ error: 'Acesso negado.' });
      return;
    }

    const result = await pool.query(
      `SELECT c.*, u.name as user_name, u.role as user_role
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.ticket_id=$1 ORDER BY c.created_at ASC`,
      [ticket_id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id: ticket_id } = req.params;
    const { message } = req.body;

    const ticket = await pool.query('SELECT * FROM tickets WHERE id=$1', [ticket_id]);
    if (ticket.rows.length === 0) {
      res.status(404).json({ error: 'Chamado não encontrado.' });
      return;
    }

    if (user.role === 'user' && ticket.rows[0].user_id !== user.id) {
      res.status(403).json({ error: 'Acesso negado. Você não pode comentar neste chamado.' });
      return;
    }

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO comments (id, message, ticket_id, user_id) VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [id, message, ticket_id, user.id]
    );

    const full = await pool.query(
      `SELECT c.*, u.name as user_name, u.role as user_role FROM comments c
       LEFT JOIN users u ON c.user_id = u.id WHERE c.id=$1`,
      [id]
    );

    res.status(201).json(full.rows[0]);
  } catch (err) {
    next(err);
  }
}
