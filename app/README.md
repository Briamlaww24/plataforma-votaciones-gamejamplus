# Game Jam — Plataforma de Votaciones

Plataforma full-stack de votación para un game jam con 13 equipos.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Votación pública: nombre del participante + selección de un equipo (un voto por nombre) |
| `/revelacion` | Pantalla grande: espera → animación de conteo → ganador con confeti. Se activa desde el panel admin |
| `/admin` | Panel de administración (PIN): resultados en vivo, botón "Mostrar resultados", ocultar, reiniciar votación |

**PIN de administrador por defecto:** `jam2026` — cámbialo con la variable de entorno `ADMIN_PIN`.

## Editar los equipos

Los 13 equipos se definen en `contracts/teams.ts` (nombre y color). El cambio aplica a frontend y backend.

## Stack

React 19 + TypeScript + Vite + Tailwind (frontend) · Hono + tRPC + Drizzle ORM + MySQL (backend)

## Desarrollo

```bash
npm install
npm run db:push   # crea/sincroniza las tablas en MySQL (DATABASE_URL en .env)
npm run dev       # http://localhost:3000 (frontend + API con HMR)
```

## Producción / despliegue en servidor

```bash
npm run build     # genera dist/ (frontend en dist/public + servidor en dist/boot.js)
npm start         # sirve todo en el puerto 3000 (variable PORT configurable)
```

O con Docker:

```bash
docker build -t gamejam-votaciones .
docker run -p 3000:3000 --env-file .env gamejam-votaciones
```

Variables de entorno necesarias en producción: `DATABASE_URL` (MySQL) y opcionalmente `ADMIN_PIN` y `PORT`.

## Base de datos

- `votes`: un voto por participante (`voter_name` único), equipo y fecha.
- `reveal_state`: fila única que controla si la pantalla de revelación muestra al ganador.
