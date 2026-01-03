import React, { useEffect, useRef } from 'react';

const FlyingMessages = ({ messages, isVisible }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isVisible) {
    return null;
  }

  const getMessageIcon = (type) => {
    switch (type) {
      case "user": return "👤";
      case "gemini": return "✨";
      default: return "ℹ️";
    }
  };

  return (
    <div 
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        height: '300px',
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column-reverse',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <div ref={messagesEndRef} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ color: '#9ca3af' }}>{getMessageIcon(msg.type)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#e5e7eb', fontWeight: 'bold' }}>{msg.type}</span>
                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p style={{ color: '#d1d5db', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlyingMessages;
