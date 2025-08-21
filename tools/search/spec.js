// tools/search/spec.js

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper para obtener la ruta absoluta en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Herramienta de Búsqueda Web (KipuxAI)',
      version: '1.0.0',
      description: 'Esta especificación contiene únicamente la herramienta para realizar búsquedas web con SearXNG.',
    },
  },
  // ¡Importante! Apunta solo al archivo de rutas de esta herramienta.
  apis: [path.resolve(__dirname, 'router.js')], 
};

export const searchSpec = swaggerJsdoc(swaggerOptions);