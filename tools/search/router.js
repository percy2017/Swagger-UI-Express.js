// tools/search/router.js

import express from 'express';
import axios from 'axios';
import { URL } from 'url';

// --- CONFIGURACIÓN DE BÚSQUEDA ---
// Lista de categorías principales en las que se buscará.
// Para extender la búsqueda, simplemente añade más categorías a este array
// (ej. 'science', 'social media', 'map').
const SEARCH_CATEGORIES = ['general', 'news', 'videos', 'images'];
const MIN_RESULTS = 2;
const MAX_RESULTS = 10;

const router = express.Router();

/**
 * @swagger
 * /web-search:
 *   post:
 *     summary: Realiza una búsqueda multi-categoría.
 *     description: Lanza búsquedas paralelas en 'general', 'news', 'videos', e 'images' y devuelve los resultados agregados.
 *     operationId: multiCategoryWebSearch
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
 *                 description: El término de búsqueda.
 *               count:
 *                 type: integer
 *                 description: "Número de resultados por categoría. Mínimo 2, máximo 10."
 *                 default: 3
 *             required:
 *               - query
 *     responses:
 *       200:
 *         description: Búsqueda agregada completada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 query:
 *                   type: string
 *                 results_by_category:
 *                   type: object
 *                   description: Un objeto donde cada clave es una categoría y su valor es una lista de resultados.
 *                 presentation_suggestion:
 *                   type: string
 *                   description: Una instrucción en lenguaje natural para guiar al LLM sobre cómo presentar los datos.
 */
router.post('/web-search', async (req, res) => {
  const { query, count = 3 } = req.body;

  if (!query) {
    return res.status(400).json({ status: "error", message: "El parámetro 'query' es requerido." });
  }

  if (count < MIN_RESULTS || count > MAX_RESULTS) {
    return res.status(400).json({ status: "error", message: `El parámetro 'count' debe estar entre ${MIN_RESULTS} y ${MAX_RESULTS}.` });
  }

  try {
    const searxngUrl = process.env.SEARXNG_URL;

    // 1. Crear una promesa de búsqueda para cada categoría
    const searchPromises = SEARCH_CATEGORIES.map(category =>
      axios.get(searxngUrl, {
        params: {
          q: query,
          categories: category,
          format: 'json'
        }
      }).then(response => ({
        category, // Añadir la categoría a la respuesta para saber de dónde viene
        data: response.data.results || []
      }))
    );

    // 2. Ejecutar todas las búsquedas en paralelo y esperar a que terminen
    const searchResults = await Promise.all(searchPromises);

    // 3. Procesar y agregar los resultados
    const aggregatedResults = {};
    searchResults.forEach(result => {
      // Tomar solo la cantidad solicitada de resultados y mapearlos a un formato limpio
      aggregatedResults[result.category] = result.data.slice(0, count).map(item => {
        // Mapeo genérico
        const baseResult = {
          title: item.title,
          url: item.url,
          content: item.content,
          hostname: item.parsed_url?.netloc || new URL(item.url).hostname
        };
        // Mapeo específico para imágenes
        if (result.category === 'images' && item.img_src) {
          baseResult.image_url = item.img_src;
        }
        return baseResult;
      });
    });
    
    // 4. Generar la sugerencia de presentación dinámicamente
    const suggestionParts = [];
    if (aggregatedResults.general?.length > 0) {
      suggestionParts.push("Presenta un resumen general basado en los resultados de la categoría 'general'.");
    }
    if (aggregatedResults.news?.length > 0) {
      suggestionParts.push("Menciona las noticias más relevantes de la categoría 'news'.");
    }
    if (aggregatedResults.videos?.length > 0) {
      suggestionParts.push("Ofrece los enlaces de la categoría 'videos' como opciones multimedia para el usuario.");
    }
    if (aggregatedResults.images?.length > 0) {
      suggestionParts.push("Finalmente, si el usuario lo solicita, muestra las imágenes encontradas en la categoría 'images'.");
    }
    const presentationSuggestion = suggestionParts.join(' ');


    // 5. Enviar la respuesta final y estructurada
    res.json({
      status: 'success',
      query: query,
      results_by_category: aggregatedResults,
      presentation_suggestion: presentationSuggestion || "No se encontraron resultados relevantes."
    });

  } catch (error) {
    console.error("Error durante la búsqueda multi-categoría:", error.message);
    res.status(500).json({
      status: "error",
      message: "Ocurrió un error al contactar el servicio de búsqueda."
    });
  }
});

export default router;