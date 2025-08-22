// /tools/asr/router.js

import express from 'express';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Almacenar el archivo en memoria

// --- CONFIGURACIÓN DE LA HERRAMIENTA ---
const ASR_URL = process.env.ASR_URL;
const ASR_API_KEY = process.env.ASR_API_KEY;

/**
 * @openapi
 * /transcribe:
 *   post:
 *     summary: Transcribe un archivo de audio a texto.
 *     description: Recibe un archivo de audio, lo envía al servicio Whisper ASR y devuelve el texto transcrito.
 *     operationId: transcribeAudioFile
 *     tags: [ASR]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio_file:
 *                 type: string
 *                 format: binary
 *                 description: "El archivo de audio a transcribir (ej. mp3, wav, ogg)."
 *     responses:
 *       '200':
 *         description: Transcripción exitosa.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 transcription:
 *                   type: string
 *                   description: "El texto extraído del archivo de audio."
 *                 presentation_suggestion:
 *                   type: string
 *                   description: "Guía para el LLM sobre cómo usar la transcripción."
 *       '400':
 *         description: Petición inválida (ej. no se subió ningún archivo).
 *       '500':
 *         description: Error interno del servidor o del servicio ASR.
 */
router.post('/transcribe', upload.single('audio_file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: "error", message: "No se ha subido ningún archivo de audio." });
  }

  if (!ASR_URL || !ASR_API_KEY) {
    console.error('Error: Variables de entorno para ASR no configuradas.');
    return res.status(500).json({ status: "error", message: 'El servicio ASR no está configurado correctamente.' });
  }

  try {
    console.log(`[ASR Tool] Procesando archivo subido: ${req.file.originalname} (${req.file.size} bytes)`);

    // 1. Crear un formulario de datos para enviar a Whisper
    const form = new FormData();
    form.append('audio_file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // 2. Llamar al servicio Whisper ASR
    const asrResponse = await axios.post(
      `${ASR_URL}/asr`,
      form,
      {
        headers: {
          ...form.getHeaders(), // Importante para multipart/form-data
          'X-API-Key': ASR_API_KEY,
        },
      }
    );

    const transcriptionText = asrResponse.data;
    if (!transcriptionText || typeof transcriptionText !== 'string') {
        console.error('[ASR Tool] La respuesta de Whisper no fue texto válido:', transcriptionText);
        throw new Error('La respuesta del servicio ASR no fue válida.');
    }
    console.log('[ASR Tool] Transcripción recibida exitosamente.');

    // 3. Devolver la respuesta con el texto, usando la variable correcta
    res.json({
      status: 'success',
      transcription: transcriptionText,
      presentation_suggestion: `Utiliza este texto para responder a la consulta del usuario.`
    });

  } catch (error) {
    console.error('[ASR Tool] Error durante la transcripción:', error.response?.data || error.message);
    res.status(500).json({
      status: "error",
      message: "No se pudo transcribir el archivo de audio."
    });
  }
});

export default router;