# Servidor de Herramientas KipuxAI para Open Web UI

Este proyecto es un **gateway de herramientas modular** construido con **Express.js**. Su propósito es integrarse con **Open Web UI**, actuando como un puente centralizado hacia varios servicios backend (SearXNG, Browserless, etc.) y permitiendo un control granular sobre qué herramientas están disponibles para el LLM.

A diferencia de un servidor monolítico, esta arquitectura permite registrar cada herramienta de forma individual en Open Web UI, dándole al usuario final un interruptor para activar o desactivar cada capacidad.

## ✨ Características Principales

*   **Control Granular en Open Web UI**: Cada herramienta expone su propia especificación OpenAPI, permitiendo activarlas y desactivarlas individualmente desde la interfaz.
*   **Arquitectura Modular y Escalable**: Cada herramienta vive en su propio módulo autocontenido (`/tools`), facilitando el mantenimiento y la adición de nuevas capacidades sin afectar al resto del sistema.
*   **Gateway Centralizado**: Un único servidor Express gestiona todas las herramientas, simplificando el despliegue y la configuración de middlewares globales como CORS y logging.
*   **Búsqueda Web Potenciada**: Incluye un módulo de búsqueda listo para usar con **SearXNG**.
*   **Fácil de Configurar**: Utiliza variables de entorno (`.env`) para una configuración segura.
*   **Desarrollo Eficiente**: Incluye `nodemon` para reinicio automático del servidor.

## 🏗️ Arquitectura

El servidor actúa como un orquestador. El archivo principal `index.js` no contiene lógica de herramientas; su única función es cargar y registrar los módulos definidos en la carpeta `/tools`.

Cada subcarpeta dentro de `/tools` representa una herramienta independiente y debe contener:
1.  `router.js`: La lógica del endpoint (Express.Router).
2.  `spec.js`: La generación de la especificación OpenAPI para esa herramienta específica.
3.  `index.js`: Un archivo que exporta el router y la spec para ser consumidos por el servidor principal.

## 📋 Requisitos Previos

*   [Node.js](https://nodejs.org/) (v18.x o superior)
*   [npm](https://www.npmjs.com/)
*   Una instancia de [SearXNG](https://docs.searxng.org/admin/installation.html) funcionando.

## 🚀 Instalación y Configuración

1.  **Clona el repositorio e instala dependencias:**
    ```bash
    git clone https://github.com/tu-usuario/tu-repositorio.git
    cd tu-repositorio
    npm install
    ```

2.  **Configura tus variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade las siguientes variables:
    ```dotenv
    # Puerto para el servidor Express
    PORT=5005

    # URL de tu instancia de SearXNG
    SEARXNG_URL=http://tu-instancia-searxng:8080
    ```

## ▶️ Uso

*   **Modo de Desarrollo:**
    ```bash
    npm run dev
    ```
*   **Modo de Producción:**
    ```bash
    npm start
    ```
El servidor estará disponible en `http://localhost:5005`.

## 🧪 Pruebas con Postman

Dado que este servidor no expone una UI de documentación unificada, se recomienda usar un cliente de API como **Postman** o **Thunder Client** para las pruebas.

### Probar la Herramienta de Búsqueda

1.  **Método:** `POST`
2.  **URL:** `http://localhost:5005/api/search/web-search`
3.  **Body:**
    *   Selecciona `raw` y `JSON`.
    *   Pega el siguiente contenido:
        ```json
        {
          "query": "noticias sobre tecnología",
          "count": 3
        }
        ```
4.  **Headers:** Asegúrate de que `Content-Type` esté configurado como `application/json`.
5.  Haz clic en **Send**. Deberías recibir una respuesta `200 OK` con los resultados de la búsqueda.

## 🔗 Integración con Open Web UI

Para lograr el control granular, debes registrar cada herramienta como un servidor de herramientas independiente.

### Registrar la Herramienta de Búsqueda:

1.  En Open Web UI, ve a **Configuración > Modelos** y selecciona el modelo a configurar.
2.  Activa la opción de **"Herramientas" (Tools)**.
3.  En **"Servidores de Herramientas OpenAPI"**, añade una nueva entrada con la URL de la especificación de la herramienta de búsqueda:

    ```
    http://<IP_o_dominio_de_tu_servidor>:5005/api/search/openapi.json
    ```
4.  Guarda los cambios. Ahora verás "Herramienta de Búsqueda Web (KipuxAI)" como un ítem individual que puedes activar o desactivar.

Cuando añadas nuevas herramientas (ej. 'scrape'), repetirás este paso con su URL de especificación respectiva (`.../api/scrape/openapi.json`), añadiéndola como una nueva entrada en la lista.

## 🗺️ Hoja de Ruta (Roadmap)

-   [ ] Crear el módulo de herramienta para scraping web con **Browserless**.
-   [ ] Crear el módulo de herramienta para extracción de texto con **Apache Tika**.
-   [ ] Centralizar el manejo de errores con un middleware global.