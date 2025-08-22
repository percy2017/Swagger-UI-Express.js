// /tools/crawl/spec.js

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Herramienta de Rastreo Web (Crawler)',
      version: '1.0.0',
      description: 'Descubre y devuelve todos los enlaces internos de una página web dada.',
    },
    servers: [
        {
          url: "/api/crawl", 
        },
      ],
  },
  apis: [path.resolve(__dirname, 'router.js')],
};

export const crawlSpec = swaggerJsdoc(swaggerOptions);