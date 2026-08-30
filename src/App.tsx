import React, { useEffect } from 'react';
import './index.css';
import MainApp from "./qdash/main";
import { getOrCreateUserId } from "./qdash/auth";
import ReduxWebSocketBridge from "./qdash/store/ReduxWebSocketBridge";

function App() {
  // Ensure a stable anonymous user-id is created once, not on every render
  useEffect(() => {
    getOrCreateUserId();
  }, []);

  return (
    <>
      <ReduxWebSocketBridge />
      <MainApp />
    </>
  );
}

export default App;
