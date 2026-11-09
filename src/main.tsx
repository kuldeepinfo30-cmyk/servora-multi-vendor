import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { Toaster } from '@/components/ui/overlays';
import { bootstrapTheme } from '@/store/theme';

// Apply the persisted theme before the first paint to avoid a flash.
bootstrapTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster />
    </BrowserRouter>
  </StrictMode>,
);
