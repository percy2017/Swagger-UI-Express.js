// /tools/tts/router.js

import express from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// --- CONFIGURACIÓN DE LA HERRAMIENTA ---
const TTS_URL = process.env.TTS_URL;
const TTS_API_KEY = process.env.TTS_API_KEY;
const PUBLIC_SERVER_URL = process.env.PUBLIC_SERVER_URL;
const DEFAULT_VOICE = process.env.DEFAULT_VOICE;

/**
 * @openapi
 * /generate-speech:
 *   post:
 *     summary: Convierte texto a voz y devuelve una URL al audio.
 *     description: Recibe un texto y opcionalmente una voz, genera un archivo de audio .mp3 y lo sirve como un artefacto a través de una URL pública.
 *     operationId: generateSpeechFromText
 *     tags: [TTS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: "El texto que se convertirá en audio."
 *                 example: "Hola mundo, esta es una prueba de la herramienta de texto a voz."
 *               voice:
 *                 type: string
 *                 description: "Opcional. El identificador de la voz a usar."
 *                 default: "es-ES-ElviraNeural"
 *                 example: "es-BO-MarceloNeural"
 *             required:
 *               - text
 *     responses:
 *       '200':
 *         description: Audio generado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 audio_url:
 *                   type: string
 *                   format: uri
 *                   description: "La URL pública del archivo de audio .mp3 generado."
 *                 presentation_suggestion:
 *                   type: string
 *                   description: "Guía para el LLM sobre cómo presentar la información."
 *       '400':
 *         description: Petición inválida (falta el texto).
 *       '500':
 *         description: Error interno del servidor o del servicio TTS.
 */
router.post('/generate-speech', async (req, res) => {
  const { text, voice = DEFAULT_VOICE } = req.body;

  if (!text) {
    return res.status(400).json({ status: "error", message: "El parámetro 'text' es requerido." });
  }
  if (!TTS_URL || !TTS_API_KEY || !PUBLIC_SERVER_URL) {
    console.error('Error: Variables de entorno para TTS o URL pública no configuradas.');
    return res.status(500).json({ status: "error", message: 'El servicio TTS no está configurado correctamente.' });
  }

  try {
    console.log(`[TTS Tool] Petición para generar audio con la voz: ${voice}`);
    
    // 1. Llamar al servicio TTS para obtener los datos binarios del audio
    const ttsResponse = await axios.post(
      `${TTS_URL}/v1/audio/speech`,
      {
        input: text,
        voice: voice,
      },
      {
        headers: {
          'Authorization': `Bearer ${TTS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer', // ¡Importante para recibir datos binarios!
      }
    );

    // 2. Generar un nombre de archivo único y definir la ruta
    const filename = `${uuidv4()}.mp3`;
    const filePath = path.join('static', 'tts', filename);

    // 3. Guardar el archivo de audio en el disco
    await fs.writeFile(filePath, ttsResponse.data);
    console.log(`[TTS Tool] Audio guardado exitosamente en: ${filePath}`);

    // 4. Construir la URL pública
    const audioUrl = `${PUBLIC_SERVER_URL}/static/tts/${filename}`;

    // 5. Devolver la respuesta con la URL del artefacto
    res.json({
      status: 'success',
      audio_url: audioUrl,
      presentation_suggestion: `Informa al usuario que su audio ha sido generado. Proporciónale el siguiente enlace para que pueda escucharlo: ${audioUrl}. Puedes presentarlo como un reproductor de audio si es posible.`
    });

  } catch (error) {
    console.error('[TTS Tool] Error durante la generación de audio:', error.response?.data?.toString() || error.message);
    res.status(500).json({
      status: "error",
      message: "No se pudo generar el archivo de audio."
    });
  }
});

export default router;