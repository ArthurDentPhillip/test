FROM node:20

# Install ping
RUN apt-get update && \
    apt-get install -y --no-install-recommends iputils-ping && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

EXPOSE 4000

CMD ["node", "index.js"]