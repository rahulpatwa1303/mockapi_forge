"use client";

import { useState } from 'react';
import { FiCopy } from 'react-icons/fi';

interface BaseUrlDisplayProps {
  baseUrl: string;
}

export default function BaseUrlDisplay({ baseUrl }: BaseUrlDisplayProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(baseUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error("Failed to copy base URL:", err);
      alert("Failed to copy base URL.");
    });
  };

  return (
    <div className="alert bg-base-200 shadow-lg mb-6">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <div>
          <h3 className="font-bold">Your Base Mock URL</h3>
          <div className="text-xs opacity-80">Use this as the root for your API client calls.</div>
          <code className="block text-accent-content/100 bg-base-300 p-2 rounded-md text-sm break-all mt-1 select-all">
            {baseUrl}
          </code>
        </div>
      </div>
      <div className="flex-none">
        <button className="btn btn-sm btn-ghost" onClick={copyToClipboard} title="Copy Base URL">
          {copySuccess ? 'Copied!' : <FiCopy className="text-lg" />}
        </button>
      </div>
    </div>
  );
}