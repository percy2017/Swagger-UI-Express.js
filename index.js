import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// --- Carga de Módulos de Herramientas ---
// Cada herramienta que crees se importará aquí.
import searchTool from './tools/search/index.js';
// import scrapeTool from './tools/scrape/index.js'; // <- Así añadirías una nueva

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares Globales ---
app.use(cors());
app.use(express.json());

// Middleware de logging (opcional, pero útil para depuración)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// --- Registro de Herramientas ---
// Aquí es donde "conectamos" cada herramienta a nuestro servidor principal.
// Para cada herramienta, hacemos dos cosas:
// 1. Creamos un endpoint para servir su especificación OpenAPI.
// 2. Montamos su router en una ruta base.

// Registro de la Herramienta de Búsqueda
app.use('/api/search', searchTool.router);
app.get('/api/search/openapi.json', (req, res) => {
  res.json(searchTool.spec);
});
console.log('✅ Herramienta de Búsqueda registrada en /api/search');

/*
// Así se registraría la futura herramienta de Scraping
app.use('/api/scrape', scrapeTool.router);
app.get('/api/scrape/openapi.json', (req, res) => {
  res.json(scrapeTool.spec);
});
console.log('✅ Herramienta de Scraping registrada en /api/scrape');
*/


// --- Ruta Raíz para Verificación ---
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Servidor de Herramientas KipuxAI está funcionando.',
    available_tools: {
      search: '/api/search/openapi.json'
      // scrape: '/api/scrape/openapi.json' // <- Se añadiría aquí
    }
  });
});

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor de herramientas escuchando en http://localhost:${PORT}`);
});