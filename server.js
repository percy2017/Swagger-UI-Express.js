import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// --- Carga de Módulos de Herramientas ---
import searchTool from './tools/search/index.js';
import scrapeTool from './tools/scrape/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// --- Middlewares Globales ---
app.use(cors());
app.use(express.json());

// --- SERVIDOR DE ARCHIVOS ESTÁTICOS ---
// NUEVA LÍNEA: Esto le dice a Express que cualquier petición a /static/...
// debe servir los archivos que se encuentran en la carpeta local ./static/
app.use('/static', express.static('static'));

// Middleware de logging detallado
app.use((req, res, next) => {
  console.log(`\n================= NUEVA PETICIÓN ENTRANTE =================`);
  console.log(`[${new Date().toISOString()}]`);
  console.log(`Método HTTP: ${req.method}`);
  console.log(`URL Completa: ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  console.log(`=========================================================\n`);
  next();
});


// --- Registro de Herramientas ---

// Registro de la Herramienta de Búsqueda
app.use('/api/search', searchTool.router);
app.get('/api/search/openapi.json', (req, res) => {
  res.json(searchTool.spec);
});
console.log('✅ Herramienta de Búsqueda registrada en /api/search');

// Registro de la Herramienta de Scraping
app.use('/api/scrape', scrapeTool.router);
app.get('/api/scrape/openapi.json', (req, res) => {
  res.json(scrapeTool.spec);
});
console.log('✅ Herramienta de Scraping registrada en /api/scrape');


// --- Ruta Raíz para Verificación ---
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Servidor de Herramientas KipuxAI está funcionando.',
    available_tools: {
      search: '/api/search/openapi.json',
      scrape: '/api/scrape/openapi.json'
    }
  });
});

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor de herramientas escuchando en ${process.env.PUBLIC_SERVER_URL}`);
});