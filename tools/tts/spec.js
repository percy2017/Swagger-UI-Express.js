// /tools/tts/spec.js

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Herramienta de Texto a Voz (TTS)',
      version: '1.0.0',
      description: 'Convierte texto en un archivo de audio .mp3 y devuelve una URL pública para su reproducción.',
    },
    servers: [
        {
          url: "/api/tts", 
        },
      ],
  },
  apis: [path.resolve(__dirname, 'router.js')],
};

export const ttsSpec = swaggerJsdoc(swaggerOptions);