// /tools/extract/spec.js

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Herramienta de Extracción de Contenido (Tika)',
      version: '1.0.0',
      description: 'Utiliza Apache Tika para extraer texto y metadatos de documentos proporcionados a través de una URL pública.',
    },
    servers: [
        {
          // Esta URL base será prefijada a las rutas definidas en el router.
          // Por ejemplo, /from-url se convertirá en /api/extract/from-url
          url: "/api/extract", 
        },
      ],
  },
  // Apunta al archivo de rutas que contiene la documentación JSDoc.
  apis: [path.resolve(__dirname, 'router.js')],
};

export const extractSpec = swaggerJsdoc(swaggerOptions);