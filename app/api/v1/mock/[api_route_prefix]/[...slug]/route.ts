import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // Use direct client for this public endpoint
import { generateMockData } from '@/lib/dataGenerator'; // Adjust path
import { pathToRegexp, match } from 'path-to-regexp'; // For path matching

// Initialize Supabase client without auth context as this is a public endpoint
// Use anon key for read-only access. RLS for mock_endpoints needs to allow read based on api_route_prefix.
// This is tricky. The current RLS is auth.uid() based.
// We need a way to query mocks based on api_route_prefix publicly.
// OPTION 1: Modify RLS to allow reads for a specific function/role (complex).
// OPTION 2: Create a Supabase Edge Function that uses service_role to bypass RLS for this specific lookup (more secure).
// OPTION 3 (Simpler for MVP but less secure if not careful): Query using service_role key directly here.
//          Ensure queries are VERY specific to avoid leaking data.
// For MVP, let's assume we create a read-only postgres function that can be called by anon.

// Let's simplify:
// 1. Fetch `user_id` based on `api_route_prefix` from `profiles` (profiles RLS must allow anon read of api_route_prefix only, or use service key)
// 2. Fetch `mock_endpoints` using that `user_id` (mock_endpoints RLS must allow this specific kind of lookup if not using service key).

// Easiest for now: use service_role key for this specific route. CAUTION ADVISED.
// Store SUPABASE_SERVICE_ROLE_KEY in .env.local and server environment variables.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // DANGER: Use with extreme caution
);

// Define types from DB schema (can be auto-generated with Supabase CLI later)
type DbMockEndpoint = {
  id: string;
  user_id: string;
  path_template: string;
  http_method: string;
  response_structure: any; // JSONB
  is_array: boolean;
  array_count: number;
  status_code: number;
};


async function findMatchingMock(
  apiRoutePrefix: string,
  requestedMethod: string,
  requestedSlugParts: string[] // e.g., ['cats', 'facts'] or ['standalone-endpoint']
): Promise<DbMockEndpoint | null> { // DbMockEndpoint should now include project_id
  // 1. Get user_id for the api_route_prefix
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('api_route_prefix', apiRoutePrefix)
    .single();

  if (profileError || !profile) {
    console.error('Profile not found for prefix:', apiRoutePrefix, profileError);
    return null;
  }
  const userId = profile.id;

  // 2. Get all mocks and their project base_paths for this user
  const { data: userMocksAndProjects, error: mocksError } = await supabaseAdmin
    .from('mock_endpoints')
    .select(`
          *,
          projects ( base_path )
      `) // Fetch associated project's base_path
    .eq('user_id', userId)
    .eq('http_method', requestedMethod.toUpperCase());

  if (mocksError || !userMocksAndProjects) {
    console.error('Error fetching mocks/projects for user:', userId, mocksError);
    return null;
  }

  // 3. Find the best match
  for (const mock of userMocksAndProjects as (DbMockEndpoint & { projects: { base_path: string | null } | null })[]) {
    let fullPathTemplate: string;
    const projectBasePath = mock.projects?.base_path;

    if (projectBasePath) {
      // Normalize projectBasePath (ensure leading slash, no trailing)
      const normProjPath = projectBasePath.startsWith('/') ? projectBasePath : `/${projectBasePath}`;
      const cleanProjPath = normProjPath.length > 1 && normProjPath.endsWith('/') ? normProjPath.slice(0, -1) : normProjPath;

      // Normalize mock.path_template (ensure leading slash, no trailing)
      const normMockPath = mock.path_template.startsWith('/') ? mock.path_template : `/${mock.path_template}`;
      const cleanMockPath = normMockPath.length > 1 && normMockPath.endsWith('/') ? normMockPath.slice(0, -1) : normMockPath;

      // Handle case where mock path might be just "/" for the project root
      if (cleanMockPath === '/') {
        fullPathTemplate = cleanProjPath;
      } else {
        fullPathTemplate = `${cleanProjPath}${cleanMockPath}`;
      }
    } else {
      // Standalone mock
      const normMockPath = mock.path_template.startsWith('/') ? mock.path_template : `/${mock.path_template}`;
      fullPathTemplate = normMockPath.length > 1 && normMockPath.endsWith('/') ? normMockPath.slice(0, -1) : normMockPath;

    }

    // Normalize requestedPath from slugParts
    const requestedPath = `/${requestedSlugParts.join('/')}`;
    let normalizedReqPath = requestedPath;
    if (normalizedReqPath.length > 1 && normalizedReqPath.endsWith('/')) {
      normalizedReqPath = normalizedReqPath.slice(0, -1);
    }
    if (normalizedReqPath === "") normalizedReqPath = "/"; // if slug was empty


    const matcher = match(fullPathTemplate, { decode: decodeURIComponent });
    const result = matcher(normalizedReqPath);

    if (result) {
      // TODO: Pass result.params to data generator
      return mock;
    }
  }
  return null; // No match found
}

// --- CORS Helper ---
function getCorsHeaders(origin?: string | null) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin || '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  // ADD 'X-Custom-Header' to this list
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Apikey, X-CSRF-Token, X-Custom-Header');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

// --- OPTIONS Handler for Preflight Requests ---
export async function OPTIONS(request: NextRequest) {
  const requestOrigin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(requestOrigin);
  return new NextResponse(null, { status: 204, headers: corsHeaders }); // 204 No Content for OPTIONS
}


// --- HTTP Method Handlers ---
export async function GET(
  request: NextRequest,
  context: { params: { api_route_prefix: string; slug: string[] } } // Use context as the second arg name
) {
  return handleRequest(request, context.params); // Pass context.params
}

export async function POST(
  request: NextRequest,
  context: { params: { api_route_prefix: string; slug: string[] } }
) {
  return handleRequest(request, context.params);
}

export async function PUT(
  request: NextRequest,
  context: { params: { api_route_prefix: string; slug: string[] } }
) {
  return handleRequest(request, context.params);
}

export async function DELETE(
  request: NextRequest,
  context: { params: { api_route_prefix: string; slug: string[] } }
) {
  return handleRequest(request, context.params);
}


// --- Main Request Handler (modified) ---
async function handleRequest(
  request: NextRequest,
  paramsFromContext: { api_route_prefix: string; slug: string[] } // Renamed to avoid conflict
) {
  const { api_route_prefix, slug } = paramsFromContext; // Destructure here
  const requestedSlugParts = slug || [];
  const requestedMethod = request.method;
  const requestOrigin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(requestOrigin);

  try {
    const mockDefinition = await findMatchingMock(api_route_prefix, requestedMethod, requestedSlugParts);

    if (mockDefinition) {
      const data = generateMockData(
        mockDefinition.response_structure,
        mockDefinition.is_array,
        mockDefinition.array_count
      );
      // Merge CORS headers with existing headers if any from NextResponse.json
      const responseHeaders = new Headers(corsHeaders); // Start with CORS headers
      responseHeaders.set('Content-Type', 'application/json'); // Ensure content type

      return new NextResponse(JSON.stringify(data), {
        status: mockDefinition.status_code,
        headers: responseHeaders,
      });
    } else {
      return new NextResponse(JSON.stringify({ error: 'Mock definition not found for this path and method.' }), {
        status: 404,
        headers: corsHeaders, // Also add CORS headers to error responses
      });
    }
  } catch (error: any) {
    console.error("Error serving mock:", error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: corsHeaders, // And here
    });
  }
}