// /tools/embeddings/spec.js

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Herramienta de Gestión de Embeddings',
      version: '2.0.0',
      description: 'Genera, almacena y consulta embeddings de texto para sistemas RAG. Utiliza un hash de contenido para aislar los datos.',
    },
    servers: [
        {
          url: "/api/embeddings", 
        },
      ],
  },
  apis: [path.resolve(__dirname, 'router.js')],
};

export const embeddingsSpec = swaggerJsdoc(swaggerOptions);