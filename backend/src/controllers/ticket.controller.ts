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

export async function getTicketStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const params: string[] = [];
    const where = user.role === 'user' ? 'WHERE user_id = $1' : '';
    if (user.role === 'user') params.push(user.id);

    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'open')        AS open,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved')    AS resolved,
        COUNT(*) FILTER (WHERE status = 'closed')      AS closed,
        COUNT(*)                                        AS total
      FROM tickets ${where}
    `, params);

    const row = result.rows[0];
    res.json({
      open:        parseInt(row.open),
      in_progress: parseInt(row.in_progress),
      resolved:    parseInt(row.resolved),
      closed:      parseInt(row.closed),
      total:       parseInt(row.total),
    });
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
  const client = await pool.connect();
  try {
    const user = req.user!;
    const { title, description, priority, category_id } = req.body;
    const id = uuidv4();

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO tickets (id, title, description, status, priority, user_id, category_id)
       VALUES ($1,$2,$3,'open',$4,$5,$6) RETURNING *`,
      [id, title, description, priority, user.id, category_id]
    );

    await client.query(
      `INSERT INTO ticket_status_history (id, ticket_id, old_status, new_status, changed_by)
       VALUES ($1,$2,NULL,'open',$3)`,
      [uuidv4(), id, user.id]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function updateTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const current = await pool.query(
      'SELECT id, title, description, status, priority, user_id, category_id FROM tickets WHERE id=$1',
      [id]
    );
    if (current.rows.length === 0) {
      res.status(404).json({ error: 'Chamado não encontrado.' });
      return;
    }

    const ticket = current.rows[0];
    if (user.role === 'user' && ticket.user_id !== user.id) {
      res.status(403).json({ error: 'Acesso negado.' });
      return;
    }

    const { title, description, priority, category_id, status } = req.body;

    const newTitle      = title       !== undefined ? title       : ticket.title;
    const newDesc       = description !== undefined ? description : ticket.description;
    const newPriority   = priority    !== undefined ? priority    : ticket.priority;
    const newCategoryId = category_id !== undefined ? category_id : ticket.category_id;

    const validStatuses: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
    const canUpdateStatus = user.role === 'admin' && status && validStatuses.includes(status);
    const newStatus = canUpdateStatus ? status : ticket.status;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE tickets SET title=$1, description=$2, priority=$3, category_id=$4, status=$5, updated_at=NOW()
         WHERE id=$6 RETURNING *`,
        [newTitle, newDesc, newPriority, newCategoryId, newStatus, id]
      );

      if (canUpdateStatus && status !== ticket.status) {
        await client.query(
          `INSERT INTO ticket_status_history (id, ticket_id, old_status, new_status, changed_by)
           VALUES ($1,$2,$3,$4,$5)`,
          [uuidv4(), id, ticket.status, status, user.id]
        );
      }

      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

export async function deleteTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const current = await pool.query('SELECT id, user_id FROM tickets WHERE id=$1', [id]);
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

    const current = await pool.query('SELECT id, status FROM tickets WHERE id=$1', [id]);
    if (current.rows.length === 0) {
      res.status(404).json({ error: 'Chamado não encontrado.' });
      return;
    }

    const oldStatus = current.rows[0].status;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE tickets SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
        [status, id]
      );

      await client.query(
        `INSERT INTO ticket_status_history (id, ticket_id, old_status, new_status, changed_by)
         VALUES ($1,$2,$3,$4,$5)`,
        [uuidv4(), id, oldStatus, status, user.id]
      );

      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}
