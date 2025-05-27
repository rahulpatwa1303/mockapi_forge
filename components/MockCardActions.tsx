// components/MockCardActions.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiEdit3, FiTrash2, FiExternalLink, FiCopy, FiPlayCircle, FiLoader, FiCode, FiAlertTriangle, FiX } from 'react-icons/fi';
import MockTester from './MockTester'; // Assuming this will also be styled with DaisyUI later
import CodeSnippetModal from './CodeSnippetModal'; // Assuming this will also be styled with DaisyUI later

type MockCardActionsProps = {
  mock: {
    id: string;
    name: string; // For confirmation message
    path_template: string; // Not directly used here, but good to have if needed
    http_method: string;
  };
  fullMockUrl: string;
};

export default function MockCardActions({ mock, fullMockUrl }: MockCardActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [copyUrlStatus, setCopyUrlStatus] = useState(''); // For URL copy feedback

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/project-mocks/${mock.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete mock');
      }
      setShowDeleteConfirm(false);
      router.refresh(); // Refresh dashboard to remove the card
      // Consider using a global toast notification system for better UX
    } catch (error: any) {
      console.error("Delete error:", error);
      // Replace alert with a more integrated error display if possible
      alert(`Error deleting mock: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, feedbackMessage: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyUrlStatus(feedbackMessage);
      setTimeout(() => setCopyUrlStatus(''), 2000);
    }, (err) => {
      console.error('Failed to copy: ', err);
      setCopyUrlStatus('Failed to copy!');
      setTimeout(() => setCopyUrlStatus(''), 2000);
    });
  };

  return (
    <>
      {/* URL Display and Copy */}
      <div className="form-control mb-3">
        <label className="label pb-1 pt-0">
          <span className="label-text text-xs opacity-70">Mock URL</span>
        </label>
        <div className="join w-full"> {/* DaisyUI join for grouping input and button */}
          <input
            type="text"
            value={fullMockUrl}
            readOnly
            className="input input-sm input-bordered join-item w-full font-mono !text-xs focus:outline-none"
            // Using !text-xs to ensure small font for potentially long URLs
          />
          <button
            onClick={() => copyToClipboard(fullMockUrl, 'URL Copied!')}
            title="Copy URL"
            className="btn btn-sm join-item btn-square btn-ghost"
          >
            <FiCopy className="text-lg" />
          </button>
        </div>
        {copyUrlStatus && <p className="text-xs text-success mt-1 text-center">{copyUrlStatus}</p>}
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={fullMockUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-outline btn-info w-full" // DaisyUI button classes
        >
          <FiExternalLink className="mr-1" /> Open
        </Link>

        <button
          onClick={() => setShowSnippets(true)}
          className="btn btn-sm btn-outline btn-accent w-full" // DaisyUI button classes
        >
          <FiCode className="mr-1" /> Snippets
        </button>

        <Link
          href={`/mocks/${mock.id}/edit`}
          className="btn btn-sm btn-outline btn-warning w-full" // DaisyUI button classes
        >
          <FiEdit3 className="mr-1" /> Edit
        </Link>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
          className="btn btn-sm btn-outline btn-error w-full" // DaisyUI button classes
        >
          {isDeleting ? <span className="loading loading-spinner loading-xs"></span> : <FiTrash2 className="mr-1" />}
          Delete
        </button>
      </div>

      {/* Delete Confirmation Modal (DaisyUI Modal) */}
      {showDeleteConfirm && (
        <dialog id={`delete_modal_${mock.id}`} className="modal modal-open"> {/* modal-open makes it visible */}
          <div className="modal-box">
            <form method="dialog"> {/* Allows closing modal with buttons or ESC */}
                <button 
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={() => setShowDeleteConfirm(false)} // Also handle close here
                >✕</button>
            </form>
            <div className="text-center">
                <FiAlertTriangle className="text-error text-5xl mx-auto mb-4" />
                <h3 className="font-bold text-lg">Confirm Deletion</h3>
            </div>
            <p className="py-4 text-center">
              Are you sure you want to delete the mock "<strong>{mock.name}</strong>"?<br/>This action cannot be undone.
            </p>
            <div className="modal-action justify-center gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <span className="loading loading-spinner loading-sm"></span> : 'Delete Mock'}
              </button>
            </div>
          </div>
          {/* Optional: Click outside to close (requires a bit more setup or rely on daisyUI's form method="dialog" trick) */}
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowDeleteConfirm(false)}>close</button>
          </form>
        </dialog>
      )}

      {/* Code Snippet Modal Trigger */}
      {/* The CodeSnippetModal component itself needs to be a DaisyUI modal */}
      {showSnippets && (
        <CodeSnippetModal
            isOpen={showSnippets} // The modal will use this to apply modal-open
            onClose={() => setShowSnippets(false)}
            method={mock.http_method}
            url={fullMockUrl}
        />
      )}
      
      {/* MockTester - This component also needs DaisyUI styling if used */}
      {/* For now, we'll assume its styling is separate or will be updated later */}
      <div className="mt-3">
        <MockTester url={fullMockUrl} method={mock.http_method} />
      </div>
    </>
  );
}