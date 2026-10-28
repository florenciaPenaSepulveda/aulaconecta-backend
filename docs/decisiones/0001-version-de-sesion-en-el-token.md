# 0001 · Invalidar sesiones con una versión dentro del token

<!-- REVISAR (Florencia): el "Por qué" está deducido del código y del commit 53f1e171. Ajústalo con lo que realmente pensaste. -->

**Estado:** aceptada

## Contexto

La API usa JWT. Un JWT firmado es válido hasta que expira, aunque el usuario cambie su contraseña o se elimine su cuenta. Hacía falta que, tras esos eventos, los tokens ya emitidos dejaran de funcionar.

## Decisión

Cada usuario tiene un contador `tokenVersion` en la base de datos. El token lleva `{ id, v }` y el guard ([src/guard/guard.ts](../../src/guard/guard.ts)) comprueba en cada petición que `v` coincida con el contador actual ([src/security/session.service.ts](../../src/security/session.service.ts)). Cambiar o restablecer la contraseña incrementa el contador; eliminar al usuario hace que la búsqueda falle. En ambos casos todos los tokens anteriores se rechazan.

## Por qué

- Revoca **todas** las sesiones de un usuario con una sola escritura.
- No hay que guardar los tokens emitidos ni una lista de tokens revocados que crezca y haya que limpiar.
- Es poco código: una columna, una migración y una comprobación en el guard (ver el commit).

## Qué se pierde (tradeoff)

- El JWT deja de ser sin estado: **cada petición autenticada hace una consulta** a la base de datos. Se aceptó ese coste a cambio de poder revocar.
- No se puede revocar un único token; es todo o nada por usuario (cerrar sesión en un dispositivo cerraría en todos si se usara el mismo mecanismo).
- Los tokens antiguos, emitidos antes de la migración, no traen `v` y se rechazan. Está cubierto por tests ("tokens sin versión").

## Alternativas

| Alternativa | Por qué no |
| --- | --- |
| Lista de tokens revocados | Una tabla que crece y hay que limpiar; también consulta la BD en cada petición |
| Tokens de vida muy corta + refresh | Más piezas (endpoint de refresh, almacenamiento seguro del refresh) para un problema acotado |
| Solo esperar a que el token expire | Una contraseña robada seguiría sirviendo después de cambiarla |

## Verificación

Tests de sesiones revocadas, tokens sin versión y usuarios eliminados (commit `a1f673dd`).
