import React, { useState } from 'react';

export default function NodeDrawer({}) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(null);


  // Mock-Funktion für das Absenden des Terminalbefehls
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Befehl gesendet:', inputValue);
    alert(`Befehl gesendet: ${inputValue}`);
    setInputValue('');
    setError(null); 
  };

  const updateInputValue = (value) => {
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
