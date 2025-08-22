// /tools/asr/spec.js

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Herramienta de Voz a Texto (ASR)',
      version: '1.0.0',
      description: 'Transcribe un archivo de audio a texto utilizando el servicio Whisper ASR.',
    },
    servers: [
        {
          url: "/api/asr", 
        },
      ],
  },
  apis: [path.resolve(__dirname, 'router.js')],
};

export const asrSpec = swaggerJsdoc(swaggerOptions);