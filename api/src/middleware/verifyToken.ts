import { HttpRequest, InvocationContext } from '@azure/functions';
import * as jwt from 'jsonwebtoken';
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
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (!authHeader) {
      context.warn('verifyToken: Authorization header not found');
      return null;
    }
 
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      context.warn('verifyToken: Authorization header format is invalid (must be Bearer <token>)');
      return null;
    }

    const token = parts[1];
    if (!token) {
      context.warn('verifyToken: Token is empty');
      return null;
    }
 
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-me';
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err: any) {
      context.error(`verifyToken: JWT verification failed: ${err.message || err}`);
      return null;
    }

    if (!decoded || (!decoded.userId && !decoded.id)) {
      context.warn('verifyToken: Decoded token payload is missing userId/id claim');
      return null;
    }

    // Handle both userId and id claim names just in case
    const rawUserId = decoded.userId || decoded.id;
    const userId = typeof rawUserId === 'string' ? parseInt(rawUserId, 10) : rawUserId;
    const email = decoded.email || '';
    const role = decoded.role || 'viewer';

    if (isNaN(userId)) {
      context.error(`verifyToken: Invalid userId format: ${rawUserId}`);
      return null;
    }
 
    // Verify user still exists and is active
    let user = await getUserById(userId);
    
    // Auto-reconstruct user in mock mode to survive serverless container recycles
    if (!user && getPool().mock) {
      context.log(`Auto-reconstructing user ${email} from token claims`);
      user = {
        id: userId,
        email: email,
        role: role,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
    }
 
    if (!user) {
      context.warn(`verifyToken: User ${userId} (${email}) not found in database and cannot be reconstructed.`);
      return null;
    }
 
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  } catch (error: any) {
    context.error('verifyToken: Unexpected verification error:', error.message || error);
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
