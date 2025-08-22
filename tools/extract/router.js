// /tools/extract/router.js

import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * @swagger
 * /from-url:
 *   post:
 *     summary: Extrae contenido de un documento vía URL
 *     description: Descarga un documento desde una URL pública, lo envía a un servidor Apache Tika para extraer su contenido de texto y metadatos, y devuelve un objeto JSON combinado.
 *     operationId: extractContentFromUrl
 *     tags: [Extracción]
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
 *                 description: "La URL pública del documento a procesar."
 *                 example: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
 *             required:
 *               - url
 *     responses:
 *       '200':
 *         description: Extracción exitosa.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 metadata:
 *                   type: object
 *                   description: "Metadatos extraídos del documento."
 *                 content:
 *                   type: string
 *                   description: "Contenido de texto plano extraído del documento."
 *                 presentation_suggestion:
 *                   type: string
 *                   description: "Guía para el LLM sobre cómo presentar la información."
 *       '400':
 *         description: Petición inválida (ej. falta la URL).
 *       '500':
 *         description: Error interno del servidor o del servicio Tika.
 */
router.post('/from-url', async (req, res) => {
  const { url } = req.body;
  const TIKA_URL = process.env.TIKA_URL;

  if (!url) {
    return res.status(400).json({ status: "error", message: "El parámetro 'url' es requerido." });
  }

  if (!TIKA_URL) {
    console.error('Error: La variable de entorno TIKA_URL no está configurada.');
    return res.status(500).json({ status: "error", message: 'El servicio de extracción no está configurado correctamente.' });
  }

  try {
    console.log(`[Tika Tool] Obteniendo documento desde: ${url}`);
    
    const documentResponse = await axios.get(url, {
      responseType: 'arraybuffer'
    });
    const documentBuffer = documentResponse.data;

    console.log(`[Tika Tool] Enviando documento a Tika Server: ${TIKA_URL}`);
    const [tikaContentResponse, tikaMetaResponse] = await Promise.all([
      axios.put(`${TIKA_URL}/tika`, documentBuffer, {
        headers: { 'Content-Type': 'application/octet-stream', 'Accept': 'text/plain' },
      }),
      axios.put(`${TIKA_URL}/meta`, documentBuffer, {
        headers: { 'Content-Type': 'application/octet-stream', 'Accept': 'application/json' },
      }),
    ]);
    
    const content = tikaContentResponse.data;
    const metadata = tikaMetaResponse.data;

    console.log(`[Tika Tool] Extracción completada exitosamente.`);

    res.json({
      status: 'success',
      metadata: metadata,
      content: content,
      presentation_suggestion: `Resume el siguiente contenido y sus metadatos. Si la metadata contiene información relevante como autor, título o fecha, menciónala al principio. Presenta el resumen del contenido de forma clara.`
    });

  } catch (error) {
    console.error('[Tika Tool] Error durante el proceso de extracción:', error.message);
    res.status(500).json({ 
      status: "error", 
      message: 'No se pudo procesar el documento desde la URL proporcionada.' 
    });
  }
});

export default router;