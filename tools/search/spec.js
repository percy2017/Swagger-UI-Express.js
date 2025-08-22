// tools/search/spec.js

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Herramienta de Búsqueda Multi-Categoría (KipuxAI)',
      version: '2.0.0', // Versión mayor por el gran cambio en la respuesta
      description: 'Realiza búsquedas paralelas en múltiples categorías (general, noticias, videos, imágenes) y devuelve los resultados agregados y estructurados. Incluye una sugerencia de presentación para guiar al LLM.',
    },
  },
  // Apunta al archivo de rutas que contendrá la documentación detallada del endpoint.
  apis: [path.resolve(__dirname, 'router.js')],
};

export const searchSpec = swaggerJsdoc(swaggerOptions);