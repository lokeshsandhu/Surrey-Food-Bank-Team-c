# Backend

Node.js + Express + TypeScript scaffold (modular MVC).

## Quick start

1. Copy env file:
   - `cp .env.example .env`
2. Install dependencies:
   - `npm install`
3. Generate Prisma client (if needed):
   - `npm run prisma:generate`
4. Run dev server:
   - `npm run dev`

## Environment variables

See `.env.example` for the full list.

## Structure

- `src/app.ts`: Express app wiring (middleware + routes)
- `src/server.ts`: server bootstrap (listen)
- `src/modules/*`: feature modules (routes/controller/service/dto)
- `prisma/schema.prisma`: DB schema

