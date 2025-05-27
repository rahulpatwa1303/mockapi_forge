// app/dashboard/page.tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FiPlusCircle, FiGitBranch } from 'react-icons/fi'; // Changed icon for empty state
import MockCardActions from '@/components/MockCardActions';
import BaseUrlDisplay from '@/components/BaseUrlDisplay';

type MockEndpoint = {
    id: string;
    name: string;
    path_template: string;
    http_method: string;
    status_code: number;
    created_at: string;
    is_array: boolean;
    array_count: number;
};

async function getMocks(supabase: any, userId: string): Promise<MockEndpoint[]> {
    const { data, error } = await supabase
        .from('mock_endpoints')
        .select('id, name, path_template, http_method, status_code, created_at, is_array, array_count')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching mocks:', error);
        return [];
    }
    return data || [];
}

async function getApiPrefix(supabase: any, userId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('api_route_prefix')
        .eq('id', userId)
        .single();

    if (error || !data) {
        console.error('Error fetching API prefix for user', userId, 'Error:', error, 'Data:', data);
        return null;
    }
    return data.api_route_prefix;
}

const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
        case 'GET': return 'badge-success';
        case 'POST': return 'badge-info'; // Or badge-primary
        case 'PUT': return 'badge-warning';
        case 'DELETE': return 'badge-error';
        default: return 'badge-ghost'; // Neutral for others
    }
};

export default async function DashboardPage() {
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const mocks = await getMocks(supabase, user.id);
    const apiPrefix = await getApiPrefix(supabase, user.id);
    const baseMockUrl = apiPrefix ? `${appBaseUrl}/api/v1/mock/${apiPrefix}` : null;

    return (
        // The main 'div' here doesn't need background/text colors if layout.tsx's <body> has them.
        // Padding is good for content spacing.
        <div className="space-y-8"> {/* Replaced p-4/md:p-8 with space-y for consistent vertical spacing between sections */}
            <header className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 md:pt-0"> {/* Added pt for spacing if navbar is sticky */}
                <h1 className="text-3xl font-bold text-primary">Your Mock Endpoints</h1>
                <Link href="/mocks/new" className="btn btn-primary btn-md shadow-lg">
                    <FiPlusCircle className="text-xl mr-2" /> Create New Mock
                </Link>
            </header>

            {apiPrefix && baseMockUrl ? (
                <BaseUrlDisplay baseUrl={baseMockUrl} />
            ) : (
                <div role="alert" className="alert alert-error shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                        <h3 className="font-bold">API Prefix Error!</h3>
                        <div className="text-xs">Could not retrieve API prefix. Please try re-logging or contact support.</div>
                    </div>
                </div>
            )}

            {mocks.length === 0 ? (
                <div className="text-center py-16 card bg-base-200 shadow-xl"> {/* Increased py for more prominence */}
                    <div className="card-body items-center">
                        <FiGitBranch className="h-20 w-20 text-base-content opacity-20 mb-4" /> {/* Changed icon */}
                        <h3 className="mt-2 text-2xl font-semibold">No Mocks Yet!</h3>
                        <p className="text-base-content opacity-70 max-w-md mx-auto mt-2">
                            It looks a bit empty here. Let's forge your first mock API endpoint and bring your tests to life.
                        </p>
                        <div className="card-actions justify-center mt-8">
                            <Link href="/mocks/new" className="btn btn-primary btn-lg"> {/* Larger button */}
                                <FiPlusCircle className="mr-2 text-lg" />
                                Create Your First Mock
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {mocks.map((mock) => {
                        const fullMockUrl = baseMockUrl
                            ? `${baseMockUrl}${mock.path_template.startsWith('/') ? mock.path_template : '/' + mock.path_template}`
                            : '#'; 

                        return (
                            <div key={mock.id} className="card bg-base-200 shadow-xl hover:shadow-primary/30 transition-shadow duration-300 flex flex-col h-full"> {/* Added h-full for consistent card height in grid */}
                                <div className="card-body flex-grow flex flex-col justify-between"> {/* Flex column to push actions to bottom */}
                                    <div> {/* Content group */}
                                        <div className="flex justify-between items-center mb-3">
                                            <h2 className="card-title text-lg lg:text-xl !mb-0 truncate text-primary" title={mock.name}>
                                                {mock.name}
                                            </h2>
                                            <div className={`badge ${getMethodBadgeClass(mock.http_method)} badge-outline font-semibold`}>
                                                {mock.http_method}
                                            </div>
                                        </div>

                                        <div className="tooltip tooltip-bottom w-full mb-3" data-tip="Path Template">
                                            <p className="font-mono text-sm bg-base-300 p-3 rounded break-all text-accent-content/30 truncate">
                                                {mock.path_template}
                                            </p>
                                        </div>
                                        

                                        <div className="space-y-1 text-xs opacity-80 mb-4">
                                            <div>
                                                Status: <span className="font-semibold opacity-100 text-base-content">{mock.status_code}</span>
                                            </div>
                                            {mock.is_array && (
                                                <div>
                                                Returns: <span className="font-semibold opacity-100 text-base-content">{mock.array_count} item{mock.array_count === 1 ? '' : 's'}</span>
                                                </div>
                                            )}
                                            <div>
                                                Created: <span className="font-semibold opacity-100 text-base-content">{new Date(mock.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions are now in a separate component, pass necessary props */}
                                    <div className="mt-auto pt-4 border-t border-base-300"> {/* mt-auto pushes to bottom */}
                                      {baseMockUrl ? (
                                        <MockCardActions mock={mock} fullMockUrl={fullMockUrl} />
                                      ) : (
                                        <p className="text-xs text-error text-center">Actions unavailable: Base URL missing.</p>
                                      )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}