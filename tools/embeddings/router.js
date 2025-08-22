// /tools/embeddings/router.js

import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import pg from 'pg';

const { Pool } = pg;
const router = express.Router();

// --- CONFIGURACIÓN ---
const OLLAMA_EMBED_URL = process.env.OLLAMA_EMBED_URL;
const OLLAMA_EMBED_MODEL_NAME = process.env.OLLAMA_EMBED_MODEL_NAME;
const CHUNK_SIZE = 512; // Máximo de tokens por trozo, mxbai-embed-large tiene un límite de 512

// Configuración de la Pool de Conexiones a PostgreSQL
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// --- FUNCIÓN AUXILIAR PARA DIVIDIR TEXTO (CHUNKING) ---
function chunkText(text, chunkSize) {
  const chunks = [];
  // Una forma simple de dividir por frases para respetar los límites semánticos
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += sentence + " ";
  }
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}


/**
 * @openapi
 * /create:
 *   post:
 *     summary: Procesa y almacena el contenido de un texto.
 *     description: Recibe un bloque de texto, lo divide en trozos, genera embeddings para cada trozo y los almacena en la base de datos bajo un hash único.
 *     operationId: createEmbeddings
 *     tags: [Embeddings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: "El contenido de texto completo a procesar."
 *             required: [text]
 *     responses:
 *       '200':
 *         description: Contenido procesado y almacenado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 content_hash:
 *                   type: string
 *                   description: "El identificador único para consultar este contenido."
 */
router.post('/create', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ status: "error", message: "El campo 'text' es requerido." });

    try {
        const contentHash = crypto.randomUUID();
        const textChunks = chunkText(text, CHUNK_SIZE);

        console.log(`[Embeddings Tool] Creando embeddings para ${textChunks.length} trozos con hash: ${contentHash}`);

        const embeddingPromises = textChunks.map(chunk =>
            axios.post(`${OLLAMA_EMBED_URL}/api/embeddings`, { model: OLLAMA_EMBED_MODEL_NAME, prompt: chunk })
        );
        const responses = await Promise.all(embeddingPromises);
        const embeddings = responses.map(r => r.data.embedding);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (let i = 0; i < textChunks.length; i++) {
                const query = 'INSERT INTO vector_store (content_hash, text_chunk, embedding) VALUES ($1, $2, $3)';
                // pgvector necesita que el vector se pase como una cadena con formato '[1,2,3]'
                const embeddingString = `[${embeddings[i].join(',')}]`; 
                await client.query(query, [contentHash, textChunks[i], embeddingString]);
            }
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        res.json({ status: "success", content_hash: contentHash });
    } catch (error) {
        console.error('[Embeddings Tool /create] Error:', error.message);
        res.status(500).json({ status: "error", message: "No se pudo procesar y almacenar el contenido." });
    }
});


/**
 * @openapi
 * /query:
 *   post:
 *     summary: Busca textos relevantes usando una consulta.
 *     description: Recibe una pregunta y un hash de contenido, genera un embedding para la pregunta y busca en la base de datos los trozos de texto más similares asociados a ese hash.
 *     operationId: queryEmbeddings
 *     tags: [Embeddings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content_hash:
 *                 type: string
 *                 description: "El hash del contenido en el que se quiere buscar."
 *               query_text:
 *                 type: string
 *                 description: "La pregunta o texto para buscar similitudes."
 *               top_k:
 *                 type: integer
 *                 description: "El número de resultados a devolver."
 *                 default: 3
 *             required: [content_hash, query_text]
 *     responses:
 *       '200':
 *         description: Búsqueda completada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 results:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: "Un array de los fragmentos de texto más relevantes encontrados."
 */
router.post('/query', async (req, res) => {
    const { content_hash, query_text, top_k = 3 } = req.body;
    if (!content_hash || !query_text) return res.status(400).json({ status: "error", message: "Los campos 'content_hash' y 'query_text' son requeridos." });

    try {
        console.log(`[Embeddings Tool] Consultando hash ${content_hash} con texto: "${query_text}"`);
        
        const response = await axios.post(`${OLLAMA_EMBED_URL}/api/embeddings`, { model: OLLAMA_EMBED_MODEL_NAME, prompt: query_text });
        const queryEmbedding = `[${response.data.embedding.join(',')}]`;

        const client = await pool.connect();
        try {
            // El operador <=> realiza la búsqueda de similitud por coseno
            const query = 'SELECT text_chunk FROM vector_store WHERE content_hash = $1 ORDER BY embedding <=> $2 LIMIT $3';
            const result = await client.query(query, [content_hash, queryEmbedding, top_k]);
            res.json({ status: "success", results: result.rows.map(row => row.text_chunk) });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('[Embeddings Tool /query] Error:', error.message);
        res.status(500).json({ status: "error", message: "No se pudo realizar la búsqueda." });
    }
});

export default router;