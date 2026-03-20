FROM nginx:stable

# Copie la configuration nginx personnalisée si besoin
# COPY ./nginx.conf /etc/nginx/nginx.conf

# Copie les fichiers statiques dans le dossier servi par nginx
COPY ./public/ /usr/share/nginx/html/

RUN chmod -R 755 /usr/share/nginx/html
RUN chown -R www-data:www-data /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]