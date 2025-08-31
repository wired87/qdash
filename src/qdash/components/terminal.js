import React, { useState, useCallback } from "react";
import "../../index.css";

// Single Message Component
const SingleMessage = ({ item }) => {
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
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="message-container">
      <span className="message-icon">{getMessageIcon(item.type)}</span>
      <div className="message-content">
        <div className="message-header">
          <span className="message-type">{item.type}</span>
          <span className="message-time">
            {new Date(item.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="message-text">{item.text}</p>
      </div>
    </div>
  );
};

/**
 * Terminal Console Component with Custom CSS
 */
export const TerminalConsole = ({
  error,
  statusClass,
  handleSubmit,
  isConnected,
  inputValue,
  updateInputValue,
  options = [],
  messages = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const onSubmit = useCallback(() => {
    if (inputValue.trim() && isConnected) {
      handleSubmit();
    }
  }, [inputValue, isConnected, handleSubmit]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter") {
        onSubmit();
      }
    },
    [onSubmit]
  );

  return (
    <div className="terminal-console">
      {/* Expandable Messages Area */}
      {isExpanded && (
        <div className="terminal-messages">
          <div className="messages-container">
            <div className="messages-header">
              <h3 className="messages-title">
                <div className="status-dot pulsing"></div>
                <span>Terminal Output</span>
              </h3>
              <span className="messages-count">{messages.length} messages</span>
            </div>

            {messages.length > 0 ? (
              <div className="messages-list">
                {messages.slice(-10).map((message, index) => (
                  <SingleMessage key={index} item={message} />
                ))}
              </div>
            ) : (
              <div className="no-messages">
                <div className="no-messages-icon">
                  <span className="terminal-emoji">📟</span>
                </div>
                <p className="no-messages-text">No messages yet</p>
                <p className="no-messages-subtext">
                  Start typing a command below
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Terminal Bar */}
      <div className="terminal-main">
        {/* Options Row */}
        {options.length > 0 && (
          <div className="terminal-options">
            {options.map((option, index) => (
              <button key={index} className="option-chip">
                <span className="option-dot"></span>
                <span>{option}</span>
              </button>
            ))}
          </div>
        )}

        {/* Terminal Input Row */}
        <div className="terminal-input-row">
          {/* Status Indicator */}
          <div className="terminal-status">
            <div className={`status-info ${statusClass}`}>
              <div
                className={`connection-dot ${
                  isConnected ? "connected" : "disconnected"
                }`}
              ></div>
              <span className="connection-text">
                {isConnected ? "Online" : "Offline"}
              </span>
            </div>
            <div className="status-divider"></div>
            <span className="message-counter">{messages.length} msg</span>
          </div>

          {/* Terminal Input */}
          <div className="terminal-input-container">
            <div className="terminal-prompt">
              <span className="prompt-symbol">$</span>
              <div className="prompt-divider"></div>
            </div>
            <input
              type="text"
              className="terminal-input"
              value={inputValue}
              onChange={(e) => updateInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isConnected
                  ? "Enter command..."
                  : "Disconnected - waiting for connection..."
              }
              disabled={!isConnected}
            />
            <button
              onClick={onSubmit}
              disabled={!isConnected || !inputValue.trim()}
              className="terminal-send-btn"
            >
              <span className="send-text-desktop">Send</span>
              <span className="send-text-mobile">→</span>
            </button>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="terminal-expand-btn"
            title={isExpanded ? "Collapse terminal" : "Expand terminal"}
          >
            <svg
              className={`expand-icon ${isExpanded ? "rotated" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="terminal-error">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <p className="error-text">{error.message || "Unknown Error"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Demo Component
const TerminalDemo = () => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "COMMAND",
      text: "System initialized successfully",
      timestamp: new Date().toISOString(),
    },
    {
      type: "CHAT_MESSAGE",
      text: "Welcome to the terminal console!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isConnected] = useState(true);

  const handleSubmit = useCallback(() => {
    if (inputValue.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          type: "COMMAND",
          text: inputValue,
          timestamp: new Date().toISOString(),
        },
      ]);
      setInputValue("");
    }
  }, [inputValue]);

  const updateInputValue = useCallback((value) => {
    setInputValue(value);
  }, []);

  return (
    <div className="terminal-demo">
      <div className="demo-content">
        <div className="demo-text">
          <h1 className="demo-title">Terminal Console Demo</h1>
          <p className="demo-subtitle">Check out the terminal at the bottom!</p>
          <div className="demo-stats">
            <span className="connected-status">✅ Connected</span>
            <span className="message-count">{messages.length} messages</span>
          </div>
        </div>
      </div>

      <TerminalConsole
        error={null}
        statusClass={isConnected ? "text-green-400" : "text-red-400"}
        handleSubmit={handleSubmit}
        isConnected={isConnected}
        inputValue={inputValue}
        updateInputValue={updateInputValue}
        options={["config creation", "QA", "system status", "help", "logs"]}
        messages={messages}
      />
    </div>
  );
};

export default TerminalDemo;
