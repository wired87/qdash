import React, { useState, useCallback } from "react";
import {useFile} from "../../hooks/useFile";
import {BucketStruct} from "./bucket_view";

const CustomChip = ({ children, color, size, style: customStyle = {}, onPress }) => {
    const baseStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '9999px',
        fontWeight: '500',
        transition: 'all 0.15s',
        cursor: onPress ? 'pointer' : 'default',
    };

    const sizeStyle = size === 'sm' ? { paddingLeft: '0.5rem', paddingRight: '0.5rem', paddingTop: '0.125rem', paddingBottom: '0.125rem', fontSize: '0.75rem' } : { paddingLeft: '0.75rem', paddingRight: '0.75rem', paddingTop: '0.25rem', paddingBottom: '0.25rem', fontSize: '0.875rem' };

    let colorStyle = { backgroundColor: '#4b5563', color: '#d1d5db' };

    // Color schemes translated to inline CSS
    if (color === 'primary') colorStyle = { backgroundColor: 'rgba(22, 163, 74, 0.2)', color: '#4ade80', border: '1px solid #16a34a' }; // Green
    else if (color === 'danger') colorStyle = { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444' }; // Red
    else if (color === 'warning') colorStyle = { backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#fcd34d', border: '1px solid #f59e0b' }; // Yellow
    else if (color === 'success') colorStyle = { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid #3b82f6' }; // Blue (System)
    else if (color === 'secondary') colorStyle = { backgroundColor: 'rgba(75, 85, 99, 0.2)', color: '#9ca3af', border: '1px solid #4b5563' }; // Dark Gray
    else if (color === 'default') colorStyle = { backgroundColor: 'rgba(55, 65, 81, 0.5)', color: '#9ca3af', border: '1px solid #374151' }; // Faded/Bordered Gray

    const interactionStyle = onPress ? { cursor: 'pointer', ':hover': { backgroundColor: '#374151' } } : {};

    return (
        <span
            onClick={onPress}
            style={{ ...baseStyle, ...sizeStyle, ...colorStyle, ...interactionStyle, ...customStyle }}
        >
            {children}
        </span>
    );
};

// Custom Button Component (replaces external Button)
const CustomButton = ({ children, onPress, isIconOnly, style: customStyle = {}, title, type = "button" }) => {
    const baseStyle = {
        borderRadius: '0.5rem',
        fontWeight: '600',
        transition: 'all 0.2s',
        outline: 'none',
        boxShadow: 'none',
        cursor: 'pointer',
    };
    const sizeStyle = isIconOnly ? { padding: '0.5rem', height: '2rem', width: '2rem', fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center' } : { paddingLeft: '0.75rem', paddingRight: '0.75rem', paddingTop: '0.375rem', paddingBottom: '0.375rem', fontSize: '0.875rem', height: '2rem' };

    const defaultColorStyle = { backgroundColor: '#10b981', color: '#ffffff', ':hover': { backgroundColor: '#059669' } };

    const iconButtonStyle = isIconOnly ? {
        backgroundColor: 'transparent',
        color: '#9ca3af',
        border: '1px solid #374151',
        ':hover': { backgroundColor: '#1f2937' }
    } : {};

    return (
        <button
            onClick={onPress}
            title={title}
            type={type}
            style={{
                ...baseStyle,
                ...sizeStyle,
                ...defaultColorStyle,
                ...iconButtonStyle,
                ...customStyle
            }}
        >
            {children}
        </button>
    );
};

// Custom Input Component (replaces external Input)
const CustomInput = ({ placeholder, value, onValueChange, style: customStyle = {} }) => {
    const inputStyle = {
        width: '100%',
        backgroundColor: 'transparent',
        outline: 'none',
        fontSize: '1rem',
        fontFamily: 'monospace',
        padding: '0',
        margin: '0',
        border: 'none',
        color: '#e5e7eb', // Always bright color since disabled state is removed
    };

    return (
        <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
                // Defensive check to avoid TypeError
                if (typeof onValueChange === 'function') {
                    onValueChange(e.target.value);
                }
            }}
            style={{ ...inputStyle, ...customStyle }}
        />
    );
};



export const TerminalConsole = ({
  error,
  handleSubmit,
  isConnected,
  inputValue,
  updateInputValue,
    toggleCfgSlider,
    toggleDataSlider,
    toggleDashboard,
    sendMessage,
    envs,
    toggleBucket,
    toggleNcfgSlider,
  options = [],
}) => {
  // Set initial state to true so the history window shows up immediately
  const [isExpanded, setIsExpanded] = useState(true);
  const [messages, setMessages] = useState([
      {
          type: "dave", // Use "COMMAND" type for user input
          text: "Hi, Im dave, I support you within the entire simulation process. Your todos: \n1. Create wcfg\n2. create ncfg\n3.run and monitor sim\n4. viauslize and export data\n5. apply ml if needed",
          timestamp: new Date().toISOString(),
      }
  ]);


    const {
    files,
    loading,
    fileInputRef,
    handleDrop,
    handleFileSelect,
    handleUpload,
    handleDragOver,
    handleRemoveFile,
  } = useFile();


  // Define 5 action cases
  const actionButtons = [
    { name: "Show ENVs", case: "show_envs" },
    { name: "Set Config", case: "set_config" },
    { name: "Data Space", case: "watch_data" },
    { name: "Upload Node Config", case: "upload_ncfg" },
  ];

  // Handler for the 5 action buttons
  const handleAction = useCallback((actionCase) => {
    if (actionCase === "set_config") {
        toggleCfgSlider()
    }else if (actionCase === "watch_data") {
        toggleDataSlider()
    }else if (actionCase === "show_envs") {
        toggleDashboard()
    }else if (actionCase === "upload_files") {
        toggleBucket()
    }else if (actionCase === "upload_ncfg") {
        toggleNcfgSlider()
    }else {
        updateInputValue(`${actionCase}`);
    }
  }, [
      updateInputValue, toggleDashboard, toggleDataSlider, toggleCfgSlider, toggleBucket, toggleNcfgSlider]);

  // Form submission handler (Handles Enter key press and Send button click)
  const onSubmit = useCallback((e) => {
    console.log("Form submitted with value:", inputValue);
    e.preventDefault(); // Prevent default form submission on Enter

    // Ensure inputValue is treated as a string to prevent 'trim' errors
    const valueToSubmit = inputValue || "";

    // Functional check: Only submit if connected and input is not empty
    if (valueToSubmit.trim() && isConnected) {
      sendMessage({
            data: {
                message:valueToSubmit,
                files: files,
            },
            type: "cmd",
            timestamp: new Date().toISOString(),
        });
      setMessages(prevMessages => [...prevMessages, {
          type: "cmd", // Use "COMMAND" type for user input
          text: valueToSubmit,
          timestamp: new Date().toISOString(),
      }]);
    }
  }, [inputValue, isConnected, handleSubmit, files]);


  const getMessageIcon = (type) => {
    switch (type) {
      case "COMMAND":
        return "💻";
      case "CHAT_MESSAGE":
        return "💬";
      case "LOGS":
        return "📋";
      case "ERROR":
        return "⚠️";
      case "SYSTEM":
        return "🔧";
      case "cfg_file":
        return "⚙️";
      default:
        return "ℹ️";
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case "ERROR":
        return "danger";
      case "COMMAND":
        return "primary";
      case "LOGS":
        return "warning";
      case "SYSTEM":
        return "success";
      case "cfg_file":
        return "secondary";
      default:
        return "default";
    }
  };

  // Base style for the fixed bottom container
  const containerStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    margin: '0 auto',
    maxWidth: '64rem', // max-w-5xl
    backgroundColor: '#030712', // bg-gray-950
    color: '#f9fafb', // text-gray-50
    borderRadius: '0.75rem 0.75rem 0 0', // rounded-xl only top corners
    boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.5)',
    border: '1px solid #1f2937',
    borderBottom: 'none',
    fontFamily: 'monospace',
    zIndex: 1000,
  };

  // Style for the expanded panel (includes buttons and scroll area)
  const expandedPanelStyle = {
    padding: '1rem',
    paddingBottom: 0, // Padding handled by scrollable area bottom margin
    // Near-transparent dark background for better readability against different page colors
    backgroundColor: 'rgba(3, 7, 18, 0.95)',
    borderBottom: '1px solid #1f2937',
  };

  // Scrollable history container style (messages only)
  const scrollableHistoryStyle = {
    height: '20rem', // Reduced height slightly to accommodate action buttons
    overflowY: 'auto',
    paddingTop: '0.75rem',
    paddingBottom: '0.75rem',
  };

  // Message item style (show just messages)
  const messageItemStyle = {
    padding: '0.5rem',
    fontSize: '0.875rem',
    borderRadius: '0.5rem',
    // Fully transparent background for "just messages" look
    backgroundColor: 'transparent',
    border: '1px solid #1f2937',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem'
  };


    const get_env_len = useCallback((_case) => {
        if (_case === "show_envs") {
            return `(${Object.keys(envs).length})`
        }
        return null
    }, [envs]);


    const bucketProps = {
    sendMessage,
    files,
    handleUpload,
    loading,
    fileInputRef,
    handleFileSelect,
    handleDragOver,
    handleDrop,
    handleRemoveFile
  };

  return (
    <div style={containerStyle}>
      {isExpanded && (
        // Terminal History Area (Chat Window)
        <div style={expandedPanelStyle}>
          {/* Action Buttons (Placed above the scrollable message list) */}
          <div style={scrollableHistoryStyle}>
            {/* Output Messages */}
            {messages.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {messages.slice(-50).map((message, index) => (
                  <div
                    key={`${message.timestamp}-${index}`}
                    style={messageItemStyle}
                  >
                      <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>
                        {getMessageIcon(message.type)}
                      </span>
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                          <CustomChip size="sm" color={getStatusColor(message.type)} style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                            {message.type}
                          </CustomChip>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', flexShrink: 0 }}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <pre style={{ whiteSpace: 'pre-wrap', color: '#d1d5db' }}>
                          {message.text || message.message}
                        </pre>
                        {message.cfg && (
                          <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#fcd34d' }}>
                            <span style={{ fontWeight: '600' }}>
                              {getMessageIcon("cfg_file")} Config Keys:{" "}
                            </span>
                            {Object.keys(message.cfg).join(", ")}
                          </div>
                        )}
                      </div>
                  </div>
                ))}
                <BucketStruct  {...bucketProps} />
              </div>
            ) : (
              // Empty State
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '150px', color: '#555' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📟</div>
                <p style={{ fontSize: '1.25rem', fontWeight: '600' }}>Ready for Action</p>
                <p style={{ fontSize: '0.875rem' }}>Use the buttons above or type a command.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input and Controls Area */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', paddingTop: isExpanded ? '0.5rem' : '1rem' }}>
        <div style={{
            display: 'flex',
            gap: '0.5rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid #1f2937',
          }}>
            {actionButtons.map((btn) => (
                <CustomButton
                    key={btn.case}
                    onPress={
                        () => handleAction(btn.case)
                    }
                    style={{
                      flexShrink: 0,
                      backgroundColor: '#1f2937',
                      color: '#4ade80',
                      border: '1px solid #374151',
                      flex: '1 1 auto',
                      minWidth: '0'
                    }}>
                    {btn.name} {get_env_len(btn.case)}
                </CustomButton>
            ))}
          </div>
        {/* Options / Suggestions */}
        {options.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', alignSelf: 'center', marginRight: '0.25rem' }}>Suggestions:</span>
            {options.map((option, index) => (
              <CustomChip
                key={index}
                size="sm"
                color="default"
                onPress={() => updateInputValue(option)}
                style={{ cursor: 'pointer', ':hover': { backgroundColor: '#374151', color: '#d1d5db' } }}
              >
                {option}
              </CustomChip>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
            <div
              style={{
                width: '0.625rem',
                height: '0.625rem',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#ef4444'
              }}
            />
            <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              {isConnected ? "Ready" : "Offline"}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1, backgroundColor: '#1f2937', borderRadius: '0.5rem', padding: '0.25rem', border: '1px solid #374151' }}>
            <span style={{ color: '#4ade80', fontWeight: '700', fontSize: '1.125rem', paddingLeft: '0.5rem', paddingRight: '0.25rem', flexShrink: 0 }}>$</span>
            <CustomInput
              placeholder={
                isConnected
                  ? "Enter command or choose a suggestion..."
                  : "Disconnected - waiting..."
              }
              value={inputValue}
              onValueChange={updateInputValue}
              style={{ flexGrow: 1 }}
            />
          </div>

          <CustomButton
            type="submit"
            style={{ flexShrink: 0 }}
            onclick={onSubmit}>
            Send
          </CustomButton>

          <CustomButton
            isIconOnly
            onPress={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse terminal" : "Expand terminal"}
            style={{ color: '#9ca3af', border: '1px solid #374151', backgroundColor: 'transparent', flexShrink: 0 }}
            type="button"
          >
            <span style={{ fontSize: '1.125rem' }}>{isExpanded ? "⬇️" : "⬆️"}</span>
          </CustomButton>

        </form>

        {error && (
          // Error Message Bar
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ backgroundColor: 'rgba(127, 29, 29, 0.3)', border: '1px solid #b91c1c', color: '#f87171', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.75rem', padding: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                  Error: {error.message || "Unknown Error"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalConsole;
