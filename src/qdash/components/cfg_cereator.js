import React, { useState, useCallback, useEffect } from "react";
import { Button, Input, Card, CardBody, Chip } from "@heroui/react";
import "../../index.css";

export const CfgCreator = ({ cfg_content, sendMessage, isOpen, onToggle }) => {
  const [cfg, setCfg] = useState(cfg_content || {});
  const [openPixelId, setOpenPixelId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [inputMessage, setInputMessage] = useState("");

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
    if (inputMessage.trim()) {
      sendMessage({
        type: "cfg_file",
        cfg: cfg,
        message: inputMessage,
        timestamp: new Date().toISOString(),
      });
      setInputMessage("");
      setIsDirty(false);
    }
  }, [cfg, inputMessage, sendMessage]);

  const resetChanges = useCallback(() => {
    setCfg(cfg_content || {});
    setIsDirty(false);
  }, [cfg_content]);

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

  if (!isOpen) return null;

  return (
    <>
      <div className="slider-overlay" onClick={onToggle} />
      <div className="cfg-slider-container">
        <div className="cfg-slider-header">
          <div className="cfg-header-top">
            <div className="cfg-title-section">
              <h2 className="cfg-title">Configuration</h2>
              <p className="cfg-subtitle">
                {Object.keys(filteredCfg).length} items
              </p>
            </div>
            <Button isIconOnly variant="light" onPress={onToggle}>
              ✕
            </Button>
          </div>

          <Input
            placeholder="Search configurations..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent="🔍"
            className="cfg-search-input"
          />

          <Input
            placeholder="Enter message to send with config..."
            value={inputMessage}
            onValueChange={setInputMessage}
            className="cfg-message-input"
            label="Configuration Message"
            labelPlacement="outside"
          />

          <Button
            color="primary"
            onPress={onConfirm}
            disabled={!inputMessage.trim()}
            className="cfg-confirm-button"
            size="lg"
          >
            Send Configuration
          </Button>
        </div>

        <div className="cfg-slider-content">
          {Object.entries(filteredCfg).map(([pixelId, sids]) => (
            <Card key={pixelId} className="cfg-pixel-card">
              <CardBody>
                <Button
                  variant="light"
                  className="cfg-accordion-button"
                  onPress={() => toggleAccordion(pixelId)}
                >
                  <div className="cfg-accordion-left">
                    <div className="cfg-pixel-dot" />
                    <span>{pixelId}</span>
                  </div>
                  <span>{openPixelId === pixelId ? "▲" : "▼"}</span>
                </Button>

                {openPixelId === pixelId && (
                  <div className="cfg-accordion-content">
                    {Object.entries(sids).map(([sid, attrs]) => (
                      <div key={sid} className="cfg-fermion-item">
                        <label className="cfg-fermion-label">{sid}</label>
                        <Input
                          type={
                            typeof attrs.max_value === "number"
                              ? "number"
                              : "text"
                          }
                          value={attrs.max_value}
                          onValueChange={(value) =>
                            handleValueChange(pixelId, sid, value)
                          }
                          size="sm"
                        />
                        {attrs.phase && attrs.phase.length > 0 && (
                          <div className="cfg-phase-info">
                            <Chip size="sm" color="secondary">
                              {attrs.phase.length} phases
                            </Chip>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>

        {isDirty && (
          <div className="cfg-slider-footer">
            <div className="cfg-footer-content">
              <span className="cfg-unsaved-text">Unsaved changes</span>
              <Button size="sm" variant="light" onPress={resetChanges}>
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
