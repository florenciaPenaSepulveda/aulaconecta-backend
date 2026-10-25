# AulaConecta · Backend

[![CI](https://github.com/florenciaPenaSepulveda/aulaconecta-backend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/florenciaPenaSepulveda/aulaconecta-backend/actions/workflows/ci.yml)

API GraphQL de **AulaConecta**, una plataforma de gestión escolar que conecta a profesores, apoderados y administración: cursos, asignaturas, asistencia por día, calificaciones, anuncios y mensajería directa entre profesores y apoderados.

Construida con NestJS, TypeORM y MySQL 8.

## Repositorios del proyecto

| Repositorio | Descripción |
|---|---|
| **aulaconecta-backend** (este) | API GraphQL, autenticación JWT y base de datos |
| [aulaconecta-web](https://github.com/florenciaPenaSepulveda/aulaconecta-web) | Panel web por rol (React, Vite, Tailwind, daisyUI) |
| [aulaconecta-app](https://github.com/florenciaPenaSepulveda/aulaconecta-app) | Aplicación móvil (Expo, React Native) |

Los tres repositorios son independientes y se conectan a través de esta API.

## Funcionalidades por rol

| Rol | Qué puede hacer |
|---|---|
| Profesor | Crear asignaturas, inscribir estudiantes, registrar asistencia por fecha, ver el calendario de asistencia, poner notas, publicar anuncios, escribir a los apoderados y registrar estudiantes |
| Apoderado | Ver notas y asistencia de sus pupilos, leer anuncios y escribir a los profesores |
| Administrador | Todo lo anterior, más cursos, usuarios de cualquier rol y asignación de profesores |

### Calendario de asistencia

La asistencia se guarda por día. Un día aparece en el calendario de una asignatura solo cuando se registra la asistencia de al menos un estudiante, y al registrar se puede elegir la fecha (también para corregir días anteriores).

## Requisitos

- Node.js 24 LTS (ver `.nvmrc`)
- Docker (para MySQL)

## Puesta en marcha

1. Base de datos:

   ```
   cd docker-crud
   docker compose up -d
   ```

   MySQL 8 en el puerto 3308 con un volumen persistente.

2. API:

   ```
   cp .env.example .env
   npm install
   npm run build
   npm run start:prod
   ```

   Queda en `http://localhost:3000/graphql` (con playground). Las tablas se crean al iniciar.

3. Datos de ejemplo (con la API iniciada al menos una vez):

   ```
   npm run seed
   ```

   Carga un colegio completo: 5 cursos, 30 asignaturas, 7 profesores, unos 40 estudiantes con sus apoderados, asistencia diaria, casi mil notas, anuncios y conversaciones. Si ya hay datos no hace nada; `npm run seed:reset` regenera todo desde cero.

## Usuarios de ejemplo

Contraseña de todos: `Demo1234`

| Rol | Correo |
|---|---|
| Administrador | admin@aulaconecta.cl |
| Profesor | profesor@aulaconecta.cl |
| Profesora | marta@aulaconecta.cl |
| Apoderada (Juan y Sofía) | apoderado@aulaconecta.cl |
| Apoderado (Diego) | apoderado2@aulaconecta.cl |

Los demás profesores y apoderados generados usan el formato `nombre.apellido@aulaconecta.cl` y la misma contraseña. Los estudiantes no tienen credenciales de acceso.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de la API (3000) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` | Conexión a MySQL (puerto 3308 con el compose incluido) |
| `JWT_SECRET` | Clave para firmar los tokens (en producción, al menos 32 caracteres) |
| `NODE_ENV` | Con `production` se desactivan el Playground y la introspección de GraphQL, se exige una clave JWT larga y no se sincroniza el esquema de la base de datos |
| `CORS_ORIGINS` | Orígenes del frontend autorizados, separados por coma (por defecto los de desarrollo local) |
| `RATE_LIMIT` | Solicitudes por minuto y por IP (300 por defecto); el inicio de sesión, la recuperación, el registro y el cambio de contraseña admiten 30 |
| `TRUST_PROXY` | Número de proxies de confianza delante de la API, para limitar por la IP real del cliente |
| `MAIL_USER`, `MAIL_PASS` | Cuenta Gmail y contraseña de aplicación para enviar correos |

### Envío de correos

1. Activa la verificación en dos pasos en la cuenta de Gmail.
2. Crea una contraseña de aplicación en myaccount.google.com/apppasswords (16 caracteres).
3. Escribe tu correo en `MAIL_USER` y esa contraseña en `MAIL_PASS` dentro de `.env`, y reinicia la API.

`.env` está en `.gitignore`: las credenciales nunca se suben, solo `.env.example`. Sin estas variables todo funciona, excepto la recuperación de contraseña, que no envía nada. Por seguridad, la respuesta de la recuperación es la misma exista o no el correo.

## Comandos

| Comando | Descripción |
|---|---|
| `npm run build` | Compila el proyecto |
| `npm run start:dev` | Modo desarrollo con recarga |
| `npm run start:prod` | Ejecuta la versión compilada |
| `npm run seed` / `npm run seed:reset` | Carga o regenera los datos de ejemplo |
| `npm run migration:generate -- src/database/migrations/Nombre` | Genera una migración a partir de los cambios en las entidades |
| `npm run migration:run` / `migration:revert` | Aplica o revierte migraciones |
| `npm run migration:check` | Comprueba que las migraciones reproducen exactamente el esquema de las entidades (se ejecuta en la integración continua) |
| `npm test` | Pruebas unitarias y de extremo a extremo |
| `npm run test:cov` | Pruebas con reporte y umbral de cobertura del 80 % |

## Base de datos y migraciones

En desarrollo y en las pruebas TypeORM sincroniza el esquema automáticamente. En producción (`NODE_ENV=production`) la sincronización está desactivada y la API aplica las migraciones pendientes de `src/database/migrations` al arrancar, de modo que un cambio en una entidad nunca borra datos por sí solo: se genera una migración, se revisa y se publica. Al agregar una entidad nueva, regístrala también en `src/database/data-source.ts` (una prueba avisa si falta).

## Módulos

`auth`, `user`, `course`, `subject`, `asist` (asistencia por día y resúmenes), `grades`, `advices` (anuncios), `messages` (mensajería profesor–apoderado), `semester`, `mail` y `guard`.

## Seguridad

- Autenticación con JWT; todas las operaciones, salvo el ingreso, el registro y la recuperación de contraseña, exigen sesión y verifican el rol del usuario.
- Cursos y semestres solo los gestiona el administrador. Un profesor solo ve y modifica sus propias asignaturas, con su asistencia y sus notas; el listado global de notas es del administrador.
- Los profesores solo crean, modifican o eliminan estudiantes; las cuentas de profesores y administradores las gestiona el administrador, que no puede eliminar la suya.
- Un apoderado solo puede consultar notas y asistencia de los estudiantes a su cargo.
- Las contraseñas se guardan con bcrypt; deben tener entre 8 y 72 caracteres, con letras y números. Para cambiarla hay que indicar la contraseña actual (o la temporal, tras una recuperación), y la nueva debe ser distinta. El inicio de sesión devuelve el mismo error para un correo inexistente y para una clave incorrecta.
- Límite de solicitudes por IP, profundidad máxima de 10 niveles en las consultas GraphQL, cabeceras de seguridad (helmet) y CORS restringido a los orígenes configurados.
- Los correos escapan el HTML de los datos que incluyen.
- Los secretos se leen del entorno, se validan al arrancar y nunca se versionan.

Dependencias: NestJS 11, Apollo Server 5 y TypeORM 0.3, sin vulnerabilidades conocidas (`npm audit` en 0).

## Pruebas

96 pruebas con 98 % de cobertura (sentencias), incluida una suite de seguridad y permisos. Las pruebas e2e requieren la base de datos levantada y con los datos de ejemplo, y limpian lo que crean.

## Autoría

Proyecto académico desarrollado en equipo (originalmente ClosedAI); esta versión forma parte del portafolio de [Florencia Peña Sepúlveda](https://github.com/florenciaPenaSepulveda).
