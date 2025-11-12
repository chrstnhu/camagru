FROM node:20

RUN apt update -y && apt upgrade -y && apt install -y \
    curl \
    nginx \
    openssl

RUN mkdir -p /etc/nginx/ssl

RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/server.key \
    -out /etc/nginx/ssl/server.crt \
    -subj "/C=CN/ST=France/L=France/O=hackathonCraftAI/OU=Dev/CN=localhost"

RUN mkdir -p /var/www/html

EXPOSE 8080

COPY ./conf/nginx.conf /etc/nginx/nginx.conf

RUN rm -rf node_modules package-lock.json \
    && npm install \
    && npm run build \
    || (cat /root/.npm/_logs/*-debug-0.log || true)

# Copie le build npm dans /var/www/html (adapte le dossier si besoin)
COPY ./public/ /var/www/html/

RUN chmod -R 755 /var/www/html

RUN chown -R www-data:www-data /var/www/html

# RUN [ "$PRODUCTION" = "true" ] && find /var/www/html/script -name "*.js" -exec sed -i 's/console\.log([^)]*);//g' {} \; || true

CMD ["nginx", "-g", "daemon off;"]