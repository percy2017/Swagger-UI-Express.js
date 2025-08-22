# Servidor de Herramientas KipuxAI para cualquier cliente compatible con OpenAI

Este proyecto es un **gateway de herramientas modular** construido con **Express.js**. Su propósito es integrarse con clientes como **Open Web UI** o actuar como el backend de habilidades para aplicaciones más complejas, como un **SaaS de Chatbots RAG**.

Actúa como un puente centralizado hacia varios servicios (SearXNG, Ollama, PostgreSQL/pgvector, etc.), permitiendo un control granular sobre las capacidades disponibles para un LLM.

## ✨ Características Principales

*   **Control Granular**: Cada herramienta expone su propia especificación OpenAPI, permitiendo activarlas y desactivarlas individualmente.
*   **Arquitectura Modular y Escalable**: Cada herramienta vive en su propio módulo autocontenido (`/tools`), facilitando el mantenimiento y la adición de nuevas capacidades.
*   **Guía Inteligente para LLMs**: Todas las herramientas incluyen una "sugerencia de presentación" para instruir al LLM sobre la mejor manera de presentar la información.
*   **Búsqueda Web Completa**: Consulta simultáneamente múltiples categorías de **SearXNG**.
*   **Scraping y Creación de Artefactos**: Usa **Browserless** para guardar contenido como `.md` y capturas de pantalla, devolviendo URLs para un consumo mínimo de tokens.
*   **Extracción de Documentos**: Utiliza **Apache Tika** para extraer texto y metadatos de archivos a través de una URL.
*   **Análisis de Visión Avanzado**: Combina **Ollama (Qwen-VL)** para el análisis visual y OCR de alta calidad con **Apache Tika** para metadatos técnicos.
*   **Generación y Transcripción de Audio**: Incluye herramientas para convertir **Texto a Voz** (generando un artefacto .mp3) y **Voz a Texto** (manejando subida de archivos de audio).
*   **Gestión de Memoria Semántica (RAG)**: Incluye herramientas para **generar, almacenar y consultar embeddings de texto** utilizando **Ollama** y **PostgreSQL/pgvector**, formando la base para cualquier sistema RAG.
*   **Rastreo Web Automatizado (Crawler)**: Descubre automáticamente todos los enlaces internos de un sitio web para facilitar la ingesta de datos a gran escala.
*   **Configuración Robusta**: Utiliza precarga de variables de entorno (`--import dotenv/config`) para una configuración segura y consistente en todo el proyecto.

## 🏗️ Arquitectura

El servidor actúa como un orquestador. El archivo principal `server.js` no contiene lógica de herramientas; su única función es cargar y registrar los módulos definidos en la carpeta `/tools`.

Cada subcarpeta dentro de `/tools` es una herramienta independiente y contiene:
1.  `router.js`: La lógica del endpoint (Express.Router).
2.  `spec.js`: La especificación OpenAPI para esa herramienta.
3.  `index.js`: Un archivo que exporta el router y la spec.

## 📋 Requisitos Previos

