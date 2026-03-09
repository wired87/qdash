// Redux integration
import React from 'react';
import ReactDOM from 'react-dom/client';
import './tailwind.css';
// Eager-load heroui dom-animation shim into main bundle (see craco.config.js alias) to avoid ChunkLoadError
import _herouiDomAnimation from '@heroui/dom-animation';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import { store } from './qdash/store';

// Ensure dom-animation shim is not tree-shaken when bundled
void _herouiDomAnimation;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
