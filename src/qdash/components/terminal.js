import React, { useState, useCallback } from "react";
import { Button, Input, Card, CardBody, Chip } from "@heroui/react";
import "../../index.css";

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

  return (
    <div className="terminal-container">
      {isExpanded && (
        <div className="terminal-history">
          <div className="terminal-history-header">
            <h3 className="terminal-history-title">Terminal History</h3>
            <div className="terminal-history-info">
              <Chip size="sm" color="primary">
                {messages.length} messages
              </Chip>
              <div className="terminal-status-indicator">
                <div
                  className={`terminal-status-dot ${
                    isConnected ? "online" : "offline"
                  }`}
                />
                <span className="terminal-status-text">
                  {isConnected ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>

          {messages.length > 0 ? (
            <div className="terminal-messages">
              {messages.slice(-15).map((message, index) => (
                <Card
                  key={`${message.timestamp}-${index}`}
                  className="terminal-message-card"
                >
                  <CardBody className="terminal-message-body">
                    <div className="terminal-message-content">
                      <span className="terminal-message-icon">
                        {getMessageIcon(message.type)}
                      </span>
                      <div className="terminal-message-details">
                        <div className="terminal-message-meta">
                          <Chip size="sm" color={getStatusColor(message.type)}>
                            {message.type}
                          </Chip>
                          <span className="terminal-message-time">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="terminal-message-text">
                          {message.text || message.message}
                        </p>
                        {message.cfg && (
                          <div className="terminal-config-info">
                            <span className="terminal-config-label">
                              Config keys:{" "}
                            </span>
                            {Object.keys(message.cfg).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <div className="terminal-empty">
              <div className="terminal-empty-icon">📟</div>
              <p className="terminal-empty-text">No messages yet</p>
              <p className="terminal-empty-subtext">
                Start typing a command below
              </p>
            </div>
          )}
        </div>
      )}

      <div className="terminal-input-container">
        {options.length > 0 && (
          <div className="terminal-options">
            {options.map((option, index) => (
              <Chip
                key={index}
                size="sm"
                variant="flat"
                className="terminal-option-chip"
                onPress={() => updateInputValue(option)}
              >
                {option}
              </Chip>
            ))}
          </div>
        )}

        <div className="terminal-input-row">
          <div className="terminal-status">
            <div
              className={`terminal-status-dot ${
                isConnected ? "online" : "offline"
              }`}
            />
            <span className="terminal-status-label">
              {isConnected ? "Ready" : "Offline"}
            </span>
          </div>

          <div className="terminal-input-section">
            <span className="terminal-prompt">$</span>
            <Input
              placeholder={
                isConnected
                  ? "Enter command..."
                  : "Disconnected - waiting for connection..."
              }
              value={inputValue}
              onValueChange={updateInputValue}
              onKeyPress={handleKeyPress}
              disabled={!isConnected}
              variant="bordered"
              size="sm"
              className="terminal-input"
            />
          </div>

          <Button
            color="primary"
            size="sm"
            onPress={onSubmit}
            disabled={!isConnected || !inputValue.trim()}
          >
            Send
          </Button>

          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse terminal" : "Expand terminal"}
          >
            {isExpanded ? "▼" : "▲"}
          </Button>
        </div>

        {error && (
          <div className="terminal-error">
            <Card>
              <CardBody className="terminal-error-body">
                <span className="terminal-error-icon">⚠️</span>
                <p className="terminal-error-text">
                  {error.message || "Unknown Error"}
                </p>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
