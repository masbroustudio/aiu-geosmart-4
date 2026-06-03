import { HttpRequest, InvocationContext } from '@azure/functions';
import jwt from 'jsonwebtoken';
import { getUserById } from '../db/users';

export interface AuthContext {
  userId: number;
  email: string;
  role: string;
}

export const verifyToken = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<AuthContext | null> => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-me';
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: number;
      email: string;
      role: string;
    };

    // Verify user still exists and is active
    const user = await getUserById(decoded.userId);
    if (!user) {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    context.debug('Token verification failed:', error);
    return null;
  }
};

export const requireAuth = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<AuthContext> => {
  const auth = await verifyToken(request, context);
  if (!auth) {
    throw new Error('Unauthorized');
  }
  return auth;
};

export const requireRole = (allowedRoles: string[]) => {
  return (auth: AuthContext): boolean => {
    return allowedRoles.includes(auth.role);
  };
};
