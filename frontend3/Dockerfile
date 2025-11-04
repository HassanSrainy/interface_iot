FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers
COPY . .

# Exposer le port 3000
EXPOSE 3000

# Commande par défaut
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
