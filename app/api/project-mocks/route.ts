import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // server-side
import { z } from 'zod';

const mockSchema = z.object({
  name: z.string().min(1),
  path_template: z.string().min(1).regex(/^\//, "Path must start with /"),
  http_method: z.enum(['GET', 'POST', 'PUT', 'DELETE']), // MVP: 'GET'
  response_structure: z.record(z.any()), // Or z.string() if taking raw JSON string
  is_array: z.boolean().default(false),
  array_count: z.number().int().min(1).default(1),
  status_code: z.number().int().min(100).max(599).default(200)
});

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: mocks, error } = await supabase
    .from('mock_endpoints')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(mocks);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsedData = mockSchema.parse(body);

    // Ensure path_template starts with a / if not already
    if (!parsedData.path_template.startsWith('/')) {
        parsedData.path_template = '/' + parsedData.path_template;
    }
    // Remove trailing slash if any, unless it's the root path "/"
    if (parsedData.path_template.length > 1 && parsedData.path_template.endsWith('/')) {
        parsedData.path_template = parsedData.path_template.slice(0, -1);
    }


    const { data: newMock, error } = await supabase
      .from('mock_endpoints')
      .insert({ ...parsedData, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      if (error.code === '23505') { // unique constraint violation
        return NextResponse.json({ error: 'A mock with this path and method might already exist or another unique constraint failed.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(newMock, { status: 201 });

  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: e.errors }, { status: 400 });
    }
    console.error("POST error:", e);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}