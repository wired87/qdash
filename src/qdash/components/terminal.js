import React, { useState, useCallback, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { useFile } from "../../hooks/useFile";
import { Camera, X, Paperclip } from "lucide-react";


const CustomChip = ({ children, color, size, className = "", onPress }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-150";
  const cursorClass = onPress ? "cursor-pointer hover:bg-gray-700" : "cursor-default";

  const sizeClasses = size === 'sm'
    ? "px-2 py-0.5 text-xs"
    : "px-3 py-1 text-sm";

  let colorClasses = "bg-gray-900/50 text-gray-300 border border-gray-700";

  if (color === 'primary') colorClasses = "bg-blue-50 text-blue-600 border border-blue-200";
  else if (color === 'danger') colorClasses = "bg-red-50 text-red-600 border border-red-200";
  else if (color === 'warning') colorClasses = "bg-amber-50 text-amber-600 border border-amber-200";
  else if (color === 'success') colorClasses = "bg-emerald-50 text-emerald-600 border border-emerald-200";
  else if (color === 'secondary') colorClasses = "bg-slate-100 text-slate-600 border border-slate-200";
  else if (color === 'default') colorClasses = "bg-slate-50 text-slate-500 border border-slate-200";

  return (
    <span
      onClick={onPress}
      className={`${baseClasses} ${sizeClasses} ${colorClasses} ${cursorClass} ${className}`}
    >
      {children}
    </span>
  );
};

const CustomButton = ({ children, onPress, isIconOnly, className = "", title, type = "button" }) => {
  const baseClasses = "rounded-lg font-semibold transition-all duration-200 outline-none focus:outline-none cursor-pointer flex-shrink-0";

  const sizeClasses = isIconOnly
    ? "p-2 h-8 w-8 text-lg flex items-center justify-center"
    : "px-3 py-1.5 text-sm h-8";

  // Neon Button Styles
  const defaultColorClasses = "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-blue-600 shadow-sm";

  const iconButtonClasses = isIconOnly
    ? "bg-transparent text-slate-500 border border-transparent hover:text-blue-600 hover:bg-slate-100"
    : defaultColorClasses;

  // If className overrides colors, we should be careful, but Tailwind handles specificity usually by order or !important. 
  // Here we assume className might add margins or specific overrides.

  // If it's an icon button, we don't want the default green background unless specified.
  const finalClasses = isIconOnly ? iconButtonClasses : defaultColorClasses;

  return (
    <button
      onClick={onPress}
      title={title}
      type={type}
      className={`${baseClasses} ${sizeClasses} ${finalClasses} ${className}`}
    >
      {children}
    </button>
  );
};

const CustomInput = ({ placeholder, value, onValueChange, className = "" }) => {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        if (typeof onValueChange === 'function') {
          onValueChange(e.target.value);
        }
      }}
      className={`w-full bg-transparent outline-none text-base font-mono p-0 m-0 border-none text-slate-900 placeholder-slate-400 ${className}`}
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
  toggleLogSidebar,
  toggleClusterModal,
  toggleInjection,
  toggleBilling,
  saveMessage,
  setMessages,
  fbIsConnected = true, // Default to true to avoid flashing if not passed
  messages,
  options = [],
  isVisible = true,
  userProfile,
  isVoiceActive,
  setIsVoiceActive,
  toggleModuleDesigner,
  toggleFieldDesigner,
  toggleSessionConfig,
  toggleParamConfig
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Listen for external camera trigger
  useEffect(() => {
    if (window.externalAction === "open_camera") {
      setIsCameraOpen(true);
      window.externalAction = null; // Reset
    }
  }, [messages]);

  const {
    files,
    loading,
    fileInputRef,
    handleDrop,
    handleFileSelect,
    handleDragOver,
    handleRemoveFile,
    clearFiles,
  } = useFile();

  // Better approach: MainApp passes a prop. But for now let's add a manual trigger button.

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      // Convert data URL to File object
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
          const mockEvent = { target: { files: [file] } };
          handleFileSelect(mockEvent);
          setIsCameraOpen(false);
        });
    }
  }, [webcamRef, handleFileSelect]);

  const openUpgradeModal = () => {
    // In real app, call backend to get stripe URL
    window.open("https://example.com/upgrade", "_blank");
  };

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isExpanded]);

  const actionButtons = [
    { name: "Session Cfg", case: "session_cfg" },
    { name: "Env Cfg", case: "set_config" },
    { name: "Modules 🧩", case: "module" },
    { name: "Fields 📊", case: "fields_manager" },
    { name: "Injection ⚡", case: "injection" },
    { name: "Param Cfg", case: "param_cfg" },
  ];

  const handleAction = useCallback((actionCase) => {
    if (actionCase === "set_config") toggleCfgSlider();
    else if (actionCase === "session_cfg") toggleSessionConfig();
    else if (actionCase === "watch_data") toggleDataSlider();
    else if (actionCase === "upload_files") toggleBucket();
    else if (actionCase === "upload_ncfg") toggleNcfgSlider();
    else if (actionCase === "show_logs") toggleLogSidebar();
    else if (actionCase === "show_cluster") toggleClusterModal();
    else if (actionCase === "injection") toggleInjection();
    else if (actionCase === "module") toggleModuleDesigner();
    else if (actionCase === "fields_manager") toggleFieldDesigner();
    else if (actionCase === "param_cfg") toggleParamConfig();
    else if (actionCase === "change_plan" || actionCase === "view_billing" || actionCase === "upgrade_plan") toggleBilling();
    else if (actionCase === "get_billings") {
      // Fetch billing history via terminal command
      updateInputValue("get_billings");
    }
    else updateInputValue(`${actionCase}`);
  }, [updateInputValue, toggleDashboard, toggleDataSlider, toggleCfgSlider, toggleBucket, toggleNcfgSlider, toggleLogSidebar, toggleClusterModal, toggleInjection, toggleBilling]);

  const get_env_len = useCallback((_case) => {
    return null;
  }, [envs]);

  const getMessageIcon = (type) => {
    switch (type) {
      case "user": return "👤";
      case "gemini": return "✨";
      case "system": return "⚙️";
      default: return "ℹ️";
    }
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl 
        bg-white text-slate-800 rounded-lg z-50 
        transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] font-mono border border-slate-200
        shadow-2xl
        ${isVisible ? 'translate-y-0' : 'translate-y-[120%]'}
        ${isDragging ? 'bg-slate-50 border-blue-400 ring-2 ring-blue-200' : 'bg-white'}
      `}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsDragging(false);
        }
      }}
      onDragOver={handleDragOver}
      onDrop={(e) => {
        handleDrop(e);
        setIsDragging(false);
      }}
    >
      {/* Drag & Drop Overlay Layer - Explicitly covering everything if dragging, though the container handles it */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-100/90 rounded-lg pointer-events-none backdrop-blur-sm border-2 border-dashed border-blue-400">
          <p className="text-2xl font-bold text-blue-600 animate-pulse">Drop files here</p>
        </div>
      )}

      {/* WebSocket Connection Loading Overlay */}
      {/* WebSocket Connection Loading Overlay - Removed per request */}
      {/* {!isConnected && null} - removed entirely */}

      {/* Camera Modal Overlay */}
      {/* Small Floating Camera Preview */}
      {isCameraOpen && (
        <div className="absolute bottom-20 right-6 z-[60] w-64 bg-black rounded-xl border border-slate-600 shadow-2xl overflow-hidden">
          <div className="relative">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-auto object-cover"
            />

            {/* Overlay Controls */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-4 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <button
                onClick={capturePhoto}
                className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50 transition-colors shadow-lg"
                title="Capture"
              >
                <Camera size={20} />
              </button>
              <button
                onClick={() => setIsCameraOpen(false)}
                className="p-2 bg-red-500/80 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`overflow-hidden transition-[height] duration-300 ease-in-out ${isExpanded ? 'h-96' : 'h-0'}`}
      >
        <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10 text-[10px] uppercase text-slate-500 font-bold tracking-[0.2em] border-b border-slate-200 shadow-sm">
              <tr>
                <th className="p-3 w-24">Time</th>
                <th className="p-3 w-28">Entity</th>
                <th className="p-3">Data Stream</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono">
              {messages.map((msg, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors border-b border-slate-100 group">
                  <td className="p-3 text-slate-500 whitespace-nowrap align-top group-hover:text-blue-600 transition-colors">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="p-3 align-top">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide border
                      ${msg.type === 'user' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        msg.type === 'gemini' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                          msg.type === 'system' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                            'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {getMessageIcon(msg.type)} {msg.type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 whitespace-pre-wrap align-top leading-relaxed">
                    {msg.text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
          {actionButtons.map((btn) => (
            <CustomButton
              key={btn.case}
              onPress={() => handleAction(btn.case)}
              className="bg-slate-50 text-slate-600 border border-slate-200 hover:bg-white hover:text-blue-600 hover:shadow-md flex-1 min-w-fit transition-all duration-300"
            >
              {btn.name} {get_env_len(btn.case)}
            </CustomButton>
          ))}
        </div>

        {options.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-slate-500 self-center mr-1 font-bold uppercase tracking-wider">Signals:</span>
            {options.map((option, index) => (
              <CustomChip
                key={index}
                size="sm"
                color="default"
                onPress={() => updateInputValue(option)}
                className="cursor-pointer hover:bg-gray-700 hover:text-gray-300"
              >
                {option}
              </CustomChip>
            ))}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(files); clearFiles(); }} className="flex items-center gap-3">
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* WS Status */}
            <div className="flex items-center gap-1.5" title="WebSocket Connection">
              <div
                className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="text-xs text-slate-500 font-bold tracking-wider uppercase">
                {isConnected ? "ONLINE" : "OFFLINE"}
              </span>
            </div>

            {/* System Status */}
            <div className="flex items-center gap-1.5" title="System Connection">
              {!fbIsConnected ? (
                <>
                  <div className="w-1.5 h-1.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-500 font-bold tracking-wider uppercase animate-pulse">SYNC...</span>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-xs text-slate-500 font-bold tracking-wider uppercase">NET</span>
                </>
              )}
            </div>

            {/* Voice Status */}
            <div
              className={`flex items-center gap-1.5 cursor-pointer transition-all px-2 py-0.5 rounded ${isVoiceActive ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'hover:bg-slate-100 text-slate-500'}`}
              title="Toggle Voice Control (Natural Language Shortcuts)"
              onClick={() => setIsVoiceActive(!isVoiceActive)}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isVoiceActive ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-xs font-bold tracking-wider uppercase">
                {isVoiceActive ? "MIC ON" : "MIC OFF"}
              </span>
            </div>
          </div>

          <div className="flex items-center flex-grow bg-slate-50 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 rounded p-2 transition-all">
            <span className="text-slate-400 font-bold text-lg pr-2 flex-shrink-0">$</span>
            <CustomInput
              placeholder={isConnected ? "Query system..." : "Connection lost"}
              value={inputValue}
              onValueChange={updateInputValue}
              className="flex-grow text-slate-900 placeholder-slate-400"
            />
            {/* Camera Button inside input container */}
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="text-slate-400 hover:text-blue-600 transition-all ml-2"
              title="Activate Visual Input"
            >
              <Camera size={18} />
            </button>
            {/* File Upload Button */}
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              id="terminal-file-upload"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-slate-400 hover:text-blue-600 transition-all ml-2"
              title="Attach Files"
            >
              <Paperclip size={18} />
            </button>
          </div>

          <CustomButton type="submit" className="flex-shrink-0">
            Send
          </CustomButton>

          <CustomButton
            isIconOnly
            onPress={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse" : "Expand"}
            className="text-slate-500 border border-transparent bg-transparent hover:bg-slate-100 hover:text-blue-600 flex-shrink-0 shadow-none"
          >
            <span className={`text-xs transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
              ▲
            </span>
          </CustomButton>
        </form>

        {
          files.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <CustomChip
                    key={index}
                    size="sm"
                    color="secondary"
                    className="pr-1"
                  >
                    {file.name}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveFile(index); }}
                      className="ml-2 text-red-400 hover:text-red-300 focus:outline-none"
                    >
                      &times;
                    </button>
                  </CustomChip>
                ))}
              </div>
            </div>
          )
        }

        {
          error && (
            <div className="mt-3">
              <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-lg p-3 flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <p className="text-sm font-semibold">
                  Error: {error.message || "Unknown Error"}
                </p>
              </div>
            </div>
          )
        }
      </div >
    </div >
  );
};

export default TerminalConsole;

