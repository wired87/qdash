import React from 'react';
import './App.css';
import './index.css';
import MainApp from "./qdash/main";
import { getOrCreateUserId } from "./qdash/auth";

import ReduxWebSocketBridge from "./qdash/store/ReduxWebSocketBridge";
// import GlobalConnectionSpinner from "./qdash/components/GlobalConnectionSpinner";

function App() {
  getOrCreateUserId()
  return (
    <>
      <ReduxWebSocketBridge />
      {/* <GlobalConnectionSpinner /> - Removed to render disconnected message in terminal instead */}
      <MainApp />
    </>
  );
}

export default App;
