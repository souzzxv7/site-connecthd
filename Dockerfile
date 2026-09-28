FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev
ENV HOST=0.0.0.0 PORT=3001 DATABASE_PATH=/app/data/connecthd.sqlite
VOLUME ["/app/data"]
EXPOSE 3001
CMD ["npm", "start"]
