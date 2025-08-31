import React, { useState, useCallback, useEffect } from "react";
import "../../index.css";

/**
 * Configuration Creator Sidebar Component with Custom CSS
 */
export const CfgCreator = ({ cfg_content, sendMessage, isOpen, onToggle }) => {
  const [cfg, setCfg] = useState(
    cfg_content || {
      pixel_id_alpha: {
        fermion_sub_A: {
          max_value: 100.5,
          phase: [{ id: "p1", iterations: 5, max_val_multiplier: 1.2 }],
        },
        fermion_sub_B: {
          max_value: 250,
          phase: [{ id: "p2", iterations: 10, max_val_multiplier: 1.5 }],
        },
      },
      pixel_id_beta: {
        fermion_sub_X: {
          max_value: 75,
          phase: [],
        },
        fermion_sub_Y: {
          max_value: "custom_string",
          phase: [],
        },
      },
      pixel_id_gamma: {
        fermion_sub_omega: {
          max_value: 300,
          phase: [{ id: "p3", iterations: 3, max_val_multiplier: 0.8 }],
        },
      },
    }
  );

  const [openPixelId, setOpenPixelId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (cfg_content && Object.keys(cfg_content).length !== 0) {
      setCfg(cfg_content);
      setIsDirty(false);
    }
  }, [cfg_content]);

  const handleValueChange = useCallback((pixelId, sid, newValue) => {
    setCfg((prevCfg) => {
      const updatedCfg = { ...prevCfg };
      if (updatedCfg[pixelId] && updatedCfg[pixelId][sid]) {
        updatedCfg[pixelId] = {
          ...updatedCfg[pixelId],
          [sid]: {
            ...updatedCfg[pixelId][sid],
            max_value: isNaN(parseFloat(newValue))
              ? newValue
              : parseFloat(newValue),
          },
        };
      }
      setIsDirty(true);
      return updatedCfg;
    });
  }, []);

  const toggleAccordion = useCallback((pixelId) => {
    setOpenPixelId((prevId) => (prevId === pixelId ? null : pixelId));
  }, []);

  const onConfirm = useCallback(() => {
    sendMessage({
      type: "cfg_file",
      cfg: cfg,
      timestamp: new Date().toISOString(),
    });
    setIsDirty(false);
  }, [cfg, sendMessage]);

  const resetChanges = useCallback(() => {
    setCfg(cfg_content || {});
    setIsDirty(false);
  }, [cfg_content]);

  // Filter configurations based on search query
  const filteredCfg = React.useMemo(() => {
    if (!searchQuery.trim()) return cfg;

    const filtered = {};
    Object.entries(cfg).forEach(([pixelId, sids]) => {
      if (
        pixelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Object.keys(sids).some((sid) =>
          sid.toLowerCase().includes(searchQuery.toLowerCase())
        )
      ) {
        filtered[pixelId] = sids;
      }
    });
    return filtered;
  }, [cfg, searchQuery]);

  const getValueType = (value) => {
    if (typeof value === "string" && isNaN(parseFloat(value))) return "string";
    if (typeof value === "number" || !isNaN(parseFloat(value))) return "number";
    return "text";
  };

  const getPhaseCount = (phase) => {
    return Array.isArray(phase) ? phase.length : 0;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="cfg-overlay" onClick={onToggle} />}

      {/* Sidebar */}
      <div className={`cfg-sidebar ${isOpen ? "open" : "closed"}`}>
        {/* Header */}
        <div className="cfg-header">
          <div className="cfg-header-content">
            <div className="cfg-header-info">
              <div className="cfg-icon-container">
                <div className="cfg-icon">
                  <svg
                    className="cfg-icon-svg"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                    />
                  </svg>
                </div>
                {isDirty && <div className="cfg-dirty-indicator"></div>}
              </div>
              <div className="cfg-header-text">
                <h2 className="cfg-title">Configuration</h2>
                <p className="cfg-subtitle">
                  {Object.keys(filteredCfg).length} items
                </p>
              </div>
            </div>
            <button onClick={onToggle} className="cfg-close-btn">
              <svg
                className="cfg-close-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="cfg-search-container">
            <div className="cfg-search-wrapper">
              <svg
                className="cfg-search-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                className="cfg-search-input"
                placeholder="Search configurations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="cfg-content">
          {cfg && Object.keys(filteredCfg).length > 0 ? (
            Object.entries(filteredCfg).map(([pixelId, sids]) => (
              <div key={pixelId} className="cfg-item">
                <button
                  className="cfg-item-header"
                  onClick={() => toggleAccordion(pixelId)}
                >
                  <div className="cfg-item-info">
                    <div className="cfg-item-dot"></div>
                    <div className="cfg-item-text">
                      <span className="cfg-item-name">{pixelId}</span>
                      <div className="cfg-item-count">
                        {Object.keys(sids).length} configurations
                      </div>
                    </div>
                  </div>
                  <div className="cfg-item-meta">
                    <div className="cfg-phases-badge">
                      {Object.values(sids).reduce(
                        (total, sid) => total + getPhaseCount(sid.phase),
                        0
                      )}{" "}
                      phases
                    </div>
                    <svg
                      className={`cfg-chevron ${
                        openPixelId === pixelId ? "rotated" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {openPixelId === pixelId && (
                  <div className="cfg-item-content">
                    <div className="cfg-item-body">
                      {sids && Object.keys(sids).length > 0 ? (
                        Object.entries(sids).map(([sid, attrs]) => (
                          <div key={sid} className="cfg-field">
                            <div className="cfg-field-header">
                              <div className="cfg-field-info">
                                <div
                                  className={`cfg-field-dot ${
                                    getValueType(attrs.max_value) === "number"
                                      ? "number"
                                      : "string"
                                  }`}
                                ></div>
                                <label className="cfg-field-label">{sid}</label>
                              </div>
                              <div className="cfg-field-badges">
                                <span className="cfg-type-badge">
                                  {getValueType(attrs.max_value)}
                                </span>
                                {getPhaseCount(attrs.phase) > 0 && (
                                  <span className="cfg-phase-badge">
                                    {getPhaseCount(attrs.phase)} phases
                                  </span>
                                )}
                              </div>
                            </div>
                            <input
                              type={
                                getValueType(attrs.max_value) === "number"
                                  ? "number"
                                  : "text"
                              }
                              value={attrs.max_value}
                              onChange={(e) =>
                                handleValueChange(pixelId, sid, e.target.value)
                              }
                              className="cfg-field-input"
                              placeholder={`Enter ${getValueType(
                                attrs.max_value
                              )} value...`}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="cfg-no-entries">
                          <div className="cfg-no-entries-icon">
                            <svg
                              className="cfg-no-entries-svg"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                              />
                            </svg>
                          </div>
                          <p className="cfg-no-entries-text">
                            No SID entries available
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="cfg-empty-state">
              <div className="cfg-empty-icon">
                <svg
                  className="cfg-empty-svg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
              </div>
              <h3 className="cfg-empty-title">No Configuration Data</h3>
              <p className="cfg-empty-text">
                {searchQuery
                  ? `No configurations match "${searchQuery}"`
                  : "No configuration data available"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="cfg-clear-search"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="cfg-footer">
          {isDirty && (
            <div className="cfg-unsaved-warning">
              <div className="cfg-warning-content">
                <div className="cfg-warning-dot"></div>
                <span className="cfg-warning-text">Unsaved changes</span>
              </div>
              <button onClick={resetChanges} className="cfg-reset-btn">
                Reset
              </button>
            </div>
          )}

          <button
            onClick={onConfirm}
            disabled={!isDirty}
            className={`cfg-apply-btn ${isDirty ? "active" : "disabled"}`}
          >
            {isDirty ? "Apply Configuration" : "No Changes"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CfgCreator;
