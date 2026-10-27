FROM node:20-alpine

WORKDIR /app

COPY backend/api/package.json backend/api/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/api/src ./src
COPY backend/api/scripts ./scripts
COPY database ./database

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/aplicativo.js"]
