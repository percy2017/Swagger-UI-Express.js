// Copia y pega este CÓDIGO COMPLETO en /tools/evolution/router.js

import express from 'express';
import axios from 'axios';

const router = express.Router();

// --- CONFIGURACIÓN DE LA HERRAMIENTA ---
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

const apiClient = axios.create({
  baseURL: EVOLUTION_API_URL,
  headers: {
    'apikey': EVOLUTION_API_KEY,
    'Content-Type': 'application/json'
  }
});

// --- NUEVO: GESTOR DE CONEXIONES SSE (EL CEREBRO EN TIEMPO REAL) ---
// Este objeto guardará las conexiones abiertas de los clientes que están escuchando.
// La clave será el `instanceName` y el valor será el objeto `response` de Express.
const sseClients = {};

const checkConfig = (req, res, next) => {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.error('[Evolution Tool] Error: La configuración de Evolution API no está completa.');
    return res.status(500).json({ status: "error", message: 'El servicio de Evolution API no está configurado correctamente.' });
  }
  next();
};

router.use(checkConfig);

// --- NUEVO: ENDPOINT SSE PARA ESCUCHAR ACTUALIZACIONES DE ESTADO ---
/**
 * @swagger
 * /instances/{instanceName}/status-stream:
 *   get:
 *     summary: Se suscribe a los cambios de estado de una instancia en tiempo real.
 *     description: Abre una conexión Server-Sent Events (SSE) que se mantiene viva. El servidor enviará eventos a través de esta conexión cada vez que el estado de la instancia cambie (ej. de 'qrcode' a 'open').
 *     operationId: getInstanceStatusStream
 *     tags: [Evolution Manager - Real-Time]
 *     parameters:
 *       - in: path
 *         name: instanceName
 *         required: true
 *         schema:
 *           type: string
 *         description: El nombre de la instancia a la que suscribirse.
 *     responses:
 *       '200':
 *         description: Conexión SSE establecida. Los eventos se enviarán a medida que ocurran.
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: "data: {\"instance\":\"test\",\"event\":\"connection.update\",\"data\":{\"state\":\"open\"}}\n\n"
 */
router.get('/instances/:instanceName/status-stream', (req, res) => {
    const { instanceName } = req.params;
    console.log(`[Evolution Tool - SSE] Cliente conectado para escuchar a la instancia: ${instanceName}`);

    // Configurar los headers para SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders(); // Enviar los headers inmediatamente

    // Guardar la conexión del cliente
    sseClients[instanceName] = res;

    // Enviar un mensaje de confirmación de conexión
    res.write(`data: {"status": "connected", "instanceName": "${instanceName}"}\n\n`);

    // Limpiar la conexión si el cliente se desconecta
    req.on('close', () => {
        console.log(`[Evolution Tool - SSE] Cliente para ${instanceName} se ha desconectado.`);
        delete sseClients[instanceName];
        res.end();
    });
});

// --- NUEVO: ENDPOINT WEBHOOK PARA RECIBIR NOTIFICACIONES DE EVOLUTION API ---
/**
 * @swagger
 * /webhook:
 *   post:
 *     summary: Endpoint para recibir webhooks de Evolution API.
 *     description: Evolution API debe ser configurado para enviar notificaciones a esta URL. Este endpoint procesa los eventos y los retransmite a los clientes suscritos a través de SSE.
 *     operationId: handleEvolutionWebhook
 *     tags: [Evolution Manager - Real-Time]
 *     requestBody:
 *       description: El payload del webhook enviado por Evolution API.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Webhook recibido y procesado.
 */
router.post('/webhook', (req, res) => {
    const webhookPayload = req.body;
    const instanceName = webhookPayload.instance;

    console.log(`[Evolution Tool - Webhook] Webhook recibido para la instancia: ${instanceName}`);
    console.log(`[Evolution Tool - Webhook] Payload:`, JSON.stringify(webhookPayload, null, 2));

    // Buscar si hay algún cliente escuchando por esta instancia
    const clientRes = sseClients[instanceName];

    if (clientRes) {
        console.log(`[Evolution Tool - Webhook] Cliente encontrado para ${instanceName}. Retransmitiendo evento...`);
        // Enviar el payload completo del webhook al cliente a través de SSE
        clientRes.write(`data: ${JSON.stringify(webhookPayload)}\n\n`);
    } else {
        console.log(`[Evolution Tool - Webhook] No hay clientes escuchando por ${instanceName}. Descartando evento.`);
    }

    // Responder a Evolution API inmediatamente con un 200 OK para que sepa que recibimos el webhook
    res.status(200).send('Webhook received');
});

// --- RUTAS DE GESTIÓN DE INSTANCIAS (YA DEPURADAS Y ROBUSTAS) ---

