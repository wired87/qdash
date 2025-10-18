import React, { useState } from "react";
import ConfigAccordion from "./accordeon";
import {Button, Input} from "@heroui/react";

// Buttons
const CustomButton = ({ children, onPress, isIconOnly, color, variant = "solid", size, disabled, ...props }) => {
  const baseStyle = {
    fontWeight: 600,
    transition: "all 0.2s",
    borderRadius: "8px",
    outline: "none",
    padding: size === "lg" ? "12px 24px" : "8px 16px",
    fontSize: size === "lg" ? "1rem" : "0.875rem",
    cursor: "pointer",
    border: "none",
    opacity: disabled ? 0.6 : 1
  };

  if (isIconOnly) {
    baseStyle.padding = "8px";
    baseStyle.borderRadius = "50%";
  }

  if (variant === "solid" && color === "primary") {
    baseStyle.backgroundColor = "#2563eb"; // blue-600
    baseStyle.color = "#fff";
  } else if (variant === "light") {
    baseStyle.background = "transparent";
    baseStyle.color = "#333";
  }

  return (
    <button onClick={onPress} style={baseStyle} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

// Inputs
const CustomInput = ({ value, onValueChange, placeholder, type = "text", startContent, label, labelPlacement, disabled, ...props }) => {
  const wrapperStyle = {
    display: "flex",
    alignItems: "center",
    border: "1px solid #ccc",
    background: "#fff",
    borderRadius: "8px",
    transition: "border 0.2s",
    padding: "2px 4px",
  };

  const inputStyle = {
    flex: 1,
    padding: "8px",
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "0.875rem",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
      {label && labelPlacement === "outside" && (
        <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>{label}</label>
      )}
      <div style={wrapperStyle}>
        {startContent && <span style={{ paddingRight: "4px" }}>{startContent}</span>}
        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
          {...props}
        />
      </div>
    </div>
  );
};

// Main component
const WorldCfgCreator = ({ sendMessage, isOpen, onToggle }) => {
  //const [openPixelId, setOpenPixelId] = useState("world");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [inputMessage, setInputMessage] = useState("");

  const onConfirm = () => {
    if (inputMessage.trim()) {
      setInputMessage("");
      setIsDirty(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      height: "100vh",
      width: "400px",
      background: "#f9fafb",
      display: "flex",
      flexDirection: "column",
      padding: "16px",
      fontFamily: "sans-serif"
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: "16px", borderBottom: "1px solid #ddd" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
            Configuration
          </h2>
        </div>
        <Button isIconOnly variant="light" onPress={onToggle}>
        ✕
        </Button>

        <Input
          placeholder="Search configurations..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <Input
          placeholder="Enter message..."
          value={inputMessage}
          onValueChange={setInputMessage}
          label="Configuration Message"
          labelPlacement="outside"
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <ConfigAccordion sendMessage={sendMessage} />
      </div>
    </div>
  );
};
export default WorldCfgCreator;

