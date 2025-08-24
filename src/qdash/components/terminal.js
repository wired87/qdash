import React from 'react';
import { Chip } from "@heroui/react";

// Farben für ein konsistentes Aussehen
const COLORS = {
  background: "#131314",
  panelBg: "#1e1f20",
  containerBg: "#2d2e30",
  accent: "#89b1f7",
  text: "#e3e3e3",
  textSecondary: "#bdc1c6",
  border: "#444746",
};

/**
 * Eine eigenständige Terminal-Konsole mit Optionen im Kopfbereich.
 *
 * @param {object} props - Die Props der Komponente.
 * @param {string} props.error - Eine Fehlermeldung, falls vorhanden.
 * @param {string} props.statusClass - CSS-Klasse für den Verbindungsstatus.
 * @param {function} props.handleSubmit - Handler für das Absenden des Formulars.
 * @param {boolean} props.isConnected - Zeigt an, ob eine Verbindung besteht.
 * @param {string} props.inputValue - Der aktuelle Wert des Eingabefeldes.
 * @param {function} props.updateInputValue - Funktion zum Aktualisieren des Eingabewertes.
 * @param {function} props.updateParam - Callback-Funktion zum Setzen von Parametern (z.B. durch Klick auf Optionen).
 * @param {Array<{label: string, value: string}>} props.options - Eine Liste von Objekten für die klickbaren Chips im Kopfbereich.
 */
export default function TerminalConsole({
  error,
  statusClass,
  handleSubmit,
  isConnected,
  inputValue,
  updateInputValue,
  updateParam,
  options = []
}) {
  const statusEmoji = isConnected ? "✔" : "✖";

  return (
    <div
      className="terminal-container p-4 flex flex-col h-full" // Fülle die Höhe aus
      style={{
        backgroundColor: COLORS.panelBg,
        borderTop: `1px solid ${COLORS.border}`,
      }}
    >
      {/* Kopfbereich mit klickbaren Optionen (Chips) */}
      <div className="flex flex-wrap gap-2 mb-4">
        {options.map((option) => (
          <Chip
            key={option.value}
            variant="solid"
            color="primary"
            onClick={() => updateParam('selectedTerminalOption', option.value)}
            className="cursor-pointer"
            size="sm"
          >
            {option.label}
          </Chip>
        ))}
      </div>

      {/* Terminal-Ausgabe */}
      <div className="terminal-output text-sm mb-2">
        <p className="mb-0">
          <span className="info-label text-gray-400">Connection: </span>
          <span className={statusClass}>
            {isConnected ? "Established" : "Disconnected"} {statusEmoji}
          </span>
        </p>
        {error && (
          <p className="error-message text-red-400 mt-1">
            Error: {error.message || "Unknown Error"}
          </p>
        )}
      </div>

      {/* Terminal-Eingabefeld */}
      <form onSubmit={handleSubmit} className="input-line flex items-center mt-auto">
        <span
          className="text-blue-400 mr-2 whitespace-nowrap"
        >
          [client.email()] ~ $
        </span>
        <input
          type="text"
          className="flex-1 bg-transparent border-none text-white text-sm outline-none"
          value={inputValue}
          onChange={(e) => updateInputValue(e.target.value)}
          placeholder="Enter command..."
          disabled={!isConnected}
        />
      </form>
    </div>
  );
}
