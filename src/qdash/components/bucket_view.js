import React from 'react';
import {useFile} from "../../hooks/useFile"; // We'll create this CSS file
import "../../index.css";

const BucketComponent = ({ sendMessage }) => {
  const {
    files,
    loading,
    fileInputRef,
    handleDrop,
    handleFileSelect,
    handleUpload,
    handleDragOver,
  } = useFile();

  return (
    <div className="bucket-container">
      <div
        className="dropzone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <p className="dropzone-text-main">Drag & Drop files here or Click to select</p>
        <p className="dropzone-text-sub">({files.length} of 2 files selected)</p>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <ul className="file-list">
        {files.map((file, index) => (
          <li key={index}>
            {file.name}
            {/* Plus button next to each file */}
            <button onClick={() => sendMessage(file.name)} className="send-message-btn">
              +
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={handleUpload}
        disabled={loading || files.length === 0}
        className="upload-btn"
      >
        {loading ? 'Uploading...' : 'Upload Files'}
      </button>

      {/* A general send message button, maybe for a global message */}
      <button onClick={() => sendMessage("General message from bucket")} className="send-message-general-btn">
        Send General Message
      </button>
    </div>
  );
};

export default BucketComponent;