# Utilise l'image officielle Node.js
FROM node:18-alpine

# Définit le répertoire de travail dans le conteneur
WORKDIR /app

# Copie les fichiers package.json et package-lock.json (s'ils existent)
COPY package*.json ./

# Installe les dépendances
RUN npm install

# Copie le reste du code de l'application
COPY . .

# Expose le port sur lequel l'application s'exécute
EXPOSE 3000

# Définit la commande par défaut pour démarrer l'application
CMD ["npm", "start"]