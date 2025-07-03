import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

interface TokenPayload {
  sub: string;
  role: string;
}

export function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  // Validar token JWT
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new Error('JWT token is missing');
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = verify(token, process.env.JWT_SECRET || '') as TokenPayload;

    request.user = {
      id: decoded.sub,
      role: decoded.role
    };

    return next();
  } catch {
    throw new Error('Invalid JWT token');
  }
} 