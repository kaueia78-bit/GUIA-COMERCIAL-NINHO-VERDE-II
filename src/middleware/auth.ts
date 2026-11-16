import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getOrCreateUser, getUserRole } from '../db/users.ts';
import { SITE_CONFIG } from '../config/site.ts';

export interface AuthRequest extends Request {
  user?: Partial<DecodedIdToken> & { dbRole?: string; isPasswordAdmin?: boolean };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const adminKeyHeader = req.headers['x-admin-password'];

  // Check admin password header or direct token
  if (adminKeyHeader === SITE_CONFIG.adminPassword) {
    req.user = {
      uid: 'admin_password_user',
      email: SITE_CONFIG.adminEmail,
      name: 'Administrador Ninho Verde II',
      dbRole: 'admin',
      isPasswordAdmin: true,
    };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado: Token não fornecido' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Direct check for admin session token or password
  if (token === SITE_CONFIG.adminPassword || token.startsWith('admin_session_Kd523107')) {
    req.user = {
      uid: 'admin_password_user',
      email: SITE_CONFIG.adminEmail,
      name: 'Administrador Ninho Verde II',
      dbRole: 'admin',
      isPasswordAdmin: true,
    };
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    // Sync with Postgres and retrieve role
    const dbUser = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || '',
      decodedToken.name
    );

    req.user = {
      ...decodedToken,
      dbRole: dbUser.role,
    };
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Não autorizado: Token inválido ou expirado' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, async () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    if (req.user.isPasswordAdmin || req.user.dbRole === 'admin') {
      return next();
    }

    if (req.user.uid) {
      const role = await getUserRole(req.user.uid);
      if (role === 'admin') {
        return next();
      }
    }

    return res.status(403).json({ error: 'Acesso negado: Requer privilégios de administrador' });
  });
};
