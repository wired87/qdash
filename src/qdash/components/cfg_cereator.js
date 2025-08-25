import React, {useState, useCallback, useEffect} from 'react';
import "../../index.css"

export const CfgCreator= (
  { cfg_content, sendMessage }
) => {
    // Initialer Mock-Konfigurationszustand. Der Typ ist nun CfgContent.
    const [cfg, setCfg] = useState({
        "pixel_id_alpha": {
            "fermion_sub_A": {
                "max_value": 100.5,
                "phase": [{ id: "p1", iterations: 5, max_val_multiplier: 1.2 }]
            },
            "fermion_sub_B": {
                "max_value": 250,
                "phase": [{ id: "p2", iterations: 10, max_val_multiplier: 1.5 }]
            }
        },
        "pixel_id_beta": {
            "fermion_sub_X": {
                "max_value": 75,
                "phase": []
            },
            "fermion_sub_Y": {
                "max_value": "benutzerdefinierter_string",
                "phase": []
            }
        },
        "pixel_id_gamma": {
            "fermion_sub_omega": {
                "max_value": 300,
                "phase": [{ id: "p3", iterations: 3, max_val_multiplier: 0.8 }]
            }
        }
    });

    useEffect(() => {
        // Sicherstellen, dass cfg_content existiert und nicht leer ist, bevor es gesetzt wird
        if (cfg_content && Object.keys(cfg_content).length !== 0) {
            console.log("Setting cfg from props: ", cfg_content);
            setCfg(cfg_content);
        }
    }, [cfg_content]);

    // Zustand für das aktuell geöffnete Akkordeon-Element. Typ ist string oder null.
    const [openPixelId, setOpenPixelId] = useState(null);

    // Callback-Funktion zur Aktualisierung des 'max_value' für ein spezifisches 'fermion_sub'.
    const handleValueChange = useCallback((pixelId, sid, newValue) => {
        setCfg(prevCfg => {
            // Eine tiefe Kopie für die Unveränderlichkeit des Zustands
            const updatedCfg = { ...prevCfg };
            if (updatedCfg[pixelId] && updatedCfg[pixelId][sid]) {
                updatedCfg[pixelId] = {
                    ...updatedCfg[pixelId],
                    [sid]: {
                        ...updatedCfg[pixelId][sid],
                        max_value: isNaN(parseFloat(newValue)) ? newValue : parseFloat(newValue)
                    }
                };
            }
            return updatedCfg;
        });
    }, []);

    // Callback-Funktion zum Umschalten des Akkordeon-Zustands (Öffnen/Schließen).
    const toggleAccordion = useCallback((pixelId) => {
        setOpenPixelId(prevId => (prevId === pixelId ? null : pixelId));
    }, []);

    // Callback-Funktion für den Bestätigungsbutton.
    const onConfirm = useCallback(() => {
        console.log("Konfiguration bestätigt:", cfg);
    }, [cfg]);

    return (
        // Haupt-Container: Ein Flexbox-Layout, das den Bildschirm füllt.
        // Der linke Bereich ist der Hauptinhalt, der rechte Bereich ist das Konfigurationspanel.
        <div className="flex h-screen bg-gray-50 font-inter">
            {/* Rechtes Seitenpanel für die Konfiguration */}
            <div className="w-96 bg-gray-100 p-6 border-l border-gray-200 shadow-lg flex flex-col h-full overflow-y-auto rounded-r-lg m-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Konfigurationspanel</h2>

                {/* Container für die Akkordeons, scrollbar bei Überlauf */}
                <div className="flex-grow space-y-4 overflow-y-auto pr-3 -mr-3">
                    {/* Überprüfen, ob cfg ein gültiges Objekt ist, bevor Object.entries aufgerufen wird */}
                    {cfg && Object.keys(cfg).length > 0 ? (
                        Object.entries(cfg).map(([pixelId, sids]) => (
                            <div key={pixelId} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out">
                                {/* Akkordeon-Header-Button */}
                                <button
                                    className="flex justify-between items-center w-full p-4 text-left font-semibold text-gray-800 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                    onClick={() => toggleAccordion(pixelId)}
                                >
                                    <span className="text-lg">{pixelId}</span>
                                    {/* Icon für Akkordeon, falls lucide-react verfügbar ist */}
                                    {/* <ChevronDown className={`h-6 w-6 text-gray-600 transition-transform duration-300 ${openPixelId === pixelId ? 'rotate-180' : ''}`} /> */}
                                </button>

                                {/* Akkordeon-Inhalt (sid-Einträge) */}
                                {openPixelId === pixelId && (
                                    <div className="p-4 bg-white border-t border-gray-100 animate-fade-in">
                                        <ul className="space-y-4">
                                            {/* Überprüfen, ob sids ein gültiges Objekt ist, bevor Object.entries aufgerufen wird */}
                                            {sids && Object.keys(sids).length > 0 ? (
                                                Object.entries(sids).map(([sid, attrs]) => (
                                                    <li key={sid} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-blue-50 bg-opacity-70 border border-blue-200 rounded-lg shadow-sm">
                                                        <label htmlFor={`${pixelId}-${sid}`} className="block text-sm font-medium text-blue-800 mb-1 sm:mb-0 sm:mr-4 flex-shrink-0">
                                                            {sid}:
                                                        </label>
                                                        <input
                                                            id={`${pixelId}-${sid}`}
                                                            // Dynamischer Input-Typ: "text" wenn der Wert ein String ist und keine Zahl, sonst "number"
                                                            type={typeof attrs.max_value === 'string' && isNaN(parseFloat(attrs.max_value)) ? "text" : "number"}
                                                            value={attrs.max_value}
                                                            onChange={(e) => handleValueChange(pixelId, sid, e.target.value)}
                                                            className="block w-full sm:w-auto flex-grow px-4 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base text-gray-800 transition-all duration-200"
                                                            aria-label={`Wert für ${sid} im ${pixelId}`}
                                                        />
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-gray-500">Keine SID-Einträge für diesen Pixel.</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-600 p-4">Keine Konfigurationsdaten verfügbar.</p>
                    )}
                </div>

                {/* Bestätigungsbutton */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <button
                        onClick={
                        sendMessage(
                          { type: "cfg_file", cfg: cfg , timestamp: new Date().toISOString() }
                        )}
                        className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-lg font-bold rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-3 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105">
                        Konfiguration bestätigen
                    </button>
                </div>
            </div>
        </div>
    );
}

// Eine kleine Demo-App, um CfgCreator anzuzeigen und zu testen
export function DemoApp() {
    // Hier kannst du die cfg_content-Prop steuern.
    // Initialisiere mit einem leeren Objekt, um den Fehler zu vermeiden, wenn noch keine Daten vorhanden sind.
    // Oder übergebe direkt eine initiale Konfiguration:
    const initialCfg = {
        "pixel_id_demo": {
            "fermion_sub_test": {
                "max_value": 42,
                "phase": [{ id: "d1", iterations: 1, max_val_multiplier: 1.0 }]
            }
        }
    };

    const [currentCfgContent, setCurrentCfgContent] = useState(initialCfg);
    const [showPanel, setShowPanel] = useState(true);

    const handleTogglePanel = useCallback(() => {
        setShowPanel(prev => !prev);
    }, []);

    const handleClearCfg = useCallback(() => {
        setCurrentCfgContent({}); // Setzt die Konfiguration auf ein leeres Objekt
        setShowPanel(true); // Panel anzeigen, auch wenn leer
    }, []);

    const handleSetMockCfg = useCallback(() => {
        setCurrentCfgContent(initialCfg); // Setzt die Konfiguration auf den Initialwert
        setShowPanel(true);
    }, [initialCfg]);


    return (
        <div className="p-4 bg-gray-900 min-h-screen flex flex-col items-center justify-center">
            <CfgCreator cfg_content={currentCfgContent} />

        </div>
    );
}

// Exportiere die CfgCreator Komponente als Standardexport (falls dies die Hauptkomponente ist, die gerendert werden soll)
export default CfgCreator;
