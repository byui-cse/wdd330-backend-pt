FROM node:14

# Cria o diretório da aplicação
WORKDIR /usr/src/app

# Instala as dependências da aplicação
# Um curinga é usado para garantir que tanto package.json quanto package-lock.json sejam copiados
# quando disponíveis (npm@5+)
COPY package*.json ./

RUN npm install
# Se você estiver compilando o código para produção
# RUN npm ci --only=production

# Empacota o código-fonte da aplicação
COPY . .

EXPOSE 3000
CMD [ "node", "server.js" ]