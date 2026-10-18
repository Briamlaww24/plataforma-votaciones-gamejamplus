# Game Jam — Plataforma de Votaciones

Plataforma full-stack de votación para un game jam con 16 equipos.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Votación pública: cada participante puede votar por hasta 5 equipos distintos usando su nombre |
| `/revelacion` | Pantalla grande: espera → animación de conteo → podio con confeti. Se activa desde el panel admin |
| `/admin` | Panel de administración (PIN): resultados en vivo, botón "Mostrar resultados", ocultar, reiniciar votación |

**PIN de administrador por defecto:** `jam2026` — cámbialo con la variable de entorno `ADMIN_PIN`.

## Editar los equipos

Los 16 equipos se definen en `contracts/teams.ts` (nombre y color). El cambio aplica a frontend y backend; los contadores se calculan desde esta lista.

## Stack

React 19 + TypeScript + Vite + Tailwind (frontend) · Hono + tRPC + Drizzle ORM + MySQL (backend)

## Desarrollo

```bash
npm install
npm run db:push   # crea/sincroniza las tablas en MySQL (DATABASE_URL en .env)
npm run dev       # http://localhost:3015 (frontend + API con HMR)
```

## Producción / despliegue en servidor

```bash
npm run build     # genera dist/ (frontend en dist/public + servidor en dist/boot.js)
npm start         # sirve todo en el puerto 3015 (variable PORT configurable)
```

O con Docker:

```bash
docker build -t gamejam-votaciones .
docker run -p 3015:3015 --env-file .env gamejam-votaciones
```

Variables de entorno necesarias en producción: `DATABASE_URL` (MySQL) y opcionalmente `ADMIN_PIN` y `PORT`.

La API limita cada dirección IP a un nombre de participante y conserva el hash de la IP con `APP_SECRET`. Usa un valor secreto estable para `APP_SECRET`. Si la app está detrás de un proxy inverso, configura `TRUST_PROXY=true` solo si ese proxy reemplaza el encabezado `X-Forwarded-For` con la IP real del cliente, y bloquea el acceso directo al puerto de la app. En redes compartidas, como el Wi-Fi de un evento, todos pueden salir con la misma IP; en ese caso define `IP_BLOCK_ENABLED=false` para evitar bloquear a otros participantes.

## Base de datos

- `votes`: un voto por participante y equipo (`voter_name` + `team_id` únicos), con un máximo de 5 votos distintos por nombre aplicado por el backend.
- `reveal_state`: fila única que controla si la pantalla de revelación muestra al ganador.
