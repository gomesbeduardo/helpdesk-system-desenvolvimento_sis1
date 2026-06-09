import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      `SELECT h.*, u.name as changed_by_name
       FROM ticket_status_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.ticket_id=$1 ORDER BY h.created_at ASC`,
      [ticket_id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}
