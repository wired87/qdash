
// --- View Component (The actual bucket UI) ---
import {TrashIcon} from "lucide-react";

export const BucketStruct = ({ sendMessage, files, handleUpload, loading, fileInputRef, handleFileSelect, handleDragOver, handleDrop, handleRemoveFile }) => {

  // Dark Theme Styles for seamless terminal integration
  const darkContainerStyle = {
    padding: '16px',
    backgroundColor: '#1f2937', // Dark Gray background
    borderRadius: '12px',
    boxShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
    border: '1px solid #374151', // Darker border
    width: '100%',
    transition: 'all 0.3s ease-in-out',
    color: '#d1d5db', // Light gray text
    margin: '0 auto',
  };

  const dropzoneStyle = {
    backgroundColor: '#374151', // Slightly lighter dark background
    border: '2px dashed #4ade80', // Green accent for "Ready" state
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };

  return (
    <div style={darkContainerStyle}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#4ade80', // Green accent for title
        marginBottom: '16px',
        borderBottom: '1px solid #374151',
        paddingBottom: '8px'
      }}>Module Upload</h2>

      {/* Dropzone */}
      <div
        style={dropzoneStyle}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
      >
        <TrashIcon style={{
          width: '32px',
          height: '32px',
          margin: '0 auto 8px auto',
          color: '#4ade80',
          transform: 'rotate(90deg)'
        }} />
        <p style={{ fontWeight: '600', color: '#e5e7eb' }}>Drag & Drop files here or Click to select</p>
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
              backgroundColor: '#374151', // Darker item background
              borderRadius: '6px',
              fontSize: '14px',
              color: '#d1d5db',
              fontWeight: '500',
              border: '1px solid #4b5563',
            }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexGrow: 1, marginRight: '8px' }}>{file.name}</span>

              <div style={{ display: 'flex', gap: '8px' }}>
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
    </div>
  );
};

