import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrandProvider } from './context/BrandContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrandProvider>
      <App />
    </BrandProvider>
  </React.StrictMode>,
);
