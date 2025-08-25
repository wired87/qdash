import React, { useState } from 'react';

export default function NodeDrawer({}) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<Error | null>(null);


  // Mock-Funktion für das Absenden des Terminalbefehls
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Befehl gesendet:', inputValue);
    alert(`Befehl gesendet: ${inputValue}`);
    setInputValue('');
    setError(null); // Fehler zurücksetzen
  };

  const updateInputValue = (value: string) => {
    setInputValue(value);
  };

  const onCloseDrawer = () => {
    console.log('Slider-Inhalt geschlossen');
  };

  const nodeName = "My Production Node";
  const tags = ["Running", "v1.2.3", "Stable"];

  return (
    <div
      className="fixed top-0 right-0 h-screen w-96 bg-[#1e1f20] text-gray-200 shadow-xl flex flex-col"
      style={{ zIndex: 50 }}
    >

    </div>

  );
}

/*

<Editor
  className="flex-1 h-screen w-96"
  defaultLanguage="yaml"
  value={yamlConfig}
  onChange={(val) => setYamlConfig(val || "")}
  theme="vs-dark"
  options={{
    fontSize: 13,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
  }}
/>
  const [yamlConfig, setYamlConfig] = useState(`phases:
  - id: warmup
    duration: 10s
    changes:
      electron_energy: { mode: "linear", start: 100, end: 500 }
  - id: main_run
    duration: 50s
    changes:
      temperature: { mode: "constant", value: 1.5 }`);
 */