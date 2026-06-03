import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail } from '../../db/users';
import { logAudit, extractRequestInfo } from '../../services/audit';

interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

interface RegisterResponse {
  success: boolean;
  message?: string;
  data?: {
    userId: number;
    email: string;
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
        jsonBody: { success: false, error: 'Method not allowed' } as RegisterResponse,
      };
    }

    const body = (await request.json()) as RegisterRequest;

    // Validate input
    if (!body.email || !body.password) {
      await logAudit({
        action: 'register_failed',
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
        } as RegisterResponse,
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      await logAudit({
        action: 'register_failed',
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
          error: 'Invalid email format',
        } as RegisterResponse,
      };
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(body.email);
    if (existingUser) {
      await logAudit({
        action: 'register_failed',
        endpoint: requestInfo.endpoint,
        method: requestInfo.method,
        statusCode: 409,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        responseTimeMs: Date.now() - startTime,
      });

      return {
        status: 409,
        jsonBody: {
          success: false,
          error: 'Email already registered',
        } as RegisterResponse,
      };
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(body.password, 10);

    // Create user
    const user = await createUser(
      body.email,
      hashedPassword,
      body.full_name,
      'viewer'
    );

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
      action: 'register_success',
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      statusCode: 201,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      responseTimeMs: Date.now() - startTime,
    });

    return {
      status: 201,
      jsonBody: {
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          token,
        },
      } as RegisterResponse,
    };
  } catch (error) {
    context.error('Register error:', error);

    await logAudit({
      action: 'register_error',
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
        error: 'Internal server error',
      } as RegisterResponse,
    };
  }
}

app.http('register', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/register',
  handler,
});
