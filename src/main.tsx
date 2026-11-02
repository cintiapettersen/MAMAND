import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Fontes hospedadas no próprio app (OFL 1.1): funcionam offline e não enviam o IP da usuária a terceiros.
// Só os pesos usados, nos alfabetos latino e latino estendido (pt, en e línguas nórdicas).
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-ext-700.css';
import '@fontsource/nunito/latin-900.css';
import '@fontsource/nunito/latin-ext-900.css';
import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-ext-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-ext-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-ext-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-ext-700.css';
import '@fontsource/plus-jakarta-sans/latin-800.css';
import '@fontsource/plus-jakarta-sans/latin-ext-800.css';
import '@fontsource-variable/fraunces/opsz.css';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registro do Service Worker para suporte PWA e funcionamento offline
if (
  'serviceWorker' in navigator &&
  (window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Notificação de ciclo de vida para atualização de cache
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('Nova versão do aplicativo disponível no cache.');
              }
            };
          }
        };
      })
      .catch((err) => {
        console.warn('Falha ao registrar Service Worker:', err);
      });
  });
}
