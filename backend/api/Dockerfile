# Stage 1: build the website's React/TypeScript bundle (landing page + admin panel).
FROM node:22-alpine AS assets
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY vite.config.js tsconfig.json ./
COPY resources ./resources
RUN npm run build

# Stage 2: the one Laravel app: mobile API under /api, website under / and /admin.
FROM php:8.4.27-cli
RUN apt-get update && apt-get install -y --no-install-recommends git unzip libpq-dev libzip-dev libpng-dev libjpeg-dev \
 && docker-php-ext-configure gd --with-jpeg && docker-php-ext-install pdo_pgsql zip gd pcntl \
 && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY . .
RUN composer install --no-interaction --prefer-dist
COPY --from=assets /app/public/build public/build
# An empty .env: settings come from docker-compose, and Laravel warns when the file is missing.
RUN touch .env
EXPOSE 8000
# The built-in server handles one request at a time unless told otherwise (needs --no-reload).
ENV PHP_CLI_SERVER_WORKERS=4
CMD ["sh", "-c", "php artisan migrate --force && php artisan db:seed --class=AdminSeeder --force && php artisan storage:link --force; php artisan serve --host=0.0.0.0 --port=8000 --no-reload"]
