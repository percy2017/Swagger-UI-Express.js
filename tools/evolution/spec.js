import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper para obtener el path correcto en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Herramienta de Control de Evolution API',
      version: '1.0.0',
      description: 'Permite controlar instancias de WhatsApp (crear, eliminar, enviar mensajes) a través de Evolution API. Los eventos en tiempo real como QR y cambios de estado se reciben por un stream global.',
    },
    servers: [
        {
          url: "/api/evolution",
        },
      ],
  },
  // Apunta al archivo router donde están los comentarios JSDoc
  apis: [path.resolve(__dirname, 'router.js')],
};

export const evolutionSpec = swaggerJsdoc(swaggerOptions);