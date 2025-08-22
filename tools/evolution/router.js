import express from 'express';
import axios from 'axios';

const router = express.Router();

// --- Configuración y Cliente API ---
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

// Middleware para verificar que la configuración exista
const checkConfig = (req, res, next) => {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        console.error('[Evolution Tool] Error: La configuración de Evolution API (URL/KEY) no está completa.');
        return res.status(500).json({ status: "error", message: 'El servicio de Evolution API no está configurado en el servidor.' });
    }
    next();
};
router.use(checkConfig);

// Cliente Axios pre-configurado para todas las peticiones
const apiClient = axios.create({
    baseURL: EVOLUTION_API_URL,
    headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
    }
});

// --- Rutas de la Herramienta ---

/**
 * @openapi
 * /instances/create:
 *   post:
 *     summary: Crea una nueva instancia de WhatsApp.
 *     description: Inicia el proceso de creación de una instancia. El QR y los cambios de estado se recibirán a través del stream de eventos global.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               instanceName:
 *                 type: string
 *                 description: Nombre único para la instancia.
 *                 example: "ventas_equipo_1"
 *             required:
 *               - instanceName
 *     responses:
 *       200:
 *         description: La solicitud de creación fue enviada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Solicitud de creación de instancia 'ventas_equipo_1' enviada. Monitorea los eventos para ver el código QR."
 *                 presentation_suggestion:
 *                   type: string
 */
router.post('/instances/create', async (req, res) => {
    const { instanceName } = req.body;
    try {
        await apiClient.post('/instance/create', { instanceName, qrcode: true });
        res.json({
            status: 'success',
            message: `Solicitud de creación de instancia '${instanceName}' enviada. Monitorea los eventos para ver el código QR.`,
            presentation_suggestion: `He iniciado la creación de la instancia de WhatsApp '${instanceName}'. Por favor, escanea el código QR que aparecerá en el monitor de eventos para continuar.`
        });
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Error desconocido al crear la instancia.';
        console.error(`[Evolution Tool] Error creando instancia ${instanceName}:`, errorMessage);
        res.status(500).json({ status: 'error', message: errorMessage });
    }
});

/**
 * @openapi
 * /messages/send:
 *   post:
 *     summary: Envía un mensaje de texto.
 *     description: Envía un mensaje de texto a un número de WhatsApp usando una instancia conectada.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               instanceName:
 *                 type: string
 *                 description: Nombre de la instancia que enviará el mensaje.
 *                 example: "ventas_equipo_1"
 *               number:
 *                 type: string
 *                 description: Número del destinatario con código de país (ej. 5917xxxxxxx).
 *                 example: "59171234567"
 *               text:
 *                 type: string
 *                 description: El contenido del mensaje a enviar.
 *                 example: "Hola, este es un mensaje de prueba."
 *             required:
 *               - instanceName
 *               - number
 *               - text
 *     responses:
 *       200:
 *         description: Mensaje enviado con éxito.
 */
router.post('/messages/send', async (req, res) => {
    const { instanceName, number, text } = req.body;
    try {
        const response = await apiClient.post(`/message/sendText/${instanceName}`, {
            number,
            textMessage: { text }
        });
        res.json({
            status: 'success',
            details: response.data,
            presentation_suggestion: `Mensaje enviado a ${number} desde la instancia ${instanceName}.`
        });
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Error desconocido al enviar el mensaje.';
        console.error(`[Evolution Tool] Error enviando mensaje desde ${instanceName}:`, errorMessage);
        res.status(500).json({ status: 'error', message: errorMessage });
    }
});

/**
 * @openapi
 * /instances/{instanceName}:
 *   delete:
 *     summary: Elimina una instancia de WhatsApp.
 *     description: Cierra la sesión (si está conectada) y elimina permanentemente una instancia.
 *     parameters:
 *       - in: path
 *         name: instanceName
 *         required: true
 *         schema:
 *           type: string
 *         description: El nombre de la instancia a eliminar.
 *     responses:
 *       200:
 *         description: Instancia eliminada con éxito.
 */
router.delete('/instances/:instanceName', async (req, res) => {
    const { instanceName } = req.params;
    try {
        await apiClient.delete(`/instance/logout/${instanceName}`);
        await apiClient.delete(`/instance/delete/${instanceName}`);
        res.json({
            status: 'success',
            message: `Instancia '${instanceName}' eliminada correctamente.`,
            presentation_suggestion: `He eliminado la instancia de WhatsApp '${instanceName}'.`
        });
    } catch (error) {
        // Ignoramos errores si la instancia no existía, ya que el resultado es el deseado.
        if (error.response && error.response.status === 404) {
            return res.json({
                status: 'success',
                message: `La instancia '${instanceName}' no existía, pero se considera la operación exitosa.`,
                presentation_suggestion: `La instancia '${instanceName}' no existía, por lo que no fue necesario eliminarla.`
            });
        }
        const errorMessage = error.response?.data?.message || 'Error desconocido al eliminar la instancia.';
        console.error(`[Evolution Tool] Error eliminando instancia ${instanceName}:`, errorMessage);
        res.status(500).json({ status: 'error', message: errorMessage });
    }
});

export default router;