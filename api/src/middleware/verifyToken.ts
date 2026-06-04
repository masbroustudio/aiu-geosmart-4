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
      throw new Error('Authorization header not found');
    }
 
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      throw new Error('Authorization header format is invalid (must be Bearer <token>)');
    }

    const token = parts[1];
    if (!token) {
      throw new Error('Token is empty');
    }
 
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-me';
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err: any) {
      const hint = `${jwtSecret.substring(0, 3)}...${jwtSecret.slice(-3)}`;
      const tokSnippet = `${token.substring(0, 10)}...${token.slice(-10)} (len: ${token.length})`;
      throw new Error(`JWT verification failed: ${err.message || err} (secret: ${hint}) (token: ${tokSnippet})`);
    }

    if (!decoded || (!decoded.userId && !decoded.id)) {
      throw new Error('Decoded token payload is missing userId/id claim');
    }

    // Handle both userId and id claim names just in case
    const rawUserId = decoded.userId || decoded.id;
    const userId = typeof rawUserId === 'string' ? parseInt(rawUserId, 10) : rawUserId;
    const email = decoded.email || '';
    const role = decoded.role || 'viewer';

    if (isNaN(userId)) {
      throw new Error(`Invalid userId format in token: ${rawUserId}`);
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
      throw new Error(`User ${userId} (${email}) not found in database and cannot be reconstructed.`);
    }
 
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  } catch (error: any) {
    context.error('verifyToken error:', error.message || error);
    throw error;
  }
};
 
export const requireAuth = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<AuthContext> => {
  try {
    const auth = await verifyToken(request, context);
    if (!auth) {
      throw new Error('Unauthorized');
    }
    return auth;
  } catch (err: any) {
    throw new Error(`Unauthorized: ${err.message || err}`);
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (auth: AuthContext): boolean => {
    return allowedRoles.includes(auth.role);
  };
};
