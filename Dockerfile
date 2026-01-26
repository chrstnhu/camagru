FROM php:8.2-cli

# Installer les extensions PHP nécessaires
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd pdo pdo_mysql zip

# Créer le répertoire de travail
WORKDIR /app/server

# Copier tous les fichiers du serveur
COPY . /app/server/

# Créer le répertoire uploads avec les bonnes permissions
RUN mkdir -p /app/server/uploads && chmod 755 /app/server/uploads

# Exposer le port
EXPOSE 9001

# Commande de démarrage
CMD ["php", "-S", "0.0.0.0:9001", "server.php"]