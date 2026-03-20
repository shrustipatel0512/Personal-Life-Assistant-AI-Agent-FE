FROM node:20-alpine AS build
WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app

ENV HOST=0.0.0.0
ENV PORT=10000
ENV API_TARGET_URL=
ENV API_TARGET_HOST=backend
ENV API_TARGET_PORT=8080

COPY --from=build /app/dist ./dist
COPY --from=build /app/serve-dist.js ./serve-dist.js

EXPOSE 10000

CMD ["node", "serve-dist.js"]
