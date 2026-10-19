# Game Jam -- Plataforma de Votaciones

Plataforma full-stack de votación para la game jam plus de 2026.

## Rutas

| Ruta            | Descripción                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| `/`           | Votación pública: Cada participante puede votar por hasta 5 equipos distintos usando su nombre              |
| `/revelacion` | Pantalla grande: Espera -> Animación de conteo y podio con confeti. Se activa desde el panel admin          |
| `/admin`      | Panel de administración (PIN): Resultados en vivo, botón "Mostrar resultados", ocultar, reiniciar votación |

**PIN de administrador por defecto:** `jam2026` -- Se puede cambiar con la variable de entorno del  `ADMIN_PIN` del .env.

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
docker compose up -d --build
```

Variables de entorno necesarias en producción: `DATABASE_URL` (MySQL) y opcionalmente `ADMIN_PIN` y `PORT`.

La API aplica el límite de votos por nombre de participante. El nombre no se vincula a una dirección IP por ello, cambiar de nombre permite crear otra identidad.

## Base de datos

- `votes`: Un voto por participante y equipo (`voter_name` + `team_id` únicos), con un máximo de 5 votos distintos por nombre aplicado por el backend.
- `voter_locks`: Serializa votos simultáneos y limita a cinco votos por nombre. En bases existentes, `npm run db:push` elimina la columna `ip_hash` obsoleta.
- `reveal_state`: Fila única que controla si la pantalla de revelación muestra al ganador.
