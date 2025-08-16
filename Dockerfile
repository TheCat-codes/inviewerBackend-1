FROM node:18-alpine

WORKDIR /app

# Copiar package.json y lockfile
COPY package*.json tsconfig.json ./

# Instalar dependencias (solo prod)
RUN npm ci --omit=dev

# Copiar el resto del código
COPY . .

# Compilar TS → JS
RUN npm run build

EXPOSE 5000

CMD ["node", "dist/app.js"]