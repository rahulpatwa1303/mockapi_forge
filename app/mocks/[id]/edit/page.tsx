// app/mocks/[id]/edit/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditMockForm from './EditMockForm'; // Ensure this path is correct
import Link from 'next/link';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';

// Define the type for a single mock endpoint from DB (can be shared)
export type MockEndpointDbData = { // Export if EditMockForm needs it from here, or define in shared types
  id: string;
  name: string;
  path_template: string;
  http_method: string;
  response_structure: any; // This is JSONB from DB
  is_array: boolean;
  array_count: number;
  status_code: number;
};

async function getMockById(supabase: any, mockId: string, userId: string): Promise<MockEndpointDbData | null> {
  const { data, error } = await supabase
    .from('mock_endpoints')
    .select('*')
    .eq('id', mockId)
    .eq('user_id', userId)
    .single();

  if (error) {
    // Log more specific PostgREST errors if available
    if (error.code === 'PGRST116') { // Not found or no permission due to .single()
        console.warn(`Mock with ID ${mockId} for user ${userId} not found or no permission. Error: ${error.message}`);
    } else {
        console.error(`Error fetching mock with id ${mockId}:`, error);
    }
    return null;
  }
  return data;
}

export default async function EditMockPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const mockId = params.id;
  const mockData = await getMockById(supabase, mockId, user.id);

  if (!mockData) {
    // More user-friendly "Not Found" display instead of just redirecting blindly
    return (
        <div className="flex flex-col items-center justify-center pt-12 pb-12 px-4 min-h-[calc(100vh-var(--navbar-height,4rem))]">
            <div className="card w-full max-w-lg bg-base-200 shadow-xl">
                <div className="card-body items-center text-center">
                    <FiAlertTriangle className="text-error text-6xl mb-4" />
                    <h2 className="card-title text-2xl">Mock Not Found</h2>
                    <p className="opacity-70">
                        The mock endpoint you are trying to edit could not be found, or you do not have permission to access it.
                    </p>
                    <div className="card-actions justify-center mt-6">
                        <Link href="/dashboard" className="btn btn-primary">
                            <FiArrowLeft className="mr-2" /> Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    // This div should use theme colors from layout's <body>
    // It centers the EditMockForm card
    <div className="flex flex-col items-center justify-start pt-8 pb-12 px-4 min-h-[calc(100vh-var(--navbar-height,4rem))]">
      <EditMockForm mockData={mockData} />
    </div>
  );
}