# AulaConecta API

API GraphQL con NestJS, TypeORM y MySQL.

## Comandos

| Comando | Descripción |
|---|---|
| `npm run build` | Compila el proyecto |
| `npm run start:dev` | Modo desarrollo con recarga |
| `npm run start:prod` | Ejecuta la versión compilada |
| `npm run seed` | Carga datos de ejemplo (idempotente) |
| `npm test` | Pruebas unitarias y de extremo a extremo |
| `npm run test:cov` | Pruebas con reporte y umbral de cobertura del 80 % |
| `npm run seed:reset` | Regenera los datos de ejemplo desde cero |

## Base de datos

```
cd docker-crud
docker compose up -d
```

MySQL 8 en el puerto 3308 con un volumen persistente.

## Módulos

`auth`, `user`, `course`, `subject`, `asist`, `grades`, `advices` (anuncios), `messages` (mensajería profesor–apoderado) y `semester`.

El esquema GraphQL se genera en `src/graphql/schema.gql` y el playground está disponible en `/graphql`.

## Seguridad

- Autenticación con JWT; el secreto se define en `JWT_SECRET`.
- Las operaciones sensibles verifican el rol del usuario (profesor, administrador o apoderado).
- Un apoderado solo puede consultar notas y asistencia de los estudiantes a su cargo.
