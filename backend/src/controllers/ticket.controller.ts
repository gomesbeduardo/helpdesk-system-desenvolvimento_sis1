import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { TicketStatus } from '../types';

export async function getTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { status, category_id, search, page = '1', limit = '10', sort } = req.query as Record<string, string>;

    let query = `
      SELECT t.*, u.name as user_name, c.name as category_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    let idx = 1;

    if (user.role === 'user') {
      query += ` AND t.user_id = $${idx++}`;
      params.push(user.id);
    }

    if (status) {
      query += ` AND t.status = $${idx++}`;
      params.push(status);
    }

    if (category_id) {
      query += ` AND t.category_id = $${idx++}`;
      params.push(category_id);
    }

    if (search) {
      query += ` AND (t.title ILIKE $${idx} OR t.description ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    const orderBy = sort === 'priority' ? 'CASE t.priority WHEN \'urgent\' THEN 1 WHEN \'high\' THEN 2 WHEN \'medium\' THEN 3 ELSE 4 END' : 't.created_at DESC';
    query += ` ORDER BY ${orderBy}`;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) AS sub`, params);
    const total = parseInt(countResult.rows[0].count);

    query += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limitNum, offset);

    const result = await pool.query(query, params);
    res.json({ tickets: result.rows, total, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
}

export async function getTicketById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT t.*, u.name as user_name, c.name as category_name
       FROM tickets t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Chamado não encontrado.' });
      return;
    }

    const ticket = result.rows[0];

    if (user.role === 'user' && ticket.user_id !== user.id) {
      res.status(403).json({ error: 'Acesso negado.' });
      return;
    }

    res.json(ticket);
  } catch (err) {
    next(err);
  }
}

export async function createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { title, description, priority, category_id } = req.body;
    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO tickets (id, title, description, status, priority, user_id, category_id)
       VALUES ($1,$2,$3,'open',$4,$5,$6) RETURNING *`,
      [id, title, description, priority, user.id, category_id]
    );

    await pool.query(
      `INSERT INTO ticket_status_history (id, ticket_id, old_status, new_status, changed_by)
       VALUES ($1,$2,NULL,'open',$3)`,
      [uuidv4(), id, user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function updateTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const current = await pool.query('SELECT * FROM tickets WHERE id=$1', [id]);
    if (current.rows.length === 0) {
      res.status(404).json({ error: 'Chamado não encontrado.' });
      return;
    }

    const ticket = current.rows[0];
    if (user.role === 'user' && ticket.user_id !== user.id) {
      res.status(403).json({ error: 'Acesso negado.' });
      return;
    }

    const { title, description, priority, category_id } = req.body;

    const result = await pool.query(
      `UPDATE tickets SET title=$1, description=$2, priority=$3, category_id=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [
        title || ticket.title,
        description || ticket.description,
        priority || ticket.priority,
        category_id || ticket.category_id,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function deleteTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const current = await pool.query('SELECT * FROM tickets WHERE id=$1', [id]);
    if (current.rows.length === 0) {
      res.status(404).json({ error: 'Chamado não encontrado.' });
      return;
    }

    if (user.role === 'user' && current.rows[0].user_id !== user.id) {
      res.status(403).json({ error: 'Acesso negado.' });
      return;
    }

    await pool.query('DELETE FROM tickets WHERE id=$1', [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function updateTicketStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Status inválido.' });
      return;
    }

    const current = await pool.query('SELECT * FROM tickets WHERE id=$1', [id]);
    if (current.rows.length === 0) {
      res.status(404).json({ error: 'Chamado não encontrado.' });
      return;
    }

    const oldStatus = current.rows[0].status;

    const result = await pool.query(
      `UPDATE tickets SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, id]
    );

    await pool.query(
      `INSERT INTO ticket_status_history (id, ticket_id, old_status, new_status, changed_by)
       VALUES ($1,$2,$3,$4,$5)`,
      [uuidv4(), id, oldStatus, status, user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}
