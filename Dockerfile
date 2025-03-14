FROM node:18-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY . .
EXPOSE 7817

CMD ["node", "index.js"]
