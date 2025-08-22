// /tools/vision/router.js

import express from 'express';
import axios from 'axios';

const router = express.Router();
console.log('TIKA_URL leída:', process.env.TIKA_URL);
console.log('OLLAMA_QWEN_URL leída:', process.env.OLLAMA_QWEN_URL);

// --- CONFIGURACIÓN DE LA HERRAMIENTA ---
const TIKA_URL = process.env.TIKA_URL;
const OLLAMA_QWEN_URL = process.env.OLLAMA_QWEN_URL;
const OLLAMA_MODEL_NAME = process.env.OLLAMA_MODEL_NAME;

// Prompt genérico y potente para el modelo de visión
const VISION_PROMPT = `Actua como un experto analista de imagenes. Analiza la siguiente imagen en detalle y proporciona una respuesta clara y concisa que incluya:
1.  **Descripción Visual Detallada:** Describe los objetos, personas, colores, la composicion y la escena general.
2.  **Extracción de Texto (OCR):** Si hay texto visible en cualquier idioma, transcríbelo textualmente. Si no hay texto, indícalo.
3.  **Contexto e Inferencia:** Basado en el contenido visual, infiere el posible contexto, propósito o acción que está ocurriendo.
4.  **Análisis Estructural (si aplica):** Si la imagen es un documento, gráfico, tabla o diagrama, describe su estructura y resume la información que presenta.`;

/**
 * @swagger
 * /analyze:
 *   post:
 *     summary: Analiza una imagen con un modelo de visión y Tika.
 *     description: Recibe una imagen (vía URL pública o Base64) y la procesa en paralelo con el modelo de visión Qwen2.5-VL y Apache Tika para devolver un análisis visual y metadatos técnicos.
 *     operationId: analyzeImage
 *     tags: [Visión]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: "URL pública de la imagen a analizar. Usar este campo o imageBase64, no ambos."
 *                 example: "https://ollama.com/public/ollama.png"
 *               imageBase64:
 *                 type: string
 *                 description: "Imagen codificada en Base64 con prefijo data URI. Usar este campo o imageUrl, no ambos."
 *                 example: "data:image/png;base64,iVBORw0KG..."
 *             oneOf:
 *               - required: [imageUrl]
 *               - required: [imageBase64]
 *     responses:
 *       '200':
 *         description: Análisis completado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 qwen_analysis:
 *                   type: string
 *                   description: "La respuesta textual del modelo de visión Qwen, incluyendo descripción, OCR y contexto."
 *                 tika_data:
 *                   type: object
 *                   properties:
 *                     metadata:
 *                       type: object
 *                       description: "Metadatos técnicos del archivo de imagen extraídos por Tika."
 *                     ocr_content:
 *                       type: string
 *                       description: "Texto extraído de la imagen por el motor OCR de Tika."
 *                 presentation_suggestion:
 *                   type: string
 *                   description: "Guía para el LLM sobre cómo presentar la información combinada."
 *       '400':
 *         description: Petición inválida.
 *       '500':
 *         description: Error interno del servidor.
 */
router.post('/analyze', async (req, res) => {
  const { imageUrl, imageBase64 } = req.body;

  // 1. Validar la entrada
  if ((!imageUrl && !imageBase64) || (imageUrl && imageBase64)) {
    return res.status(400).json({ status: "error", message: "Debe proporcionar 'imageUrl' o 'imageBase64', pero no ambos." });
  }
  if (!OLLAMA_QWEN_URL || !TIKA_URL) {
    console.error('Error: URLs de servicios no configuradas en .env');
    return res.status(500).json({ status: "error", message: "El servidor no está configurado correctamente." });
  }

  try {
    let imageBuffer;

    // 2. Normalizar la imagen a un buffer binario
    console.log('[Vision Tool] Normalizando la imagen de entrada.');
    if (imageBase64) {
      const base64Data = imageBase64.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else { // imageUrl
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      imageBuffer = response.data;
    }
    console.log(`[Vision Tool] Imagen normalizada a un buffer de ${imageBuffer.length} bytes.`);


    // 3. Ejecutar análisis en paralelo
    console.log('[Vision Tool] Iniciando análisis en paralelo (Qwen + Tika).');
    const [qwenResult, tikaResult] = await Promise.all([
      // --- Llamada a Ollama (Qwen) ---
      axios.post(`${OLLAMA_QWEN_URL}/api/generate`, {
        model: OLLAMA_MODEL_NAME,
        prompt: VISION_PROMPT,
        images: [imageBuffer.toString('base64')], // Ollama API espera Base64 sin prefijo
        stream: false,
      }),
      // --- Llamada a Tika (metadatos + OCR) ---
      Promise.all([
        axios.put(`${TIKA_URL}/tika`, imageBuffer, {
          headers: { 'Content-Type': 'application/octet-stream', 'Accept': 'text/plain' },
        }),
        axios.put(`${TIKA_URL}/meta`, imageBuffer, {
          headers: { 'Content-Type': 'application/octet-stream', 'Accept': 'application/json' },
        }),
      ]),
    ]);
    console.log('[Vision Tool] Análisis en paralelo completado.');

    // 4. Consolidar la respuesta
    const qwen_analysis = qwenResult.data.response;
    const tika_ocr_content = tikaResult[0].data;
    const tika_metadata = tikaResult[1].data;

    res.json({
      status: 'success',
      qwen_analysis: qwen_analysis,
      tika_data: {
        metadata: tika_metadata,
        ocr_content: tika_ocr_content,
      },
      presentation_suggestion: "Presenta al usuario la descripción principal del análisis de visión de Qwen. Utiliza los metadatos de Tika como información técnica complementaria si es relevante o solicitado. El texto OCR de Tika puede servir como una verificación del texto extraído por Qwen."
    });

  } catch (error) {
    console.error('[Vision Tool] Error durante el análisis de la imagen:', error.response?.data || error.message);
    res.status(500).json({
      status: "error",
      message: "No se pudo procesar la imagen."
    });
  }
});

export default router;