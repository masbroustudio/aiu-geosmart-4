import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/verifyToken';
import { logAudit, extractRequestInfo } from '../../services/audit';
import { scoreLocation, getLocationsByKabupaten, initializeMlService } from '../../services/ml';

interface LocationScoringRequest {
  kecamatan?: string;
  kabupaten_kota?: string;
  latitude?: number;
  longitude?: number;
}

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    // Require authentication
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    // Initialize ML service
    initializeMlService();

    // Parse request
    let body: LocationScoringRequest = {};
    if (request.method === 'POST') {
      body = (await request.json()) as LocationScoringRequest;
    } else {
      // GET request - get params from query string
      const kecamatan = request.query.get('kecamatan');
      const kabupaten = request.query.get('kabupaten_kota');
      body.kecamatan = kecamatan || undefined;
      body.kabupaten_kota = kabupaten || undefined;
    }

    // Validate required fields
    if (!body.kecamatan && !body.kabupaten_kota) {
      await logAudit({
        userId,
        action: 'location_score_validation_error',
        endpoint: requestInfo.endpoint,
        method: requestInfo.method,
        statusCode: 400,
        responseTimeMs: Date.now() - startTime,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
      });

      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Missing required field: kecamatan or kabupaten_kota',
        },
      };
    }

    // If only kabupaten is provided, return all locations in that kabupaten
    if (body.kabupaten_kota && !body.kecamatan) {
      const locations = getLocationsByKabupaten(body.kabupaten_kota);

      if (!locations || locations.length === 0) {
        await logAudit({
          userId,
          action: 'location_score_not_found',
          endpoint: requestInfo.endpoint,
          method: requestInfo.method,
          statusCode: 404,
          responseTimeMs: Date.now() - startTime,
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent,
        });

        return {
          status: 404,
          jsonBody: {
            success: false,
            error: `No locations found for kabupaten: ${body.kabupaten_kota}`,
          },
        };
      }

      await logAudit({
        userId,
        action: 'location_score_list_viewed',
        endpoint: requestInfo.endpoint,
        method: requestInfo.method,
        statusCode: 200,
        responseTimeMs: Date.now() - startTime,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
      });

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: locations,
          metadata: {
            user_id: userId,
            scored_at: new Date().toISOString(),
            processing_time_ms: Date.now() - startTime,
            total_locations: locations.length,
          },
        },
      };
    }

    // Single location scoring
    const scoreResult = scoreLocation(body.kecamatan || '', body.kabupaten_kota);

    if (!scoreResult) {
      await logAudit({
        userId,
        action: 'location_score_not_found',
        endpoint: requestInfo.endpoint,
        method: requestInfo.method,
        statusCode: 404,
        responseTimeMs: Date.now() - startTime,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
      });

      return {
        status: 404,
        jsonBody: {
          success: false,
          error: `Location not found: ${body.kecamatan}`,
        },
      };
    }

    await logAudit({
      userId,
      action: 'location_score_generated',
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      statusCode: 200,
      responseTimeMs: Date.now() - startTime,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: scoreResult,
        metadata: {
          user_id: userId,
          scored_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message.startsWith('Unauthorized');
    const statusCode = isAuthError ? 401 : 500;

    context.error('Error in locationScore handler:', error);

    await logAudit({
      userId,
      action: isAuthError ? 'location_score_unauthorized' : 'location_score_error',
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      statusCode,
      responseTimeMs: Date.now() - startTime,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
    });

    return {
      status: statusCode,
      jsonBody: {
        success: false,
        error: isAuthError ? 'Unauthorized: Valid token required' : 'Internal server error',
      },
    };
  }
}

app.http('locationScore', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'scoring/location',
  handler,
});
