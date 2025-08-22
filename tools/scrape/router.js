// tools/scrape/router.js

import express from 'express';
import puppeteer from 'puppeteer-core';
import dns from 'dns/promises';
import { URL } from 'url';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const router = express.Router();

// Asegurarse de que los directorios de artefactos existan al iniciar
const contentDir = path.resolve('static/scrape/content');
const screenshotsDir = path.resolve('static/scrape/screenshots');
fs.mkdir(contentDir, { recursive: true });
fs.mkdir(screenshotsDir, { recursive: true });


/**
 * @swagger
 * /scrape-url:
 *   post:
 *     summary: Extrae metadatos y genera artefactos de una URL.
 *     description: Realiza un scraping avanzado, guarda el contenido completo como un archivo .md y toma capturas de pantalla. Devuelve una respuesta ligera con URLs a estos artefactos.
 *     operationId: scrapeAndGenerateArtifacts
 *     tags: [Scraping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: La URL completa de la página web a analizar.
 *             required:
 *               - url
 *     responses:
 *       200:
 *         description: Análisis completado y artefactos generados con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 source_url:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                 artifacts:
 *                   type: object
 *                   properties:
 *                     full_content_md_url:
 *                       type: string
 *                       format: uri
 *                     screenshot_urls:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uri
 *                 extracted_links:
 *                   type: object
 *                   properties:
 *                     image_urls:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uri
 *                     video_urls:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uri
 *                     links:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uri
 *                 technical_data:
 *                   type: object
 *                   properties:
 *                     server_ip:
 *                       type: string
 *                     response_headers:
 *                       type: object
 *                 scrape_report:
 *                   type: object
 *                   properties:
 *                     duration_ms:
 *                       type: integer
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                 presentation_suggestion:
 *                   type: string
 *                   description: Una instrucción para guiar al LLM sobre cómo presentar los datos.
 */
router.post('/scrape-url', async (req, res) => {
  const { url } = req.body;
  const startTime = Date.now();

  if (!url) {
    return res.status(400).json({ status: "error", message: "El parámetro 'url' es requerido." });
  }

  let browser = null;
  const artifactId = crypto.randomUUID();

  try {
    const hostname = new URL(url).hostname;
    const serverIp = (await dns.lookup(hostname)).address;

    const browserWSEndpoint = `${process.env.BROWSERLESS_URL}?token=${process.env.BROWSERLESS_TOKEN}`;
    browser = await puppeteer.connect({ browserWSEndpoint });
    const page = await browser.newPage();
    
    const response = await page.goto(url, { waitUntil: 'load', timeout: 90000 });
    const responseHeaders = response.headers();

    const extractedData = await page.evaluate(() => {
      const toAbsoluteURL = (href) => new URL(href, document.baseURI).href;
      
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || 'No description found',
        full_content_text: document.body.innerText,
        image_urls: [...new Set(Array.from(document.querySelectorAll('img[src]')).map(img => toAbsoluteURL(img.src)).filter(src => !src.startsWith('data:')))],
        video_urls: [...new Set(Array.from(document.querySelectorAll('video source[src], video[src]')).map(v => toAbsoluteURL(v.src)))],
        links: [...new Set(Array.from(document.querySelectorAll('a[href]')).map(a => toAbsoluteURL(a.href)).filter(href => !href.startsWith('#')))]
      };
    });

    const contentFilePath = path.join(contentDir, `${artifactId}.md`);
    await fs.writeFile(contentFilePath, extractedData.full_content_text);

    const viewportPath = path.join(screenshotsDir, `${artifactId}-viewport.jpg`);
    const fullPagePath = path.join(screenshotsDir, `${artifactId}-fullpage.jpg`);
    await page.screenshot({ path: viewportPath, type: 'jpeg', quality: 80 });
    await page.screenshot({ path: fullPagePath, fullPage: true, type: 'jpeg', quality: 80 });
    
    const baseUrl = process.env.PUBLIC_SERVER_URL;
    const fullContentMdUrl = `${baseUrl}/static/scrape/content/${artifactId}.md`;
    const screenshotUrls = [
      `${baseUrl}/static/scrape/screenshots/${artifactId}-viewport.jpg`,
      `${baseUrl}/static/scrape/screenshots/${artifactId}-fullpage.jpg`
    ];
    
    // --- CAMBIO 2: AÑADIR LA SUGERENCIA DE PRESENTACIÓN ---
    const presentationSuggestion = `He analizado la página '${extractedData.title}'. ` +
      `Informa al usuario que puede leer el contenido completo en el enlace proporcionado. ` +
      `Ofrece también los enlaces a las capturas de pantalla para un contexto visual de cómo se ve la página.`;

    const durationMs = Date.now() - startTime;
    res.json({
      status: "success",
      source_url: url,
      metadata: {
        title: extractedData.title,
        description: extractedData.description,
      },
      artifacts: {
        full_content_md_url: fullContentMdUrl,
        screenshot_urls: screenshotUrls,
      },
      extracted_links: {
        image_urls: extractedData.image_urls,
        video_urls: extractedData.video_urls,
        links: extractedData.links,
      },
      technical_data: {
        server_ip: serverIp,
        response_headers: responseHeaders,
      },
      scrape_report: {
        duration_ms: durationMs,
        timestamp: new Date().toISOString(),
      },
      presentation_suggestion: presentationSuggestion, // Campo añadido
    });

  } catch (error) {
    console.error(`Error al scrapear la URL ${url}:`, error.message);
    res.status(500).json({
      status: "error",
      message: `No se pudo procesar la URL. Error: ${error.message}`
    });
  } finally {
    if (browser) {
      await browser.disconnect();
    }
  }
});

export default router;