
import React, { useState, useRef, useCallback } from 'react';

// --- Icon SVG (Bucket/Trash Can for visual representation) ---
const TrashIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

// --- Component with File Management Logic ---
const BucketComponent = ({ sendMessage, files, handleUpload, loading, fileInputRef, handleFileSelect, handleDragOver, handleDrop, handleRemoveFile }) => {

  return (
    <div style={{
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #f3f4f6',
        width: '100%',
        maxWidth: '448px',
        margin: '0 auto',
        transition: 'all 0.3s ease-in-out',
      }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: '16px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '8px'
      }}>File Bucket Manager</h2>

      {/* Dropzone */}
      <div
        style={{
          backgroundColor: '#eef2ff',
          border: '2px dashed #a5b4fc',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e0e7ff'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#eef2ff'}
      >
        <TrashIcon style={{
          width: '32px',
          height: '32px',
          margin: '0 auto 8px auto',
          color: '#6366f1',
          transform: 'rotate(90deg)'
        }} />
        <p style={{ fontWeight: '600', color: '#4338ca' }}>Drag & Drop files here or Click to select</p>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>({files.length} of 2 files selected)</p>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={files.length >= 2}
          accept=".txt,.pdf,.jpg,.png"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <ul style={{
          marginTop: '16px',
          listStyle: 'none',
          padding: '0',
          maxHeight: '128px',
          overflowY: 'auto',
          paddingRight: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {files.map((file, index) => (
            <li key={index} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#374151',
              fontWeight: '500',
              border: '1px solid #e5e7eb',
            }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexGrow: 1, marginRight: '8px' }}>{file.name}</span>

              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Plus button next to each file */}
                <button
                  onClick={() => sendMessage(`Sending file reference for: ${file.name}`)}
                  style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    backgroundColor: '#3b82f6', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                  title={`Send message about ${file.name}`}
                >
                  +
                </button>
                {/* Remove button */}
                <button
                  onClick={() => handleRemoveFile(index)}
                  style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    backgroundColor: '#ef4444', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                  title={`Remove ${file.name}`}
                >
                  &times;
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}


      {/* Action Buttons */}
      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={handleUpload}
          disabled={loading || files.length === 0}
          style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            fontWeight: 'bold', color: 'white', border: 'none',
            cursor: (loading || files.length === 0) ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s, box-shadow 0.3s',
            backgroundColor: (loading || files.length === 0) ? '#9ca3af' : '#10b981',
            boxShadow: (loading || files.length === 0) ? 'none' : '0 4px 6px -1px rgba(16, 185, 129, 0.5), 0 2px 4px -2px rgba(16, 185, 129, 0.5)',
          }}
          onMouseOver={(e) => {
            if (!loading && files.length > 0) {
              e.currentTarget.style.backgroundColor = '#059669';
            }
          }}
          onMouseOut={(e) => {
            if (!loading && files.length > 0) {
              e.currentTarget.style.backgroundColor = '#10b981';
            }
          }}
        >
          {loading ? 'Uploading...' : 'Upload Files'}
        </button>

        <button
          onClick={() => sendMessage("General message from bucket")}
          style={{
            width: '100%', padding: '8px', borderRadius: '8px',
            fontWeight: '600', color: '#4f46e5', border: 'none',
            backgroundColor: '#eef2ff',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e0e7ff'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#eef2ff'}
        >
          Send General Message
        </button>
      </div>
    </div>
  );
};


// --- Main Application Component (Wraps logic and presentation) ---
const App = () => {
  // 1. STATE SIMULATING useFile HOOK
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FILES = 2;

  // 2. SIMULATED HOOK FUNCTIONS

  const sendMessage = useCallback((message) => {
    console.log(`[Message Sent]: ${message}`);
    alert(`Message Sent: ${message}`);
  }, []);

  const handleFileSelect = (event) => {
    const newFiles = Array.from(event.target.files).slice(0, MAX_FILES - files.length);
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (files.length >= MAX_FILES) return;

    const droppedFiles = Array.from(event.dataTransfer.files).filter(
      (f) => f.type.match(/image\/(jpeg|png)|application\/(pdf)/) || f.name.endsWith('.txt')
    );
    const newFiles = droppedFiles.slice(0, MAX_FILES - files.length);
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleUpload = () => {
    if (files.length === 0) return;
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      console.log('Uploading:', files.map(f => f.name));
      alert(`Successfully uploaded ${files.length} files!`);
      setLoading(false);
      setFiles([]);
      fileInputRef.current.value = null;
    }, 1500);
  };

  // Refactored to be local to App and passed down
  const handleRemoveFile = (indexToRemove) => {
    setFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
    // Reset file input value so same file can be selected again
    if (fileInputRef.current) {
        fileInputRef.current.value = null;
    }
  };


  // 3. RENDER       <h1 style={{fontSize: '24px', fontWeight: '800', color: '#1f2937', marginBottom: '32px'}}>File Management Demo</h1>
  return (
    <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px',
        fontFamily: 'sans-serif'
      }}>
              {/* The File Bucket Component (Conditionally rendered) */}
      {isExpanded && (
        <div style={{ marginTop: '32px', width: '100%', maxWidth: '448px' }}>
          <BucketComponent
            sendMessage={sendMessage}
            files={files}
            handleUpload={handleUpload}
            loading={loading}
            fileInputRef={fileInputRef}
            handleFileSelect={handleFileSelect}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            handleRemoveFile={handleRemoveFile}
          />
        </div>
      )}

      {/* The main button with the bucket icon (Trash Icon) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          backgroundColor: '#4f46e5',
          color: 'white',
          borderRadius: '9999px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease-in-out',
          border: 'none',
          cursor: 'pointer',
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
        title={isExpanded ? "Close File Manager" : "Open File Manager"}
      >
        <TrashIcon style={{ width: '24px', height: '24px' }} />
        <span style={{ fontWeight: '600' }}>{isExpanded ? 'Close File Manager' : 'Open File Manager'}</span>
      </button>


    </div>
  );
};

export default App;
