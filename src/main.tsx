import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for Progressive Web App (PWA) support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('⚡ [PWA] Service Worker registrado exitosamente con scope:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ [PWA] Registro de Service Worker fallido:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
