# app/ — Agent Guide

## Backend (Spring Boot)

| Task | Command |
|---|---|
| Run tests | `cd app/backend && ./mvnw test` |
| Build JAR | `cd app/backend && ./mvnw -DskipTests package` |
| Start server (port 8080) | `cd app/backend && ./mvnw spring-boot:run` |
| Full verify | `cd app/backend && ./mvnw -q verify` |

Env vars: copy `.env.example` to `app/.env` and fill in your `OPENROUTER_API_KEY`.
The backend reads `app/.env` automatically when started from `app/backend/` via Spring Boot's env loading.

## Frontend (Angular) — coming soon

Commands will be added here when the frontend scaffold is in place.
