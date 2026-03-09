import React from 'react';
import './App.css';
import './index.css';
import MainApp from "./qdash/main";
import { getOrCreateUserId } from "./qdash/auth";

import ReduxWebSocketBridge from "./qdash/store/ReduxWebSocketBridge";

function App() {
  getOrCreateUserId()
  return (
    <>
      <ReduxWebSocketBridge />
      <MainApp />
    </>
  );
}

export default App;
