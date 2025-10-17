import React from 'react';
import './App.css';
import './index.css';
import MainApp from "./qdash/main";
import {getOrCreateUserId} from "./qdash/auth";

function App() {
  getOrCreateUserId()
  return (
    <MainApp />
  );
}

export default App;
