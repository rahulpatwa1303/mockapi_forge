// components/MockTester.tsx
"use client";

import { useState } from 'react';
import { FiPlayCircle, FiLoader, FiChevronDown, FiChevronUp, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

type MockTesterProps = {
  url: string;
  method: string;
};

export default function MockTester({ url, method }: MockTesterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [showResponseArea, setShowResponseArea] = useState(false); // To toggle entire response area visibility
  const [isResponseVisible, setIsResponseVisible] = useState(true); // To toggle content within the area (collapse/expand)


  const handleTest = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setStatusCode(null);
    setShowResponseArea(true); // Always show the area when a test is initiated
    setIsResponseVisible(true); // Default to expanded when new response comes

    try {
      const res = await fetch(url, {
        method: method.toUpperCase(),
        // headers: { 'Content-Type': 'application/json' }, // Add if needed for POST/PUT
        // body: JSON.stringify(requestBody) // Add if needed for POST/PUT
      });
      setStatusCode(res.status);
      const responseText = await res.text();
      try {
        const data = JSON.parse(responseText);
        setResponse(data);
      } catch (jsonError) {
        setResponse(responseText);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch. Check browser console for CORS or network issues.');
      // Ensure statusCode reflects a client-side error if fetch itself fails
      if (!statusCode) setStatusCode(0); // Indicate client-side/network error
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColorClass = () => {
    if (!statusCode) return 'text-base-content opacity-70'; // Neutral if no status yet
    if (statusCode === 0) return 'text-error'; // Client-side/Network error
    if (statusCode >= 200 && statusCode < 300) return 'text-success';
    if (statusCode >= 300 && statusCode < 400) return 'text-info';
    if (statusCode >= 400 && statusCode < 500) return 'text-warning';
    if (statusCode >= 500) return 'text-error';
    return 'text-base-content opacity-70';
  };

  return (
    // Removed the top border and margin, assuming parent component (MockCardActions) handles spacing
    <div className="w-full">
      <button
        onClick={handleTest}
        disabled={isLoading}
        className="btn btn-outline btn-accent btn-sm w-full" // DaisyUI button classes
      >
        {isLoading ? <span className="loading loading-spinner loading-xs"></span> : <FiPlayCircle className="mr-1" />}
        Test Endpoint
      </button>

      {/* Response Area - only shown after a test attempt */}
      {showResponseArea && (
        <div className="mt-3 p-3 rounded-lg bg-base-300 shadow">
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <span className="loading loading-dots loading-md text-accent"></span>
            </div>
          ) : (
            <>
              <div 
                className="flex justify-between items-center cursor-pointer hover:text-accent transition-colors"
                onClick={() => setIsResponseVisible(!isResponseVisible)}
              >
                <div className="font-medium text-sm">
                  {error ? (
                    <span className="flex items-center text-error">
                      <FiAlertTriangle className="mr-2" /> Error
                    </span>
                  ) : (
                    <span className="flex items-center text-success">
                      <FiCheckCircle className="mr-2" /> Response
                    </span>
                  )}
                </div>
                <div className={`text-xl ${isResponseVisible ? 'rotate-0' : '-rotate-180'} transition-transform`}>
                    {isResponseVisible ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </div>

              {isResponseVisible && (
                <div className="mt-2">
                  {error && (
                     <div role="alert" className="alert alert-error text-xs p-2">
                        <FiAlertTriangle className="text-lg" />
                        <div>
                            <h3 className="font-bold">Status: {statusCode === 0 ? 'Network/Client Error' : statusCode}</h3>
                            <p>{error}</p>
                        </div>
                    </div>
                  )}
                  {response !== null && !error && (
                    <div>
                      <p className={`text-xs font-semibold mb-1 ${getStatusColorClass()}`}>
                        Status: {statusCode}
                      </p>
                      <div className="mockup-code text-xs max-h-60 overflow-y-auto"> {/* DaisyUI mockup-code */}
                        <pre data-prefix={statusCode && statusCode >= 200 && statusCode < 300 ? "✓" : "!"} className={statusCode && statusCode >= 200 && statusCode < 300 ? "text-success" : "text-error"}></pre>
                        <pre className="whitespace-pre-wrap break-all">
                            <code>{typeof response === 'string' ? response : JSON.stringify(response, null, 2)}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                  {response === null && !error && !isLoading && (
                    <p className="text-xs text-center opacity-70 py-3">No response data received.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}