import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';

export interface AuthUser { id: string; role: 'PATIENT' | 'FACILITY' | 'ADMIN'; facilityId?: string | null }
declare global { namespace Express { interface Request { user?: AuthUser } } }

export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
const secret = () => { const s = process.env.JWT_SECRET; if (!s) throw new Error('JWT_SECRET is not set'); return s; };

export const signToken = (u: AuthUser) => jwt.sign(u, secret(), { expiresIn: '8h' });

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) {
    try { req.user = jwt.verify(h.slice(7), secret()) as AuthUser; } catch { /* treated as anonymous */ }
  }
  next();
}
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  optionalAuth(req, _res, () => (req.user ? next() : next(new HttpError(401, 'Please log in to continue. Your session may have expired.'))));
}
export const requireRole = (...roles: AuthUser['role'][]) => (req: Request, _res: Response, next: NextFunction) =>
  requireAuth(req, _res, (err?: unknown) => err ? next(err) : roles.includes(req.user!.role) ? next() : next(new HttpError(403, 'You do not have permission to do this.')));

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) return res.status(400).json({ error: 'Invalid input', details: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  console.error(err instanceof Error ? err.message : err); // no stack traces to clients
  res.status(500).json({ error: 'Something went wrong. Please try again, or call emergency services directly.' });
}
