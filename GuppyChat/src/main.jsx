import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

/* 🌍 GLOBALES */
import './estilos/estiloGlobal.css';
import './estilos/estiloInputs.css';
import './estilos/estiloButtons.css';
import './estilos/estiloResponsive.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

