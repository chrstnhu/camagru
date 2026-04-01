FROM nginx:stable

# Copy SSL certificates
COPY ./public/ /usr/share/nginx/html/

RUN chmod -R 755 /usr/share/nginx/html
RUN chown -R www-data:www-data /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]