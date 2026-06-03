import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import * as bcryptjs from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { getUserByEmail, createUser } from '../../db/users';
import { getPool } from '../../db/pool';
import { logAudit, extractRequestInfo } from '../../services/audit';
 
interface LoginRequest {
  email: string;
  password: string;
}
 
interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    userId: number;
    email: string;
    role: string;
    token: string;
  };
  error?: string;
}
 
async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
 
  try {
    if (request.method !== 'POST') {
      return {
        status: 405,
        jsonBody: { success: false, error: 'Method not allowed' } as LoginResponse,
      };
    }
 
    const body = (await request.json()) as LoginRequest;
 
    // Validate input
    if (!body.email || !body.password) {
      await logAudit({
        action: 'login_failed',
        endpoint: requestInfo.endpoint,
        method: requestInfo.method,
        statusCode: 400,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        responseTimeMs: Date.now() - startTime,
      });
 
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Email and password are required',
        } as LoginResponse,
      };
    }
 
    // Get user by email
    let user = await getUserByEmail(body.email);
    
    // Auto-create user on login in mock mode to survive container restarts
    if (!user && getPool().mock) {
      context.log(`Auto-creating user ${body.email} in mock database to survive container recycle.`);
      const hashedPassword = await bcryptjs.hash(body.password, 10);
      user = await createUser(body.email, hashedPassword, body.email.split('@')[0], 'viewer');
    }

    if (!user) {
      await logAudit({
        action: 'login_failed',
        endpoint: requestInfo.endpoint,
        method: requestInfo.method,
        statusCode: 401,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        responseTimeMs: Date.now() - startTime,
      });

      return {
        status: 401,
        jsonBody: {
          success: false,
          error: 'Invalid email or password',
        } as LoginResponse,
      };
    }

    // Compare password
    const isValidPassword = await bcryptjs.compare(
      body.password,
      user.password_hash!
    );

    if (!isValidPassword) {
      await logAudit({
        userId: user.id,
        action: 'login_failed',
        endpoint: requestInfo.endpoint,
        method: requestInfo.method,
        statusCode: 401,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        responseTimeMs: Date.now() - startTime,
      });

      return {
        status: 401,
        jsonBody: {
          success: false,
          error: 'Invalid email or password',
        } as LoginResponse,
      };
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-me';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    await logAudit({
      userId: user.id,
      action: 'login_success',
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      statusCode: 200,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      responseTimeMs: Date.now() - startTime,
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          role: user.role,
          token,
        },
      } as LoginResponse,
    };
  } catch (error: any) {
    context.error('Login error:', error);

    await logAudit({
      action: 'login_error',
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      statusCode: 500,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      responseTimeMs: Date.now() - startTime,
    });

    return {
      status: 500,
      jsonBody: {
        success: false,
        error: `Internal server error: ${error.message || error}`,
        stack: error.stack,
      } as any,
    };
  }
}

app.http('login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler,
});
