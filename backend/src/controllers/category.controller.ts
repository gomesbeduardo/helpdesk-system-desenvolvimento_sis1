import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';

export async function getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE id=$1', [req.params['id']]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Categoria não encontrada.' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, description } = req.body;
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO categories (id, name, description) VALUES ($1,$2,$3) RETURNING *',
      [id, name, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await pool.query(
      'UPDATE categories SET name=$1, description=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
      [name, description || null, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Categoria não encontrada.' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await pool.query('DELETE FROM categories WHERE id=$1 RETURNING id', [req.params['id']]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Categoria não encontrada.' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
