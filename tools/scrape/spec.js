// tools/scrape/spec.js

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Herramienta de Scraping y Generación de Artefactos (KipuxAI)',
      version: '2.0.0', // Versión mayor por el cambio de funcionalidad
      description: 'Extrae metadatos de una URL y genera artefactos (contenido completo en MD, capturas de pantalla) para su análisis posterior. Devuelve URLs a estos artefactos para un consumo de tokens mínimo.',
    },
  },
  // Apunta solo al archivo de rutas de esta herramienta.
  apis: [path.resolve(__dirname, 'router.js')], 
};

export const scrapeSpec = swaggerJsdoc(swaggerOptions);