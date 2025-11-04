FROM php:8.2-fpm

# Arguments
ARG user=www
ARG uid=1000

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    default-mysql-client

# Nettoyer le cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Installer les extensions PHP
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Installer Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Créer un utilisateur système pour exécuter Composer et Artisan
RUN useradd -G www-data,root -u $uid -d /home/$user $user
RUN mkdir -p /home/$user/.composer && \
    chown -R $user:$user /home/$user

# Définir le répertoire de travail
WORKDIR /var/www

# Copier les fichiers de l'application
COPY --chown=$user:$user . /var/www

# Donner les permissions
RUN chown -R $user:$user /var/www
RUN chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Installer les dépendances Composer en tant qu'utilisateur www (avec dev pour Faker)
USER $user
RUN composer install --no-interaction --optimize-autoloader

# Exposer le port 8000
EXPOSE 8000

# Commande par défaut
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