router.post('/instances/create', async (req, res) => {
  const { instanceName } = req.body;
  console.log(`[Evolution Tool - createInstance] Petición recibida para crear: ${instanceName}`);
  
  if (!instanceName) {
    console.error('[Evolution Tool - createInstance] Error: Falta instanceName.');
    return res.status(400).json({ status: 'error', message: 'El parámetro "instanceName" es requerido.' });
  }

  const payload = {
    ...req.body,
    integration: "WHATSAPP-BAILEYS",
    qrcode: true
  };

  try {
    const response = await apiClient.post('/instance/create', payload);
    let qrBase64 = response.data.qrcode?.base64;
    if (!qrBase64 && response.data.hash?.apikey) {
        const connectResponse = await apiClient.get(`/instance/connect/${instanceName}`);
        qrBase64 = connectResponse.data.base64;
    }
    
    res.json({
      qrCodeBase64: qrBase64,
      presentation_suggestion: `La instancia '${instanceName}' ha sido creada. Muestra esta imagen QR al usuario para que la escanee con su teléfono.`
    });
  } catch (error) {
    const errorMessage = error.response?.data || error.message;
    console.error('[Evolution Tool - createInstance] Error:', JSON.stringify(errorMessage, null, 2));
    res.status(500).json({ status: 'error', message: typeof errorMessage === 'string' ? errorMessage : 'No se pudo crear la instancia.' });
  }
});

router.get('/instances', async (req, res) => {
    console.log('[Evolution Tool - fetchAllInstances] Petición recibida.');
    try {
      const response = await apiClient.get('/instance/fetchInstances');
      // Limpiamos la respuesta para que sea consistente
      const cleanedInstances = response.data.map(inst => ({
          name: inst.name,
          state: inst.connectionStatus
      }));
      res.json({
        instances: cleanedInstances,
        presentation_suggestion: "Presenta la información de las instancias en una tabla o lista, mostrando el nombre y el estado de cada una."
      });
    } catch (error) {
      const errorMessage = error.response?.data || error.message;
      console.error('[Evolution Tool - fetchAllInstances] Error:', JSON.stringify(errorMessage, null, 2));
      res.status(500).json({ status: 'error', message: 'No se pudieron obtener las instancias.' });
    }
});

router.get('/instances/:instanceName', async (req, res) => {
    const { instanceName } = req.params;
    try {
      const response = await apiClient.get(`/instance/connectionState/${instanceName}`);
      const connectionState = response.data.instance.state;
      res.json({
        instance: { name: instanceName, state: connectionState },
        presentation_suggestion: `Informa directamente el estado de la instancia. Ejemplo: 'La instancia ${instanceName} está ${connectionState}.'`
      });
    } catch (error) {
      const errorMessage = error.response?.data || error.message;
      res.status(500).json({ status: 'error', message: `No se pudo obtener el estado de la instancia ${instanceName}.` });
    }
});

router.delete('/instances/:instanceName', async (req, res) => {
    const { instanceName } = req.params;
    console.log(`[Evolution Tool - deleteInstance] Petición recibida para eliminar: ${instanceName}`);

    try {
        let currentState = '';
        try {
            const stateResponse = await apiClient.get(`/instance/connectionState/${instanceName}`);
            currentState = stateResponse.data.instance.state;
            console.log(`[Evolution Tool - deleteInstance] El estado actual de ${instanceName} es: ${currentState}`);
        } catch (statusError) {
            if (statusError.response && statusError.response.status === 404) {
                return res.json({
                    status: 'success', message: `La instancia ${instanceName} no fue encontrada.`,
                    presentation_suggestion: `Informa al usuario que la instancia '${instanceName}' ya no existía.`
                });
            }
            throw statusError;
        }

        if (currentState === 'CONNECTED' || currentState === 'open') {
            console.log(`[Evolution Tool - deleteInstance] La instancia está conectada. Intentando hacer logout...`);
            await apiClient.delete(`/instance/logout/${instanceName}`);
        } else {
            console.log(`[Evolution Tool - deleteInstance] La instancia no está conectada (estado: ${currentState}). Se omite el logout.`);
        }
        
        console.log(`[Evolution Tool - deleteInstance] Eliminando permanentemente ${instanceName}...`);
        const deleteResponse = await apiClient.delete(`/instance/delete/${instanceName}`);
        
        res.json({
            status: 'success', details: deleteResponse.data,
            presentation_suggestion: `Confirma al usuario que la instancia '${instanceName}' ha sido eliminada con éxito.`
        });
    } catch (error) {
        const errorMessage = error.response?.data || error.message;
        console.error(`[Evolution Tool - deleteInstance] Error CRÍTICO durante el proceso de eliminación de ${instanceName}:`, JSON.stringify(errorMessage, null, 2));
        res.status(500).json({ status: 'error', message: `No se pudo completar la eliminación de la instancia ${instanceName}.` });
    }
});

export default router;