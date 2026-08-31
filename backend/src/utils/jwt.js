import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES = '7d';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
