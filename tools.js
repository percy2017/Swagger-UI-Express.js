// tools.js

export const openApiSpec = {
  "openapi": "3.1.0",
  "info": {
    "title": "Servidor de Herramientas KipuxAI",
    "version": "1.0.0",
    "description": "Servidor de herramienta para realizar busquedas por internet con searXNG , screapear paginas web con browserless y leer documentos con tika apache."
  },
  "paths": {
    "/web-search": {
      "post": {
        "summary": "Herramienta para realizar buscquedas por internet.",
        "operationId": "webSearch",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "query": {
                    "type": "string",
                    "description": "Los términos a buscar en la web."
                  }
                },
                "required": ["query"]
              }
            }
          }
        }
      }
    }
  }
};