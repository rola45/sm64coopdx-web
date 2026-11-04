# Interfaz y aceptación
Entrada: capacidades → seleccionar archivos → validación → preparación → Jugar. No botón Jugar habilitado antes de runtime listo. Falta de assets muestra instrucción concreta; no mundo simulado. Progreso por fase, indeterminado si no existe total fiable.

Vista principal: juego con pausa y fullscreen accesibles; configuración avanzada dentro de Ajustes. Partidas: exportar/restaurar con validación y copia previa. Online: crear/unirse y estado real; oculto o marcado no disponible hasta M4. Cifras de jugadores solo del relay real.

Desktop 1440×900: lienzo dominante y controles compactos. Móvil 375×812 y 812×375: flujo vertical sin scroll horizontal; al jugar disposición apaisada con safe areas y controles que no tapen HUD. No bloquear zoom de la página completa. Canvas recibe teclado solo jugando; Escape devuelve pausa/foco; campos de texto no envían input al motor. Menús accesibles mediante DOM semántico; esto no implica accesibilidad integral del mundo 3D.

Contraste >=4.5:1 en texto, foco visible, modal con captura/restauración de foco, áreas táctiles >=44 px. Reducir movimiento decorativo con prefers-reduced-motion, no alterar física. Sin autoplay de audio. Revisar mando real y táctil en dispositivos físicos antes de anunciar soporte.
