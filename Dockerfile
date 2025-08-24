FROM node:18-alpine

WORKDIR /home/backend

RUN npm install -g pnpm

COPY package*.json pnpm-lock.yaml .

COPY . .

ENV CI=true

RUN pnpm install

EXPOSE 3000

CMD ["node", "app.js"]