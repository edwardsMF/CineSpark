import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Requiere rol admin' });
  return next();
}

export function requireSelfOrAdmin(paramKey = 'userId') {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    const paramVal = String(req.params[paramKey] || '');
    const isSelf = String(req.user.sub) === paramVal;
    if (req.user.role === 'admin' || isSelf) return next();
    return res.status(403).json({ error: 'Prohibido' });
  };
}

