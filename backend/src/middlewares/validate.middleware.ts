import { Request, Response, NextFunction } from 'express';

export function validateFields(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing: string[] = [];
    for (const field of fields) {
      const value = req.body[field];
      if (value === undefined || value === null || value === '') {
        missing.push(field);
      }
    }
    if (missing.length > 0) {
      res.status(400).json({ error: `Campos obrigatórios faltando: ${missing.join(', ')}` });
      return;
    }
    next();
  };
}
