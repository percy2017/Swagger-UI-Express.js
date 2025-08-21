// tools/search/router.js

import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * @swagger
 * /web-search:
 *   post:
 *     summary: Realiza una búsqueda en la web con SearXNG.
 *     description: Herramienta que utiliza SearXNG para obtener resultados de búsqueda de internet.
 *     operationId: webSearch
 *     tags: [Búsqueda]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Los términos a buscar en la web.
 *               count:
 *                 type: integer
 *                 description: Número de resultados a devolver. Valor por defecto 6.
 *                 default: 6
 *             required:
 *               - query
 *     responses:
 *       200:
 *         description: Búsqueda realizada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post('/web-search', async (req, res) => {
  const { query, count = 6 } = req.body;

  if (!query) {
    return res.status(400).json({ status: "error", message: "El parámetro 'query' es requerido." });
  }

  try {
    const searxngUrl = process.env.SEARXNG_URL;
    const response = await axios.get(searxngUrl, {
      params: { q: query, format: 'json' }
    });
    
    let finalResponsePayload;

    if (!response.data.results || response.data.results.length === 0) {
      finalResponsePayload = {
        status: "success",
        results: "No se encontraron resultados relevantes para la búsqueda."
      };
    } else {
      const curatedResults = response.data.results.slice(0, count).map(result => ({
        title: result.title,
        url: result.url,
        content: result.content
      }));
      finalResponsePayload = {
        status: "success",
        results: curatedResults
      };
    }
  
    if (response.data.suggestions && response.data.suggestions.length > 0) {
      finalResponsePayload.suggestions = response.data.suggestions;
    }
    
    res.json(finalResponsePayload);

  } catch (error) {
    console.error("Error al contactar al servidor de SearXNG:", error.message);
    res.status(500).json({
      status: "error",
      message: "El servicio de búsqueda web no está disponible en este momento."
    });
  }
});

export default router;