// Buttons
import React from "react";

export const CustomButton = ({ children, onPress, isIconOnly, color, variant = "solid", size, disabled, className = "", ...props }) => {
  const baseClasses = "font-semibold transition-all duration-200 outline-none cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed";

  let sizeClasses = size === "lg" ? "px-6 py-3 text-base" : "px-4 py-2 text-sm";
  let variantClasses = "";
  let roundedClasses = "rounded-lg";

  if (isIconOnly) {
    sizeClasses = "p-2";
    roundedClasses = "rounded-full";
  }

  if (variant === "solid" && color === "primary") {
    variantClasses = "bg-blue-600 text-white hover:bg-blue-700 shadow-sm";
  } else if (variant === "light") {
    variantClasses = "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";
  } else if (variant === "ghost") {
    variantClasses = "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100";
  }

  return (
    <button
      onClick={onPress}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${roundedClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Inputs
export const CustomInput = ({ value, onValueChange, placeholder, type = "text", startContent, label, labelPlacement, disabled, className = "", ...props }) => {
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && labelPlacement === "outside" && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      )}
      <div className="flex items-center border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg transition-colors duration-200 p-0.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {startContent && <span className="pl-2 text-slate-500">{startContent}</span>}
        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 p-2 border-none bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
          {...props}
        />
      </div>
    </div>
  );
};