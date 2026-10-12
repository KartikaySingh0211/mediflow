import React from 'react';
import { createRoot } from 'react-dom/client';
import '@shared/index.css';
import { AuthProvider } from '@shared/context/AuthContext';
import { HospitalDataProvider } from '@shared/context/HospitalDataContext';
import { PatternTraceProvider } from '@shared/pattern-tracing/PatternTraceContext';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PatternTraceProvider>
      <AuthProvider defaultRole="pharmacist">
        <HospitalDataProvider>
          <App />
        </HospitalDataProvider>
      </AuthProvider>
    </PatternTraceProvider>
  </React.StrictMode>
);
