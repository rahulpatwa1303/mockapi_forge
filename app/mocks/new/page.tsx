// app/mocks/new/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import Link from 'next/link'; // For cancel button if styled as link
import { FiPlus, FiAlertCircle, FiSave, FiArrowLeft } from 'react-icons/fi'; // Icons

// Same schema as backend for client-side validation (optional but good)
const mockFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  path_template: z.string().min(1, "Path is required")
    .regex(/^\/[a-zA-Z0-9_:\-\/]*$/, "Path must start with / and contain only letters, numbers, underscores, hyphens, colons, or slashes.")
    .max(200, "Path too long"),
  http_method: z.enum(['GET', 'POST', 'PUT', 'DELETE']), // Keep this, or expand as needed
  response_structure_string: z.string().min(1, "Response structure is required").refine(val => {
    try { JSON.parse(val); return true; } catch { return false; }
  }, "Must be valid JSON"),
  is_array: z.boolean(),
  array_count: z.number().int().min(1).max(100, "Array count max 100"), // Added max
  status_code: z.number().int().min(100).max(599)
});

type MockFormData = z.infer<typeof mockFormSchema>;

export default function NewMockPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<MockFormData>>({
    name: '',
    path_template: '/',
    http_method: 'GET',
    response_structure_string: '{\n  "id": "{{faker.string.uuid}}",\n  "name": "{{faker.person.fullName}}",\n  "email": "{{faker.internet.email}}"\n}',
    is_array: false,
    array_count: 1,
    status_code: 200,
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({}); // More specific type for errors
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;

    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      // Allow empty input for numbers initially, parse when non-empty or on submit
      if (value === '') {
        // Keep as empty string in state if user clears it, Zod will handle validation
        // Or set to a default/previous valid number if preferred.
        // For this form, letting Zod catch it is fine.
        // For controlled components, it's often better to store number | ''
      } else {
        processedValue = parseInt(value, 10);
        if (isNaN(processedValue)) processedValue = name === 'array_count' ? 1 : 200; // Fallback if parsing fails mid-typing
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

    // Coerce types before parsing, especially for numbers from inputs
    const dataToParse = {
        ...formData,
        array_count: Number(formData.array_count) || 1, // Ensure number type
        status_code: Number(formData.status_code) || 200, // Ensure number type
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
      const payload = {
        ...result.data,
        response_structure: responseStructure,
      };
      // @ts-ignore // This is safe as response_structure_string is not in the backend schema
      delete payload.response_structure_string;

      const res = await fetch('/api/project-mocks', {
        method: 'POST',
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
      router.push('/dashboard?success=mock_created');
      router.refresh();
    } catch (err: any) {
      // apiError is already set if it's a server error with JSON response
      if (!apiError) setApiError(err.message || "An unexpected error occurred.");
      console.error("Submit error:", err);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    // Main container for the page, centers the form card
    <div className="flex flex-col items-center justify-start pt-8 pb-12 px-4 min-h-[calc(100vh-var(--navbar-height,4rem))]"> {/* Adjust navbar height if needed */}
      <div className="card w-full max-w-3xl bg-base-200 shadow-xl">
        <form onSubmit={handleSubmit} className="card-body space-y-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard" className="btn btn-ghost btn-sm text-base-content/70 hover:text-primary">
              <FiArrowLeft className="mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-primary text-center flex-grow">Create New Mock</h1>
            <div className="w-32"></div> {/* Spacer to balance title */}
          </div>


          {apiError && (
             <div role="alert" className="alert alert-error">
                <FiAlertCircle className="text-xl"/>
                <div>
                    <h3 className="font-bold">Oops! Something went wrong.</h3>
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
              placeholder="e.g., Get All Users v1"
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
                placeholder="/users/:id"
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
                <option value="POST" disabled>POST (Soon)</option> {/* Example for future */}
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
              placeholder={'{\n  "id": "{{faker.string.uuid}}",\n  "name": "{{faker.person.fullName}}"\n}'}
              className={`textarea textarea-bordered w-full font-mono text-sm leading-relaxed ${errors.response_structure_string ? 'textarea-error' : ''}`}
              disabled={isLoading}
            />
            {errors.response_structure_string && <label className="label"><span className="label-text-alt text-error">{errors.response_structure_string}</span></label>}
            <label className="label">
              <span className="label-text-alt">
                Use <code className="kbd kbd-xs">{"{{faker.path.method}}"}</code>. Ex: <code className="kbd kbd-xs">{"{{faker.number.int({\"min\":1})}}"}</code>
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
            
            <div className="form-control sm:pt-7"> {/* Align checkbox with input */}
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
                  min="1" max="100"
                  className={`input input-bordered w-full ${errors.array_count ? 'input-error' : ''}`}
                  disabled={isLoading}
                />
                {errors.array_count && <label className="label"><span className="label-text-alt text-error">{errors.array_count}</span></label>}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="card-actions justify-end pt-4">
            <Link href="/dashboard" className="btn btn-ghost" type="button"> {/* Changed to Link for cancel */}
                Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? <span className="loading loading-spinner"></span> : <FiSave className="mr-2" />}
              Create Mock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}