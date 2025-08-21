// index.js

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import dotenv from 'dotenv';
dotenv.config();

// Importar rutas
import searchRoutes from './routes/search.js';

const app = express();
const PORT = process.env.PORT || 3000

// --- Configuración de Swagger ---
const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Servidor de Herramientas KipuxAI',
      version: '1.0.0',
      description: 'API para herramientas de Open Web UI (SearXNG, Browserless, Tika).',
    },
  },
  // Apunta a los archivos que contienen las definiciones de tus rutas
  apis: ['./routes/*.js'], 
};
const openapiSpecification = swaggerJsdoc(swaggerOptions);

// --- Middlewares ---
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`\n================= NUEVA PETICIÓN ENTRANTE =================`);
  console.log(`[${new Date().toISOString()}]`);
  
  console.log('\n--- 1. Información General ---');
  console.log(`Método HTTP: ${req.method}`);
  console.log(`URL Completa: ${req.originalUrl}`);
  console.log(`IP Remota: ${req.ip || req.connection.remoteAddress}`);

  console.log('\n--- 2. Headers (El "Sobre") ---');
  console.log(JSON.stringify(req.headers, null, 2));

  // Solo muestra el body si existe y no está vacío
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('\n--- 3. Body (La "Carta" - JSON de la herramienta) ---');
    console.log(JSON.stringify(req.body, null, 2));
  } else {
    console.log('\n--- 3. Body (La "Carta" - JSON de la herramienta) ---');
    console.log('No hay body en esta petición (o está vacío).');
  }

  console.log(`=========================================================\n`);
  next();
});

// --- Endpoints ---
app.get('/api/openapi.json', (req, res) => {
  res.json(openapiSpecification);
});

app.use('/api', searchRoutes);

app.use('/', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor de herramientas escuchando en http://localhost:${PORT}`);
}); 