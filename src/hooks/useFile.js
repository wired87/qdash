import { useState, useRef, useCallback } from 'react';

// Custom hook to manage file selection, dragging, and upload logic
export const useFile = () => {
  // State for files, loading status
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const MAX_FILES = 20; // Maximum files allowed

  // Function to add new files, keeping only the max allowed
  const handleFiles = useCallback((newFiles) => {
    // Combine existing and new files, then slice to MAX_FILES
    const combinedFiles = [...files, ...newFiles].slice(0, MAX_FILES);
    setFiles(combinedFiles);
  }, [files]);
  const handleRemoveFile = (indexToRemove) => {
    setFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
    // Reset file input value so same file can be selected again
    if (fileInputRef.current) {
        fileInputRef.current.value = null;
    }
  };
  // Drag-and-drop handler for file drop
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const newFiles = Array.from(event.dataTransfer.files);
    handleFiles(newFiles);
  }, [handleFiles]);

  // File selection handler from input field
  const handleFileSelect = useCallback((event) => {
    const newFiles = Array.from(event.target.files);
    handleFiles(newFiles);
  }, [handleFiles]);

  // Upload function
  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;
    setLoading(true);

    const formData = new FormData();
    files.forEach(f => formData.append('attachments', f));

    try {
      const res = await fetch("https://bestbrain.tech/docai/inv/",
        { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Network response not ok');

      const blob = await res.blob();
      const filename = 'invoice_data.csv';

      // Create a temporary link to trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Upload error:', e);
    } finally {
      setLoading(false);
    }
  }, [files]);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  // Expose state and handlers
  return {
    files,
    loading,
    fileInputRef,
    handleDrop,
    handleFileSelect,
    handleUpload,
    handleDragOver: (event) => event.preventDefault(), // Simple drag over handler
    handleRemoveFile,
    clearFiles,
  };
};
