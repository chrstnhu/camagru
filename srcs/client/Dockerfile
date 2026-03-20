FROM nginx:stable

RUN mkdir -p /etc/nginx/ssl
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/server.key \
    -out /etc/nginx/ssl/server.crt \
    -subj "/C=CN/ST=France/L=France/O=hackathonCraftAI/OU=Dev/CN=localhost"

COPY ./conf/nginx.conf /etc/nginx/nginx.conf
COPY ./public/ /var/www/html/
RUN chmod -R 755 /var/www/html
RUN chown -R www-data:www-data /var/www/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]