*   [Node.js](https://nodejs.org/) (v18.x o superior)
*   [npm](https://www.npmjs.com/)
*   Una instancia de **SearXNG** funcionando.
*   Una instancia de **Browserless** funcionando.
*   Una instancia de **Apache Tika** funcionando.
*   Una instancia de **Ollama** con un modelo de visión (ej. `qwen2.5vl:7b`) y un modelo de embeddings (ej. `mxbai-embed-large`) cargados.
*   Una instancia del servidor **openai-edge-tts**.
*   Una instancia del servidor **whisper-asr**.
*   Una base de datos **PostgreSQL** con la extensión **pgvector** activada.

## 🚀 Instalación y Configuración

1.  **Clona el repositorio e instala dependencias:**
    ```bash
    git clone https://github.com/tu-usuario/tu-repositorio.git
    cd tu-repositorio
    npm install
    ```

2.  **Configura la Base de Datos PostgreSQL:**
    Conéctate a tu base de datos y ejecuta el siguiente script para crear la tabla necesaria para los embeddings.
    ```sql
    -- Activar la extensión pgvector (solo una vez por base de datos)
    CREATE EXTENSION IF NOT EXISTS vector;

    -- Crear la tabla para almacenar los embeddings
    CREATE TABLE IF NOT EXISTS vector_store (
        id SERIAL PRIMARY KEY,
        content_hash VARCHAR(255) NOT NULL,
        text_chunk TEXT NOT NULL,
        embedding VECTOR(1024) -- Dimensión para mxbai-embed-large
    );

    -- Crear índices para acelerar las búsquedas
    CREATE INDEX IF NOT EXISTS idx_vector_store_hash ON vector_store (content_hash);
    CREATE INDEX IF NOT EXISTS idx_vector_store_vector ON vector_store USING hnsw (embedding vector_cosine_ops);
    ```

3.  **Configura tus variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade las siguientes variables:
    ```dotenv
    # --- Configuración General del Servidor ---
    PORT=5005
    PUBLIC_SERVER_URL=http://<IP_DE_TU_VPS>:5005

    # --- Servicios de Búsqueda y Scraping ---
    SEARXNG_URL=http://<IP_DE_TU_VPS>:5007
    BROWSERLESS_URL=ws://<IP_DE_TU_VPS>:5006
    BROWSERLESS_TOKEN=browserless2025

    # --- Servicio de Documentos ---
    TIKA_URL=http://<IP_DE_TU_VPS>:5008

    # --- Servicios de Ollama ---
    OLLAMA_QWEN_URL=http://<IP_DE_TU_VPS>:11436
    OLLAMA_MODEL_NAME=qwen2.5vl:7b
    OLLAMA_EMBED_URL=http://<IP_DE_TU_VPS>:11434
    OLLAMA_EMBED_MODEL_NAME=mxbai-embed-large

    # --- Servicios de Audio ---
    TTS_URL=http://<IP_DE_TU_VPS>:5002
    TTS_API_KEY=edge2025
    DEFAULT_VOICE=es-ES-ElviraNeural
    ASR_URL=http://<IP_DE_TU_VPS>:5003
    ASR_API_KEY=whisper2025

    # --- Configuración de PostgreSQL (pgvector) ---
    PG_USER=tu_usuario
    PG_HOST=tu_ip_o_localhost
    PG_DATABASE=embeddings
    PG_PASSWORD=tu_contraseña
    PG_PORT=5432
    ```

## ▶️ Uso

Los scripts en `package.json` ya están configurados para precargar las variables de entorno.

*   **Modo de Desarrollo:**
    ```bash
    npm run dev
    ```
*   **Modo de Producción:**
    ```bash
    npm start
    ```

## 🧪 Pruebas con Postman

### Búsqueda
*   `POST /api/search/web-search`
*   **Body (JSON):** `{"query": "superconductores", "count": 2}`

### Scraping
*   `POST /api/scrape/scrape-url`
*   **Body (JSON):** `{"url": "https://www.xataka.com"}`

### Extracción de Documentos
*   `POST /api/extract/from-url`
*   **Body (JSON):** `{"url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}`

### Análisis de Visión
*   `POST /api/vision/analyze`
*   **Body (JSON):** `{"imageUrl": "https://ollama.com/public/ollama.png"}`

### Texto a Voz (TTS)
*   `POST /api/tts/generate-speech`
*   **Body (JSON):** `{"text": "Hola mundo.", "voice": "es-BO-SofiaNeural"}`

### Voz a Texto (ASR)
*   `POST /api/asr/transcribe`
*   **Body (form-data):** `KEY: audio_file`, `VALUE: (Selecciona un archivo)`

### Gestión de Embeddings (Flujo de 2 Pasos)
1.  **Crear Conocimiento:**
    *   `POST /api/embeddings/create`
    *   **Body (JSON):** `{"text": "El envío tarda de 3 a 5 días."}`
    *   *Copia el `content_hash` de la respuesta.*
2.  **Consultar Conocimiento:**
    *   `POST /api/embeddings/query`
    *   **Body (JSON):** `{"content_hash": "tu-hash-copiado", "query_text": "¿Cuánto tarda la entrega?"}`

### Crawler
*   `POST /api/crawl/get-links`
*   **Body (JSON):** `{"url": "https://kipux.com/"}`

## 🔗 Integración con Open Web UI

Registra cada herramienta en **Configuración > Modelos > Servidores de Herramientas OpenAPI**:
*   `http://<IP_DE_TU_VPS>:5005/api/search/openapi.json`
*   `http://<IP_DE_TU_VPS>:5005/api/scrape/openapi.json`
*   `http://<IP_DE_TU_VPS>:5005/api/extract/openapi.json`
*   `http://<IP_DE_TU_VPS>:5005/api/vision/openapi.json`
*   `http://<IP_DE_TU_VPS>:5005/api/tts/openapi.json`
*   `http://<IP_DE_TU_VPS>:5005/api/asr/openapi.json`
*   `http://<IP_DE_TU_VPS>:5005/api/embeddings/openapi.json`
*   `http://<IP_DE_TU_VPS>:5005/api/crawl/openapi.json`

## 🗺️ Hoja de Ruta (Roadmap)

### Fase 1: Motor de Herramientas (Completada)
-   [x] **Búsqueda** (SearXNG)
-   [x] **Scraping** (Browserless)
-   [x] **Extracción de Documentos** (Tika)
-   [x] **Análisis de Visión** (Ollama + Tika)
-   [x] **Texto a Voz** (TTS)
-   [x] **Voz a Texto** (ASR)
-   [x] **Gestión de Embeddings** (Ollama + pgvector)
-   [x] **Rastreo Web** (Crawler)

### Fase 2: Aplicación SaaS (Próximos Pasos)
-   [ ] **Desarrollo del Servicio SaaS de Chatbots:** Un nuevo proyecto que consumirá este servidor de herramientas.
-   [ ] **Panel de Administración:** Interfaz para que los clientes configuren sus chatbots.
-   [ ] **Widget de Chat:** Componente frontend para insertar en los sitios de los clientes.
-   [ ] **Integración con WooCommerce API** para consultas en tiempo real.
-   [ ] **Manejo de Errores Centralizado** en el servidor de herramientas.
-   [ ] **Sistema de Limpieza de Artefactos** en la carpeta `/static`.