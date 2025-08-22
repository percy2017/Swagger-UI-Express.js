// /tools/vision/spec.js

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Herramienta de Análisis de Visión (Qwen+Tika)',
      version: '1.0.0',
      description: 'Utiliza el modelo multimodal Qwen2.5-VL para un análisis visual y Apache Tika para la extracción de metadatos técnicos y OCR de respaldo.',
    },
    servers: [
        {
          url: "/api/vision", 
        },
      ],
  },
  apis: [path.resolve(__dirname, 'router.js')],
};

export const visionSpec = swaggerJsdoc(swaggerOptions);