import { HttpRequest, InvocationContext } from '@azure/functions';
import jwt from 'jsonwebtoken';
import { getUserById } from '../db/users';
import { getPool } from '../db/pool';
 
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
    let user = await getUserById(decoded.userId);
    
    // Auto-reconstruct user in mock mode to survive serverless container recycles
    if (!user && getPool().mock) {
      context.log(`Auto-reconstructing user ${decoded.email} from token claims`);
      user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
    }
 
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
