
import React from 'react';
import ReactDOM from 'react-dom/client';
import { isTauri } from '@tauri-apps/api/core';
import App from './App';
import './i18n';
import { initTauri } from './services/tauriInit';

// Limpar localStorage se necessário (desenvolvimento)
// Descomente a linha abaixo para forçar logout ao iniciar
// localStorage.removeItem('tasca-vereda-storage-v2');

// Inicializar Tauri se disponível
initTauri().catch((err: unknown) => console.log('Tauri init:', err));

// Registo do Service Worker para suporte PWA/Offline
if ('serviceWorker' in navigator && !isTauri()) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', window.location.href);
    navigator.serviceWorker.register(swUrl.toString())
      .then(registration => {
        console.log('SW registrado com sucesso: ', registration.scope);
        registration.update().catch((err: unknown) => console.log('SW update:', err));
      })
      .catch(error => {
        console.log('Falha ao registrar SW: ', error);
      });
  });
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
