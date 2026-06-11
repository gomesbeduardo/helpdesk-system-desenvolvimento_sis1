/**
 * Middlewares de autenticação e autorização por perfil.
 *
 * authenticate — verifica o token JWT no cabeçalho Authorization e popula req.user.
 * authorize    — fábrica de middleware que restringe o acesso a perfis específicos.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload, UserRole } from '../types';

/**
 * Valida o token JWT enviado no cabeçalho `Authorization: Bearer <token>`.
 * Em caso de sucesso, popula `req.user` com o payload decodificado.
 * Retorna 401 se o token estiver ausente, inválido ou expirado.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  // O padrão Bearer separa "Bearer" do token com um espaço; pegamos a segunda parte
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Token não fornecido.' });
    return;
  }

  try {
    const secret = process.env['JWT_SECRET'] as string;
    const payload = jwt.verify(token, secret) as JwtPayload;

    // Anexa o payload ao objeto da requisição para uso nos controllers
    req.user = payload;
    next();
  } catch {
    // jwt.verify lança JsonWebTokenError, TokenExpiredError ou NotBeforeError
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

/**
 * Cria um middleware que permite o acesso apenas aos perfis informados.
 * Deve ser usado APÓS `authenticate`, pois depende de `req.user` estar populado.
 *
 * @param roles - Um ou mais perfis que têm permissão para acessar a rota.
 *
 * @example
 * router.delete('/:id', authenticate, authorize('admin'), deleteUser);
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado. Perfil insuficiente.' });
      return;
    }
    next();
  };
}
