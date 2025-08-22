// /tools/crawl/router.js

import express from 'express';
import puppeteer from 'puppeteer-core';
import { URL } from 'url';

const router = express.Router();

// --- CONFIGURACIÓN DE LA HERRAMIENTA ---
const BROWSERLESS_URL = process.env.BROWSERLESS_URL;
const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;

/**
 * @swagger
 * /get-links:
 *   post:
 *     summary: Rastrea una página de inicio para encontrar todos los enlaces internos.
 *     description: Visita una URL dada, extrae todos los enlaces, los filtra para mantener solo los que pertenecen al mismo dominio y devuelve una lista limpia de URLs internas.
 *     operationId: getInternalLinksFromUrl
 *     tags: [Crawler]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: "La URL base del sitio web a rastrear."
 *                 example: "https://www.xataka.com"
 *             required:
 *               - url
 *     responses:
 *       '200':
 *         description: Rastreo completado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 links:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uri
 *                   description: "Un array de todas las URLs internas encontradas."
 *                 presentation_suggestion:
 *                   type: string
 *       '400':
 *         description: Petición inválida.
 *       '500':
 *         description: Error interno del servidor.
 */
router.post('/get-links', async (req, res) => {
  const { url: startUrl } = req.body;

  if (!startUrl) {
    return res.status(400).json({ status: "error", message: "El parámetro 'url' es requerido." });
  }
  if (!BROWSERLESS_URL) {
    console.error('Error: La URL de Browserless no está configurada.');
    return res.status(500).json({ status: "error", message: 'El servicio de crawling no está configurado correctamente.' });
  }

  let browser;
  try {
    console.log(`[Crawler Tool] Iniciando rastreo para: ${startUrl}`);
    
    const connectUrl = `${BROWSERLESS_URL}?token=${BROWSERLESS_TOKEN}`;
    browser = await puppeteer.connect({ browserWSEndpoint: connectUrl });
    const page = await browser.newPage();
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Extraer todos los href de las etiquetas <a>
    const rawLinks = await page.$$eval('a', links => links.map(link => link.href));
    
    await browser.close();
    
    // Procesar y filtrar los enlaces
    const baseUrl = new URL(startUrl).origin;
    const internalLinks = new Set(); // Usar un Set para evitar duplicados

    for (const link of rawLinks) {
      if (!link) continue;

      try {
        const absoluteUrl = new URL(link, baseUrl).href;
        const urlObj = new URL(absoluteUrl);

        // Filtrar enlaces externos, anclas y protocolos no http/https
        if (urlObj.origin === baseUrl && (urlObj.protocol === 'http:' || urlObj.protocol === 'https:')) {
            // Limpiar el hash de la URL
            internalLinks.add(urlObj.origin + urlObj.pathname);
        }
      } catch (e) {
        // Ignorar URLs inválidas
      }
    }
    
    const finalLinks = [...internalLinks];
    console.log(`[Crawler Tool] Rastreo completado. Se encontraron ${finalLinks.length} enlaces internos.`);

    res.json({
      status: 'success',
      links: finalLinks,
      presentation_suggestion: `Se han encontrado ${finalLinks.length} enlaces internos en el sitio. El siguiente paso es procesar cada uno para extraer su contenido.`
    });

  } catch (error) {
    console.error('[Crawler Tool] Error durante el rastreo:', error.message);
    if (browser) await browser.close();
    res.status(500).json({
      status: "error",
      message: "No se pudo rastrear la URL proporcionada."
    });
  }
});

export default router;