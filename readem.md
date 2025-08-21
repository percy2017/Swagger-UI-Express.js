# Servidor de Herramientas KipuxAI

Este es un servidor de herramientas backend, construido con **Express.js**, Su propósito es proporcionar al modelo de lenguaje (LLM) capacidades extendidas a través de una API RESTful documentada con **OpenAPI**.

El servidor actúa como un puente unificado hacia varios servicios backend, permitiendo al LLM realizar tareas complejas como búsquedas web, scraping de contenido y extracción de texto de documentos.

## ✨ Características Principales

*   **Integración Nativa con Open Web UI**: Expone un endpoint `/api/openapi.json` que permite a Open Web UI descubrir y utilizar las herramientas de forma automática.
*   **Documentación Interactiva**: Interfaz de **Swagger UI** en la ruta raíz (`/`) para probar y visualizar la API fácilmente.
*   **Arquitectura Modular y Escalable**: Las rutas están organizadas en módulos separados, facilitando el mantenimiento y la adición de nuevas herramientas.
*   **Búsqueda Web Potenciada**: Utiliza **SearXNG** para realizar búsquedas web privadas y sin seguimiento.
*   **Fácil de Configurar**: Utiliza variables de entorno (`.env`) para una configuración segura y flexible.
*   **Desarrollo Eficiente**: Incluye `nodemon` para reinicio automático del servidor durante el desarrollo.

## 📋 Requisitos Previos

*   [Node.js](https://nodejs.org/) (v18.x o superior)
*   [npm](https://www.npmjs.com/)
*   Una instancia de [SearXNG](https://docs.searxng.org/admin/installation.html) funcionando y accesible desde el servidor.

## 🚀 Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/tu-repositorio.git
    cd tu-repositorio
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

## ⚙️ Configuración

1.  Crea un archivo `.env` en la raíz del proyecto.
2.  Añade las siguientes variables de entorno y ajústalas según tu configuración:

    ```dotenv
    # Configuración del Servidor Express
    PORT=5005

    # URL de tu instancia de SearXNG
    SEARXNG_URL=http://tu-instancia-searxng:8080
    ```

## ▶️ Uso

### Modo de Desarrollo

Para iniciar el servidor con reinicio automático al guardar cambios:

```bash
npm run dev
```

El servidor estará escuchando en la URL `http://localhost:5005` (o el puerto que hayas definido).

### Modo de Producción

Para iniciar el servidor en un entorno de producción:

```bash
npm start
```

## 🛠️ API y Herramientas

### Documentación Interactiva

*   **`GET /`**
    *   Muestra la interfaz de **Swagger UI**, donde puedes ver todos los endpoints de la API, sus parámetros y probarlos directamente desde el navegador.

### Endpoints de la API (bajo el prefijo `/api`)

#### `GET /api/openapi.json`

Proporciona la especificación OpenAPI 3.1 autogenerada.
**Esta es la URL que debes registrar en Open Web UI** para que pueda descubrir las herramientas.

#### `POST /api/web-search`

Realiza una búsqueda en la web utilizando la instancia configurada de SearXNG.

*   **Body (JSON):**
    ```json
    {
      "query": "Términos de búsqueda aquí",
      "count": 5 
    }
    ```
    *   `query` (string, **requerido**): Los términos a buscar.
    *   `count` (integer, opcional): El número de resultados a devolver. El valor por defecto es `6`.

*   **Respuesta Exitosa (JSON):**
    ```json
    {
      "status": "success",
      "results": [
        {
          "title": "Título del resultado",
          "url": "https://ejemplo.com",
          "content": "Descripción o snippet del contenido."
        }
      ],
      "suggestions": ["búsqueda relacionada 1", "búsqueda relacionada 2"]
    }
    ```

## 🔗 Integración con Open Web UI

Sigue estos pasos para conectar el servidor de herramientas:

1.  Asegúrate de que tu servidor Express esté corriendo y sea accesible desde tu instancia de Open Web UI.
2.  En Open Web UI, ve a **Configuración > Modelos** y selecciona el modelo que deseas configurar (ej. `Llama 3.1`).
3.  Activa la opción de **"Herramientas" (Tools)**.
4.  En el campo **"Servidores de Herramientas OpenAPI"**, introduce la URL que apunta a tu especificación:

    ```
    http://<IP_o_dominio_de_tu_servidor>:5005/api/openapi.json
    ```

5.  ¡Guarda y listo! Open Web UI ahora consultará ese endpoint para descubrir la herramienta `/api/web-search` y la utilizará cuando sea apropiado.

## 🗺️ Hoja de Ruta (Roadmap)

-   [ ] Implementar la herramienta de scraping web con **Browserless**.
-   [ ] Implementar la herramienta de extracción de texto de documentos con **Apache Tika**.
-   [ ] Centralizar el manejo de errores con un middleware dedicado.
-   [ ] Añadir un sistema de logging más robusto como `morgan`.