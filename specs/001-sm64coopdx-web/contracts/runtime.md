# Contrato launcher ↔ motor v1
Frontera propuesta sobre módulo Emscripten modularizado, sin depender de nombres internos no auditados.

Operaciones asíncronas: initialize(manifest, canvas, assets), start(), pause(), resume(), flushSave(), exportSave(), importSave(bytes), dispose(). Un solo initialize activo. initialize resuelve únicamente tras montar FS, recuperar persistencia y validar assets. start requiere ready y gesto de usuario para audio. importSave exige motor detenido y backup previo; flushSave resuelve al completar persistencia. dispose libera audio, input y contexto.

Eventos: phaseChanged, progress {loaded,total?}, ready, running, paused, savePersisted, error {code,message,retryable}. Códigos: UNSUPPORTED_BROWSER, INVALID_ASSETS, STORAGE_FULL, SAVE_INCOMPATIBLE, RUNTIME_INIT_FAILED, GRAPHICS_CONTEXT_LOST. Logs exportables sin rutas privadas, assets ni tokens. No exponer comandos Lua arbitrarios desde la página.

Packaging: manifiesto fija commit y herramientas; js/wasm consistentes, application/wasm, huella de contenido y control de errores de caché. Assets del usuario permanecen en almacenamiento privado. Si se introducen threads, exigir COOP/COEP y comprobar crossOriginIsolated; el MVP intenta ejecución sin pthreads.
