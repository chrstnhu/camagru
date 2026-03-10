FROM php:8.2-cli

# Install required PHP extensions
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    curl \
    ssmtp \
    && rm -rf /var/lib/apt/lists/*

# Configure GD extension with freetype and jpeg support
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd pdo pdo_mysql zip

# Configure SSMTP to use Mailhog
RUN echo "mailhub=mailhog:1025" > /etc/ssmtp/ssmtp.conf \
    && echo "UseTLS=NO" >> /etc/ssmtp/ssmtp.conf \
    && echo "FromLineOverride=YES" >> /etc/ssmtp/ssmtp.conf

# Configure PHP for production (disable error display, enable logging)
RUN echo "display_errors = Off" > /usr/local/etc/php/php.ini \
    && echo "display_startup_errors = Off" >> /usr/local/etc/php/php.ini \
    && echo "log_errors = On" >> /usr/local/etc/php/php.ini \
    && echo "error_log = /var/log/php_errors.log" >> /usr/local/etc/php/php.ini \
    && echo "error_reporting = E_ALL" >> /usr/local/etc/php/php.ini \
    && echo "sendmail_path = /usr/sbin/ssmtp -t" >> /usr/local/etc/php/php.ini

# Create working directory
WORKDIR /app/server

# Copy all server files
COPY . /app/server/

# Create uploads directory with proper permissions
RUN mkdir -p /app/server/uploads/avatars && chmod -R 777 /app/server/uploads

# Configure PHP upload limits
RUN echo "upload_max_filesize = 10M" > /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 10M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/uploads.ini

# Expose port
EXPOSE 9001

# Start command
CMD ["php", "-S", "0.0.0.0:9001", "server.php"]