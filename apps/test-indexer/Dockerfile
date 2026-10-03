FROM node:22.15-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:22.15-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install --omit=dev
RUN npx prisma generate
COPY --from=build /app/dist ./dist
EXPOSE 3100
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
