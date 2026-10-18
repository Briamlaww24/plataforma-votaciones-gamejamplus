# Plataforma de votaciones — Game Jam
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --global npm@12.2.1 \
    && npm ci --registry=https://registry.npmjs.org --no-audit --no-fund

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3015

CMD ["sh", "-c", "npm run db:push && npm start"]
