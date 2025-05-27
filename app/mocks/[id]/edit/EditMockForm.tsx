// app/mocks/[id]/edit/EditMockForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import Link from 'next/link';
import { FiSave, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import type { MockEndpointDbData } from './page'; // Import the type from the server component page

// Zod schema (ideally from a shared types/schemas file)
// Added max lengths for robustness
const mockFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long (max 100 chars)"),
  path_template: z.string().min(1, "Path is required")
    .regex(/^\/[a-zA-Z0-9_:\-\/]*$/, "Path must start with / and can contain letters, numbers, and :, _, -, /")
    .max(200, "Path too long (max 200 chars)"),
  http_method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  response_structure_string: z.string().min(1, "Response structure is required").refine(val => {
    try { JSON.parse(val); return true; } catch { return false; }
  }, "Must be valid JSON"),
  is_array: z.boolean(),
  array_count: z.number().int().min(1).max(100, "Array count must be between 1 and 100"),
  status_code: z.number().int().min(100,"Status must be >= 100").max(599, "Status must be <= 599")
});

type MockFormData = z.infer<typeof mockFormSchema>;

interface EditMockFormProps {
  mockData: MockEndpointDbData;
}

export default function EditMockForm({ mockData }: EditMockFormProps) {
  const router = useRouter();
  // Initialize with empty strings or defaults to avoid controlled/uncontrolled input warnings
  const [formData, setFormData] = useState<Partial<MockFormData>>({
    name: '',
    path_template: '/',
    http_method: 'GET',
    response_structure_string: '{}',
    is_array: false,
    array_count: 1,
    status_code: 200,
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mockData) {
      setFormData({
        name: mockData.name,
        path_template: mockData.path_template,
        http_method: mockData.http_method as 'GET' | 'POST' | 'PUT' | 'DELETE',
        response_structure_string: JSON.stringify(mockData.response_structure, null, 2),
        is_array: mockData.is_array,
        array_count: mockData.array_count,
        status_code: mockData.status_code,
      });
    }
  }, [mockData]); // Dependency array is correct

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;

    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      if (value === '') {
        // For numbers, if input is cleared, decide what to store.
        // Storing it as is, Zod will validate. Or use undefined.
        // Or, for better UX, you might want to keep the number type for formData.
        // For this example, let Zod handle it from the string if `value` is `''` during coercion.
      } else {
        processedValue = parseInt(value, 10);
         if (isNaN(processedValue)) processedValue = name === 'array_count' ? 1 : 200;
      }
      if (name === "array_count" && typeof processedValue === 'number' && processedValue < 1) processedValue = 1;
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (errors[name]) {
        setErrors((prevErrors) => ({...prevErrors, [name]: undefined}));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);
    setIsLoading(true);

    const dataToParse = {
        ...formData,
        array_count: Number(formData.array_count) || 1,
        status_code: Number(formData.status_code) || 200,
    };

    const result = mockFormSchema.safeParse(dataToParse);
    if (!result.success) {
      const fieldErrors: Record<string, string | undefined> = {};
      result.error.errors.forEach(err => {
        if (err.path.length > 0) fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const responseStructure = JSON.parse(result.data.response_structure_string);
      const payload = { ...result.data, response_structure: responseStructure };
      // @ts-ignore
      delete payload.response_structure_string;

      const res = await fetch(`/api/project-mocks/${mockData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setApiError(errorData.error || `Error: ${res.status} - ${res.statusText}`);
        if (errorData.details && Array.isArray(errorData.details)) {
            const backendErrors: Record<string, string | undefined> = {};
            errorData.details.forEach((detail: any) => {
                if(detail.path && detail.path.length > 0) backendErrors[detail.path[0]] = detail.message;
            });
            setErrors(prev => ({...prev, ...backendErrors}));
        }
        throw new Error(errorData.error || `Error: ${res.status}`);
      }
      router.push('/dashboard?success=mock_updated');
      router.refresh();
    } catch (err: any) {
      if (!apiError) setApiError(err.message || "An unexpected error occurred while saving.");
      console.error("Submit error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic loading state until useEffect populates formData from mockData
  if (Object.keys(formData).length === 0 && mockData) { 
      // Or check a specific field like !formData.name if all fields always exist
      return (
        <div className="card w-full max-w-3xl bg-base-200 shadow-xl">
            <div className="card-body items-center justify-center min-h-[300px]">
                <span className="loading loading-lg loading-spinner text-primary"></span>
                <p className="mt-4 text-lg">Loading mock data...</p>
            </div>
        </div>
      );
  }


  return (
    <div className="card w-full max-w-3xl bg-base-200 shadow-xl"> {/* Card container for the form */}
        <form onSubmit={handleSubmit} className="card-body space-y-6">
            <div className="flex items-center justify-between mb-4">
                <Link href="/dashboard" className="btn btn-ghost btn-sm text-base-content/70 hover:text-primary">
                <FiArrowLeft className="mr-2" /> Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-primary text-center flex-grow">Edit Mock Endpoint</h1>
                <div className="w-32"></div> {/* Spacer */}
            </div>

            {apiError && (
                <div role="alert" className="alert alert-error">
                    <FiAlertCircle className="text-xl"/>
                    <div>
                        <h3 className="font-bold">Save Error!</h3>
                        <div className="text-xs">{apiError}</div>
                    </div>
                </div>
            )}

            {/* Name Field */}
            <div className="form-control w-full">
                <label className="label" htmlFor="name">
                <span className="label-text">Mock Name <span className="text-error">*</span></span>
                </label>
                <input
                type="text" name="name" id="name"
                value={formData.name || ''} onChange={handleChange}
                placeholder="e.g., Get User Details v2"
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                disabled={isLoading}
                />
                {errors.name && <label className="label"><span className="label-text-alt text-error">{errors.name}</span></label>}
            </div>

            {/* Path and Method Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="form-control md:col-span-2">
                <label className="label" htmlFor="path_template">
                    <span className="label-text">Endpoint Path <span className="text-error">*</span></span>
                </label>
                <input
                    type="text" name="path_template" id="path_template"
                    value={formData.path_template || ''} onChange={handleChange}
                    placeholder="/users/:id/profile"
                    className={`input input-bordered w-full ${errors.path_template ? 'input-error' : ''}`}
                    disabled={isLoading}
                />
                {errors.path_template && <label className="label"><span className="label-text-alt text-error">{errors.path_template}</span></label>}
                </div>
                <div className="form-control">
                <label className="label" htmlFor="http_method">
                    <span className="label-text">HTTP Method <span className="text-error">*</span></span>
                </label>
                <select
                    name="http_method" id="http_method"
                    value={formData.http_method || 'GET'} onChange={handleChange}
                    className={`select select-bordered w-full ${errors.http_method ? 'select-error' : ''}`}
                    disabled={isLoading}
                >
                    <option value="GET">GET</option>
                    {/* Enable other methods when supported by backend */}
                    <option value="POST" disabled>POST (Soon)</option>
                    <option value="PUT" disabled>PUT (Soon)</option>
                    <option value="DELETE" disabled>DELETE (Soon)</option>
                </select>
                {errors.http_method && <label className="label"><span className="label-text-alt text-error">{errors.http_method}</span></label>}
                </div>
            </div>

            {/* Response Structure Textarea */}
            <div className="form-control">
                <label className="label" htmlFor="response_structure_string">
                <span className="label-text">Response Body (JSON with Faker.js) <span className="text-error">*</span></span>
                </label>
                <textarea
                name="response_structure_string" id="response_structure_string"
                value={formData.response_structure_string || ''}
                onChange={handleChange}
                rows={10}
                placeholder={'{\n  "data": {\n    "id": "{{faker.string.uuid}}"\n  }\n}'}
                className={`textarea textarea-bordered w-full font-mono text-sm leading-relaxed ${errors.response_structure_string ? 'textarea-error' : ''}`}
                disabled={isLoading}
                />
                {errors.response_structure_string && <label className="label"><span className="label-text-alt text-error">{errors.response_structure_string}</span></label>}
                <label className="label">
                <span className="label-text-alt">
                    Use <code className="kbd kbd-xs">{"{{faker.path.method}}"}</code>. Ex: <code className="kbd kbd-xs">{"{{faker.number.int({\"min\":10})}}"}</code>
                </span>
                </label>
            </div>
            
            {/* Status Code, Is Array, Array Count Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="form-control">
                <label className="label" htmlFor="status_code">
                    <span className="label-text">Status Code <span className="text-error">*</span></span>
                </label>
                <input
                    type="number" name="status_code" id="status_code"
                    value={formData.status_code || 200} onChange={handleChange}
                    min="100" max="599"
                    className={`input input-bordered w-full ${errors.status_code ? 'input-error' : ''}`}
                    disabled={isLoading}
                />
                {errors.status_code && <label className="label"><span className="label-text-alt text-error">{errors.status_code}</span></label>}
                </div>
                
                <div className="form-control sm:pt-7">
                <label className="label cursor-pointer justify-start gap-2">
                    <input
                    type="checkbox" name="is_array" id="is_array"
                    checked={!!formData.is_array} onChange={handleChange}
                    className="checkbox checkbox-primary"
                    disabled={isLoading}
                    />
                    <span className="label-text">Return as array?</span>
                </label>
                </div>

                {formData.is_array && (
                <div className="form-control">
                    <label className="label" htmlFor="array_count">
                    <span className="label-text">Array Count <span className="text-error">*</span></span>
                    </label>
                    <input
                    type="number" name="array_count" id="array_count"
                    value={formData.array_count || 1} onChange={handleChange}
                    min="1" max="100" // Added max for Zod consistency
                    className={`input input-bordered w-full ${errors.array_count ? 'input-error' : ''}`}
                    disabled={isLoading}
                    />
                    {errors.array_count && <label className="label"><span className="label-text-alt text-error">{errors.array_count}</span></label>}
                </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="card-actions justify-end pt-4">
                <Link href="/dashboard" className="btn btn-ghost" type="button" aria-disabled={isLoading}> {/* Use Link for cancel */}
                    Cancel
                </Link>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? <span className="loading loading-spinner"></span> : <FiSave className="mr-2" />}
                Save Changes
                </button>
            </div>
        </form>
    </div>
  );
}