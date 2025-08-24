import React, { useState, useEffect } from 'react';

// CsvComponent - Eine Komponente zur Darstellung von CSV-ähnlichen Daten in einer Tabelle.
// Diese Komponente wird die extrahierten Daten oder die formatierten Nodes/Edges anzeigen.
const CsvComponent = ({ data }) => {
  // Stellen Sie sicher, dass 'data' nicht null oder leer ist und die richtige Struktur hat.
  if (!data || data.length === 0 || !Array.isArray(data[0])) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-400">Keine CSV-Daten verfügbar.</p>
      </div>
    );
  }

  // Die erste Zeile der Daten wird als Header verwendet.
  const headers = data[0];
  // Die restlichen Zeilen sind die eigentlichen Daten.
  const rows = data.slice(1);

  // Platzhalter für die Download-Funktion (kann später implementiert werden)
  const handleDownloadCSV = () => {
    alert("CSV Download Funktion noch nicht implementiert.");
  };

  return (
    <div className="csv-container p-4 bg-gray-700 rounded-lg shadow-inner">
      <h2 className="csv-heading text-lg font-semibold mb-3 text-white">Extrahierten Daten (CSV)</h2>
      <div className="table-wrapper overflow-auto max-h-96 rounded-md">
        <table className="csv-table w-full text-sm text-gray-200 border-collapse">
          <thead className="csv-table-head bg-gray-800 sticky top-0">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="csv-table-th p-2 text-left border-b border-gray-600">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="csv-table-tr even:bg-gray-750 odd:bg-gray-700">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="csv-table-td p-2 border-t border-gray-600">
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={handleDownloadCSV}
        className="download-btn mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md"
      >
        CSV herunterladen
      </button>
    </div>
  );
};

// Haupt-App-Komponente
const App = ({nodes, edges, logs}) => {
  // State für den aktiven Tab: 'logs' oder 'data'
  const [activeTab, setActiveTab] = useState('data');
  // State für die Node-ID, deren Logs aktuell angezeigt werden
  const [activeNodeForLogs, setActiveNodeForLogs] = useState(null);

  // Funktion zur Formatierung der Nodes und Edges in ein CSV-kompatibles Format.
  // Es wird ein Array von Arrays zurückgegeben, wobei das erste Array die Header enthält.
  const formatDataForCsv = (nodes, edges) => {
    const defaultColumnHeaders = [
      'ID', 'Name', 'Typ', 'IP / Quelle', 'Ziel', 'Protokoll', 'Status',
      // Diese Spalten könnten für komplexere Daten wie Rechnungsdaten genutzt werden,
      // werden hier aber für die Nodes/Edges-Daten mit leeren Werten gefüllt oder ignoriert.
      'Rechnungsnummer', 'Rechnungsdatum', 'Lieferant', 'Gesamtbetrag', 'Währung',
      'Steuerbetrag', 'Umsatzsteuer-ID Lieferant', 'Umsatzsteuer-ID Kunde',
      'Postenbezeichnung', 'Menge', 'Einzelpreis', 'Posten-Gesamtbetrag'
    ];

    const dataRows = [];

    // Hinzufügen der Node-Daten
    nodes.forEach(node => {
      dataRows.push([
        node.id,
        node.name,
        node.type,
        node.ip,
        '', // Ziel ist leer für Nodes
        '', // Protokoll ist leer für Nodes
        '', // Status ist leer für Nodes
        '', '', '', '', '', '', '', '', '', '', '', '' // Leere Spalten für Rechnungsdaten
      ]);
    });

    // Hinzufügen der Edge-Daten
    edges.forEach(edge => {
      dataRows.push([
        edge.id,
        '', // Name ist leer für Edges
        'Edge', // Typ ist 'Edge'
        edge.source, // Quelle für Edges
        edge.target, // Ziel für Edges
        edge.protocol,
        edge.status,
        '', '', '', '', '', '', '', '', '', '', '', '' // Leere Spalten für Rechnungsdaten
      ]);
    });

    // Rückgabe der Header und der Datenzeilen
    return [defaultColumnHeaders, ...dataRows];
  };

  // Formatierte Daten für die CsvComponent
  const formattedData = formatDataForCsv(nodes, edges);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-8">System-Übersicht</h1>

      {/* Slider/Tab-Navigation */}
      <div className="flex bg-gray-800 rounded-lg p-1 mb-8 shadow-lg">
        <button
          onClick={() => setActiveTab('data')}
          className={`px-6 py-3 rounded-md text-lg font-medium transition-colors duration-300 ${
            activeTab === 'data' ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-gray-300 hover:bg-gray-700'
          }`}
        >
          Data
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-3 rounded-md text-lg font-medium transition-colors duration-300 ${
            activeTab === 'logs' ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-gray-300 hover:bg-gray-700'
          }`}
        >
          Logs
        </button>
      </div>

      {/* Inhaltsbereich basierend auf dem aktiven Tab */}
      <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-lg shadow-xl">
        {activeTab === 'data' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-white">Daten-Ansicht</h2>
            {/* Überprüfen, ob formatierte Daten zum Rendern vorhanden sind */}
            {formattedData.length > 1 ? ( // Mehr als nur Header-Zeile bedeutet, es gibt Daten
              <CsvComponent data={formattedData} />
            ) : (
              <div className="flex justify-center items-center h-48 bg-gray-700 rounded-md">
                <p className="text-gray-400 text-lg">Keine Daten verfügbar.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-white">Log-Ansicht</h2>
            <div className="space-y-3">
              {nodes.map(node => (
                <div key={node.id} className="bg-gray-700 rounded-md overflow-hidden shadow-md">
                  <button
                    onClick={() => setActiveNodeForLogs(activeNodeForLogs === node.id ? null : node.id)}
                    className="w-full text-left p-4 flex justify-between items-center text-lg font-medium text-white hover:bg-gray-600 transition-colors duration-200 focus:outline-none"
                  >
                    <span>Node ID: {node.id}</span>
                    <span className="text-gray-400">
                      {activeNodeForLogs === node.id ? '▲' : '▼'}
                    </span>
                  </button>
                  {activeNodeForLogs === node.id && (
                    <div className="p-4 border-t border-gray-600 bg-gray-750">
                      {logs[node.id] ? (
                        <div className="space-y-4">
                          {/* Fehler-Logs */}
                          <div>
                            <h3 className="text-md font-semibold mb-2 text-red-400">Error Logs ({logs[node.id].err.length})</h3>
                            {logs[node.id].err.length > 0 ? (
                              <ul className="list-disc list-inside text-sm text-red-300">
                                {logs[node.id].err.map((logEntry, index) => (
                                  <li key={index}>{logEntry}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-400 text-sm">Keine Fehler-Logs vorhanden.</p>
                            )}
                          </div>
                          {/* Output-Logs */}
                          <div>
                            <h3 className="text-md font-semibold mb-2 text-green-400">Output Logs ({logs[node.id].out.length})</h3>
                            {logs[node.id].out.length > 0 ? (
                              <ul className="list-disc list-inside text-sm text-green-300">
                                {logs[node.id].out.map((logEntry, index) => (
                                  <li key={index}>{logEntry}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-400 text-sm">Keine Output-Logs vorhanden.</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">Keine Log-Daten für diese Node verfügbar.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {nodes.length === 0 && (
                <div className="flex justify-center items-center h-48 bg-gray-700 rounded-md">
                    <p className="text-gray-400 text-lg">Keine Nodes zum Anzeigen von Logs vorhanden.</p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
