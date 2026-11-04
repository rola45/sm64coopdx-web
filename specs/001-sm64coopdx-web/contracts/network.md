# Transporte cooperativo web v1 — propuesta sujeta a spike
WSS mismo origen bajo /relay. Sala privada de 2–4 clientes; relay de paquetes y ciclo de vida, sin autoridad de simulación inventada. Host conserva responsabilidad compatible con el motor; se debe auditar esa responsabilidad en upstream antes de implementar.

Control JSON: create {protocolVersion,engineCommit,modSetDigest,capacity}; join {roomCode,token,protocolVersion,engineCommit,modSetDigest}; leave {}; ping {nonce}. Respuestas: created/joined {roomId,peerId,hostPeerId}; peerJoined/peerLeft; pong; error {code}. Token generado en servidor, expira y no se registra. Servidor rechaza diferencias de versión/mods, sala llena y mensajes fuera de estado.

Datos: payload binario del protocolo del motor encapsulado con versión, destinatario, secuencia y longitud. El layout exacto se fija tras auditar packet send/receive en M4; no se presume interoperabilidad nativa. Límite propuesto 64 KiB por mensaje y 256 mensajes/s por peer, ajustable con medición de paquetes reales; rechazar exceso sin reservar memoria ilimitada. Verificar membresía y destinatario; no confiar en peerId suministrado por cliente.

WSS es fiable y ordenado; no reproduce automáticamente semántica UDP. Adaptador debe preservar canales/entrega y descartar actualizaciones obsoletas cuando corresponda. Medir latencia/colas antes de aceptar; alternativa WebRTC si bloqueo por orden impide aceptación. Keepalive 10 s, timeout propuesto 30 s. Pérdida de host cierra sala; sin reconexión silenciosa ni migración en v1. Validar Origin, límites por conexión y códigos de sala resistentes a enumeración.

Aceptación: dos navegadores, mismo nivel y enemigos/eventos, 20 min; repetir con latencia 100 ms y pérdida simulada del enlace antes de WSS; comparar comportamiento, no solo conexión establecida.
