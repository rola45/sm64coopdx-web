# Modelo de datos
Todos los modelos son contratos propuestos, no implementados.

| Entidad | Campos | Reglas y relaciones |
|---|---|---|
| RuntimeManifest | schemaVersion, engineCommit, toolchainVersion, moduleUrl, wasmUrl, assetCompatibilityId | Versionado; mismo commit para js/wasm; URLs mismo origen; sin ROM |
| AssetBundle | id, compatibilityId, digest, size, importedAt, storageMode | Local privado; digest válido; tamaño limitado por manifiesto y cuota; nunca enviado al relay |
| SaveSnapshot | id, schemaVersion, engineCommit, profileId, payload, digest, createdAt | Bytes opacos del motor; importación validada y copia previa; migración explícita si cambia formato |
| Preferences | schemaVersion, volume, bindings, renderScale, locale, reducedMotion | volume 0–1; bindings válidos; renderScale solo opciones soportadas; locale inicial es |
| RuntimeSession | state, phase, bytesLoaded, totalBytes?, error?, saveState | estado efímero; progress indeterminado si no hay total; un runtime activo |
| Room | id, protocolVersion, engineCommit, modSetDigest, capacity, expiresAt | Relay efímero; capacidad 2–4; versiones compatibles; sin assets ni guardados |
| Peer | id, roomId, role, status, lastSeen, sequence | Pertenece a una sala; host único; desconexión elimina presencia |

Runtime: idle → validating → preparing → loading → ready → running ↔ paused → stopped. Cualquier fallo → error; retry vuelve a validating con recursos anteriores liberados. Contexto gráfico perdido → paused/recovering; si no se puede restaurar, error explícito.
Assets: selected → validating → accepted/rejected. No validación parcial presentada como éxito.
Guardado: clean → dirty → flushing → persisted/error. Solo callback de sync exitoso permite mostrar persistido; evitar sync concurrentes.
Sala: creating → waiting → active → closed. Host perdido cierra sala en MVP; sin migración automática. Token de entrada privado, efímero y fuera de logs.
