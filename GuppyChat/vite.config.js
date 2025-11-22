import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite con soporte para librerías que usan "global" (como sockjs-client)
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
});