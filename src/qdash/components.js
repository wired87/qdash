
// Buttons
import React, {useState} from "react";
import {Button} from "@heroui/react";
import ConfigAccordion from "./components/accordeon";

export const CustomButton = ({ children, onPress, isIconOnly, color, variant = "solid", size, disabled, ...props }) => {
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
export const CustomInput = ({ value, onValueChange, placeholder, type = "text", startContent, label, labelPlacement, disabled, ...props }) => {
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