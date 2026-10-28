# 0002 · Tres repositorios en vez de un monorepo

<!-- REVISAR (Florencia): los hechos salen de tu CLAUDE.md. Completa la sección "Por qué" con tus razones reales; no la dejes genérica. -->

**Estado:** aceptada

## Contexto

AulaConecta nació como un único repositorio (`AulaConecta`) con el backend (NestJS + GraphQL + MySQL), la web (React + Vite) y la app móvil (Expo). Esas tres piezas se despliegan, se prueban y evolucionan por separado.

## Decisión

Separar el monorepo en tres repositorios independientes, conservando el historial de cada parte:

- `aulaconecta-backend`
- `aulaconecta-web`
- `aulaconecta-app`

Los tres comparten la misma política de ramas: `main` (por defecto), `development` y `testing`, iguales entre sí.

## Por qué

TODO: escribe aquí tus razones (por ejemplo: despliegues independientes, CI más rápido por repositorio, quién puede ver qué, claridad al mostrarlo en el portafolio…). Elige solo las que de verdad pesaron.

## Qué se pierde (tradeoff)

- Un cambio que cruza capas (por ejemplo, un campo nuevo en la API que consumen web y app) son **tres** PR y hay que coordinarlos.
- Los tipos y el esquema GraphQL no se comparten automáticamente; hay que mantenerlos alineados a mano o con generación de código.
- Tres configuraciones de CI, tres READMEs y tres conjuntos de dependencias que mantener.

## Cómo se hizo

El historial se conservó al separar (cada repositorio arrastra los commits de su carpeta). El repositorio monorepo original ya no se usa y está pendiente de borrarse en GitHub.
