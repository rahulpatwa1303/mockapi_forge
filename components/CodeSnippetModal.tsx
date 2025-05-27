// components/CodeSnippetModal.tsx
"use client";
import { useState, useEffect } from 'react';
import { FiCopy, FiX, FiTerminal, FiCode } from 'react-icons/fi'; // Added FiTerminal

type SnippetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  method: string;
  url: string;
  // bodyData?: any; // For POST/PUT requests later - important for snippet generation
};

// Define languages with more metadata for syntax highlighting (conceptual)
const languages = [
  { id: 'curl', name: 'cURL', icon: <FiTerminal className="mr-2 opacity-70" /> },
  { id: 'javascript', name: 'JavaScript (fetch)', icon: <span className="mr-2 font-bold text-xs opacity-70">JS</span> },
  { id: 'python', name: 'Python (requests)', icon: <span className="mr-2 font-bold text-xs opacity-70">PY</span> },
  // Add more: e.g., { id: 'php', name: 'PHP (curl)' }, { id: 'java', name: 'Java (HttpClient)' }
];

export default function CodeSnippetModal({ isOpen, onClose, method, url }: SnippetModalProps) {
  const [selectedLang, setSelectedLang] = useState(languages[0].id);
  const [snippet, setSnippet] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // This useEffect generates the snippet when props or selectedLang change
  useEffect(() => {
    if (!isOpen) return;

    let generatedSnippet = '';
    // A placeholder for request body - in a real app, you'd pass this or have a way to input it
    const requestBodyPlaceholder = (method === 'POST' || method === 'PUT') 
        ? '{\n  "key": "value",\n  "anotherKey": "anotherValue"\n}' 
        : null;

    switch (selectedLang) {
      case 'curl':
        generatedSnippet = `curl -X ${method.toUpperCase()} "${url}"`;
        if (requestBodyPlaceholder) {
          generatedSnippet += ` \\\n     -H "Content-Type: application/json" \\\n     -d '${requestBodyPlaceholder.replace(/\n/g, '')}'`; // Single line JSON for curl -d
        }
        break;
      case 'javascript':
        generatedSnippet = `fetch("${url}", {\n  method: "${method.toUpperCase()}",`;
        if (requestBodyPlaceholder) {
          generatedSnippet += `\n  headers: {\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify(${requestBodyPlaceholder})`;
        }
        generatedSnippet += `\n})\n.then(response => {\n  if (!response.ok) {\n    throw new Error(\`HTTP error! status: \${response.status}\`);\n  }\n  return response.json(); // or response.text() if not JSON\n})\n.then(data => console.log(data))\n.catch(error => console.error('Error:', error));`;
        break;
      case 'python':
        generatedSnippet = `import requests\nimport json\n\nurl = "${url}"\nmethod = "${method.toUpperCase()}"\n`;
        if (requestBodyPlaceholder) {
          generatedSnippet += `payload = json.loads("""${requestBodyPlaceholder}""")\nheaders = {"Content-Type": "application/json"}\n\nresponse = requests.request(method, url, json=payload, headers=headers)\n`;
        } else {
          generatedSnippet += `response = requests.request(method, url)\n`;
        }
        generatedSnippet += `\nprint(f"Status Code: {response.status_code}")\nprint("Response JSON:", response.json()) # or response.text`;
        break;
      default:
        generatedSnippet = `Snippet not available for ${selectedLang}.`;
    }
    setSnippet(generatedSnippet);
  }, [isOpen, selectedLang, method, url]); // Regenerate if any of these change while modal is open

  const copySnippet = () => {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Increased timeout
    }, () => {
      // Simple alert for now, consider a more integrated notification
      alert('Failed to copy snippet. Your browser might not support this feature or permissions are denied.');
    });
  };

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // DaisyUI modal structure
    <dialog open className="modal modal-bottom sm:modal-middle modal-open"> {/* modal-open makes it visible */}
      <div className="modal-box w-11/12 max-w-3xl"> {/* Increased max-width */}
        {/* Header with Title and Close Button */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-xl text-primary flex items-center">
            <FiCode className="mr-2" /> Code Snippets
          </h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        {/* Language Selector Tabs (DaisyUI tabs) */}
        <div className="tabs tabs-boxed mb-4 bg-base-200 p-1">
          {languages.map(lang => (
            <button
              key={lang.id}
              onClick={() => setSelectedLang(lang.id)}
              className={`tab tab-sm sm:tab-md flex-grow ${selectedLang === lang.id ? 'tab-active !bg-primary text-primary-content' : 'hover:bg-base-content/10'}`}
            >
              {lang.icon} {lang.name}
            </button>
          ))}
        </div>

        {/* Code Display Area (DaisyUI mockup-code) */}
        <div className="relative mockup-code bg-base-300 text-sm shadow-lg">
          <button
            onClick={copySnippet}
            title="Copy snippet"
            className="btn btn-xs btn-ghost absolute top-2 right-2 opacity-70 hover:opacity-100 z-10" // z-10 to be above pre
          >
            {copySuccess ? <span className="text-success text-xs">Copied!</span> : <FiCopy />}
          </button>
          <pre className="whitespace-pre-wrap break-all overflow-x-auto max-h-[60vh] p-4 pt-6"> {/* pt-6 for copy button space */}
            {/* 
              Ideally, use a syntax highlighting library here like 'react-syntax-highlighter'.
              For now, just displaying the raw snippet.
            */}
            <code className={`language-${selectedLang}`}>{snippet}</code>
          </pre>
        </div>
        
        <p className="mt-3 text-xs text-base-content opacity-60">
          Note: For POST/PUT/PATCH requests, you may need to adjust the request body (payload) and ensure `Content-Type: application/json` header is included.
        </p>

        {/* Modal Actions (Optional, if you need more buttons) */}
        <div className="modal-action mt-6">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
      {/* Click outside to close */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}