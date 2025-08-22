// /tools/evolution/spec.js

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Herramienta de Gestión de Evolution API',
      version: '1.0.0',
      description: 'Permite gestionar instancias de WhatsApp, enviar mensajes y consultar contactos a través de Evolution API.',
    },
    servers: [
        {
          url: "/api/evolution", 
        },
      ],
  },
  apis: [path.resolve(__dirname, 'router.js')],
};

export const evolutionSpec = swaggerJsdoc(swaggerOptions);