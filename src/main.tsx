import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './context/I18nContext';
import { WebsiteProvider } from './context/WebsiteContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <I18nProvider>
          <WebsiteProvider>
            <App />
          </WebsiteProvider>
        </I18nProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
);