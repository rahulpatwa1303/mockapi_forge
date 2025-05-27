import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Ideally, this schema is shared or imported
const mockUpdateSchema = z.object({
  name: z.string().min(1),
  path_template: z.string().min(1).regex(/^\//, "Path must start with /"),
  http_method: z.enum(['GET', 'POST', 'PUT', 'DELETE']), // MVP: 'GET'
  response_structure: z.record(z.any()), // Or z.string() if taking raw JSON string
  is_array: z.boolean().default(false),
  array_count: z.number().int().min(1).default(1),
  status_code: z.number().int().min(100).max(599).default(200)
});


export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mockId = params.id;
  if (!mockId) {
      return NextResponse.json({ error: 'Mock ID is required' }, { status: 400 });
  }
  // Basic UUID validation (more robust validation might be needed)
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(mockId)) {
    return NextResponse.json({ error: 'Invalid Mock ID format' }, { status: 400 });
  }


  try {
    const body = await request.json();
    const parsedData = mockUpdateSchema.parse(body);

    // Normalize path_template
    if (!parsedData.path_template.startsWith('/')) {
        parsedData.path_template = '/' + parsedData.path_template;
    }
    if (parsedData.path_template.length > 1 && parsedData.path_template.endsWith('/')) {
        parsedData.path_template = parsedData.path_template.slice(0, -1);
    }

    const { data: updatedMock, error } = await supabase
      .from('mock_endpoints')
      .update({ 
        ...parsedData, 
        updated_at: new Date().toISOString() // Explicitly set updated_at
      })
      .eq('id', mockId)
      .eq('user_id', user.id) // CRITICAL: Ensure user owns the mock they are updating
      .select()
      .single(); // Expect one row to be updated and returned

    if (error) {
      console.error("Supabase update error:", error);
       if (error.code === 'PGRST116') { // No rows returned from select after update
        return NextResponse.json({ error: 'Mock not found or you do not have permission to update it.' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updatedMock) { // Should be caught by PGRST116, but as a safeguard
        return NextResponse.json({ error: 'Mock not found or update failed silently.' }, { status: 404 });
    }

    return NextResponse.json(updatedMock);

  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: e.errors }, { status: 400 });
    }
    console.error("PUT error:", e);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// You would also implement DELETE here later
export async function DELETE(
    request: NextRequest, // Not strictly needed for DELETE by ID, but good practice for consistency
    { params }: { params: { id: string } }
  ) {
    const supabase = createClient(); // From @/lib/supabase/server
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    const mockId = params.id;
    if (!mockId) {
      return NextResponse.json({ error: 'Mock ID is required' }, { status: 400 });
    }
    // Basic UUID validation
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(mockId)) {
      return NextResponse.json({ error: 'Invalid Mock ID format' }, { status: 400 });
    }
  
    try {
      const { error: deleteError, count } = await supabase
        .from('mock_endpoints')
        .delete({ count: 'exact' }) // Request count of deleted rows
        .eq('id', mockId)
        .eq('user_id', user.id); // CRITICAL: Ensure user owns the mock
  
      if (deleteError) {
        console.error("Supabase delete error:", deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
  
      if (count === 0) {
        return NextResponse.json({ error: 'Mock not found or you do not have permission to delete it.' }, { status: 404 });
      }
  
      return NextResponse.json({ message: 'Mock deleted successfully' }, { status: 200 }); // Or 204 No Content
  
    } catch (e: any) {
      console.error("DELETE error:", e);
      return NextResponse.json({ error: 'Failed to process request', details: e.message }, { status: 500 });
    }
  }