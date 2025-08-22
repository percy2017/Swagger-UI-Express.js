import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

// --- Carga de Módulos de Herramientas ---
import searchTool from './tools/search/index.js';
import scrapeTool from './tools/scrape/index.js';
import extractTool from './tools/extract/index.js';
import visionTool from './tools/vision/index.js';
import ttsTool from './tools/tts/index.js';
import asrTool from './tools/asr/index.js';
import embeddingsTool from './tools/embeddings/index.js';
import crawlTool from './tools/crawl/index.js';
import evolutionTool from './tools/evolution/index.js';

const app = express();
const PORT = process.env.PORT || 5005;

// --- Middlewares Globales ---
app.use(cors());
app.use(express.json());
app.use('/static', express.static('static'));

// Middleware
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
app.use('/api/search', searchTool.router);
app.get('/api/search/openapi.json', (req, res) => {
  res.json(searchTool.spec);
});
console.log('✅ Herramienta de Búsqueda registrada en /api/search');

app.use('/api/scrape', scrapeTool.router);
app.get('/api/scrape/openapi.json', (req, res) => {
  res.json(scrapeTool.spec);
});
console.log('✅ Herramienta de Scraping registrada en /api/scrape');

app.use('/api/extract', extractTool.router);
app.get('/api/extract/openapi.json', (req, res) => {
  res.json(extractTool.spec);
});
console.log('✅ Herramienta de Extracción registrada en /api/extract');

app.use('/api/vision', visionTool.router);
app.get('/api/vision/openapi.json', (req, res) => {
  res.json(visionTool.spec);
});
console.log('✅ Herramienta de Visión registrada en /api/vision');

app.use('/api/tts', ttsTool.router);
app.get('/api/tts/openapi.json', (req, res) => {
  res.json(ttsTool.spec);
});
console.log('✅ Herramienta de TTS registrada en /api/tts');

app.use('/api/asr', asrTool.router);
app.get('/api/asr/openapi.json', (req, res) => {
  res.json(asrTool.spec);
});
console.log('✅ Herramienta de ASR registrada en /api/asr');

app.use('/api/embeddings', embeddingsTool.router);
app.get('/api/embeddings/openapi.json', (req, res) => {
  res.json(embeddingsTool.spec);
});
console.log('✅ Herramienta de Embeddings registrada en /api/embeddings');

app.use('/api/crawl', crawlTool.router);
app.get('/api/crawl/openapi.json', (req, res) => {
  res.json(crawlTool.spec);
});
console.log('✅ Herramienta de Crawler registrada en /api/crawl');

app.use('/api/evolution', evolutionTool.router);
app.get('/api/evolution/openapi.json', (req, res) => {
  res.json(evolutionTool.spec);
});
console.log('✅ Herramienta de Evolution registrada en /api/evolution');

// --- Ruta Raíz para Verificación ---
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Servidor de Herramientas KipuxAI está funcionando.',
    available_tools: {
      search: '/api/search/openapi.json',
      scrape: '/api/scrape/openapi.json',
      extract: '/api/extract/openapi.json',
      vision: '/api/vision/openapi.json',
      tts: '/api/tts/openapi.json',
      asr: '/api/asr/openapi.json',
      embeddings: '/api/embeddings/openapi.json',
      crawl: '/api/crawl/openapi.json',
      evolution: '/api/evolution/openapi.json'
    }
  });
});

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor de herramientas escuchando en ${process.env.PUBLIC_SERVER_URL}`);
});