# Servidor de Herramientas KipuxAI para cualquier cliente compatible con OpenAI

Este proyecto es un **gateway de herramientas modular** construido con **Express.js**. Su propósito es integrarse con clientes como **Open Web UI**, actuando como un puente centralizado hacia varios servicios backend (SearXNG, Browserless, etc.) y permitiendo un control granular sobre qué herramientas están disponibles para el LLM.

A diferencia de un servidor monolítico, esta arquitectura permite registrar cada herramienta de forma individual, dándole al usuario final un interruptor para activar o desactivar cada capacidad.

## ✨ Características Principales

*   **Control Granular**: Cada herramienta expone su propia especificación OpenAPI, permitiendo activarlas y desactivarlas individualmente desde la interfaz del cliente (ej. Open Web UI).
*   **Arquitectura Modular y Escalable**: Cada herramienta vive en su propio módulo autocontenido (`/tools`), facilitando el mantenimiento y la adición de nuevas capacidades.
*   **Búsqueda Multi-Categoría**: La herramienta de búsqueda consulta simultáneamente las categorías `general`, `news`, `videos` e `images` de **SearXNG** y devuelve resultados agregados.
*   **Scraping Avanzado y Generación de Artefactos**: La herramienta de scraping usa **Browserless** para extraer metadatos, guardar el contenido completo en formato `.md` y generar capturas de pantalla, devolviendo enlaces a estos recursos para un consumo mínimo de tokens.
*   **Guía Inteligente para LLMs**: Ambas herramientas incluyen una "sugerencia de presentación" en su respuesta para instruir al LLM sobre la mejor manera de presentar la información al usuario.
*   **Fácil de Configurar**: Utiliza variables de entorno (`.env`) para una configuración segura y flexible.

## 🏗️ Arquitectura

El servidor actúa como un orquestador. El archivo principal `index.js` no contiene lógica de herramientas; su única función es cargar y registrar los módulos definidos en la carpeta `/tools`.

Cada subcarpeta dentro de `/tools` es una herramienta independiente y contiene:
1.  `router.js`: La lógica del endpoint (Express.Router).
2.  `spec.js`: La especificación OpenAPI para esa herramienta.
3.  `index.js`: Un archivo que exporta el router y la spec para ser consumidos por el servidor principal.

## 📋 Requisitos Previos

*   [Node.js](https://nodejs.org/) (v18.x o superior)
*   [npm](https://www.npmjs.com/)
*   Una instancia de **SearXNG** funcionando.
*   Una instancia de **Browserless** funcionando.

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
    # --- Configuración General del Servidor ---
    PORT=5005
    # URL pública base del servidor, sin la barra al final. Esencial para generar los enlaces a los artefactos.
    PUBLIC_SERVER_URL=http://<IP_DE_TU_VPS>:5005

    # --- Configuración de Servicios Externos ---
    # URL de tu instancia de SearXNG
    SEARXNG_URL=http://<IP_DE_TU_VPS>:5007

    # URL WebSocket de tu instancia de Browserless
    BROWSERLESS_URL=ws://<IP_DE_TU_VPS>:5006
    # Token de seguridad para Browserless (si lo tienes configurado)
    BROWSERLESS_TOKEN=browserless2025
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

## 🧪 Pruebas con Postman

Se recomienda usar un cliente de API como **Postman** o **Thunder Client** para las pruebas.

### Probar la Herramienta de Búsqueda
1.  **Método:** `POST`
2.  **URL:** `http://localhost:5005/api/search/web-search`
3.  **Body (raw, JSON):**
    ```json
    {
      "query": "superconductores a temperatura ambiente",
      "count": 3
    }
    ```

### Probar la Herramienta de Scraping
1.  **Método:** `POST`
2.  **URL:** `http://localhost:5005/api/scrape/scrape-url`
3.  **Body (raw, JSON):**
    ```json
    {
      "url": "https://www.xataka.com"
    }
    ```

## 🔗 Integración con Open Web UI

Para lograr el control granular, debes registrar cada herramienta como un servidor independiente.

1.  En Open Web UI, ve a **Configuración > Modelos** y selecciona el modelo a configurar.
2.  Activa **"Herramientas" (Tools)**.
3.  En **"Servidores de Herramientas OpenAPI"**, añade una entrada por cada herramienta:

    *   **Para la Búsqueda:**
        ```
        http://<IP_DE_TU_VPS>:5005/api/search/openapi.json
        ```
    *   **Para el Scraping (añade una nueva entrada):**
        ```
        http://<IP_DE_TU_VPS>:5005/api/scrape/openapi.json
        ```
4.  Guarda los cambios. Ahora verás ambas herramientas en la lista, cada una con su propio interruptor.

## 🗺️ Hoja de Ruta (Roadmap)

-   [x] **Implementada Herramienta de Búsqueda Multi-Categoría** con SearXNG.
-   [x] **Implementada Herramienta de Scraping Avanzado** con Browserless, generando artefactos y enlaces.
-   [ ] **Crear el módulo de herramienta para extracción de texto con Apache Tika.**
-   [ ] Centralizar el manejo de errores con un middleware global.
-   [ ] Implementar un sistema de limpieza para los artefactos generados en la carpeta `/static`.