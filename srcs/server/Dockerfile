FROM php:8.2-cli

WORKDIR /app/server

COPY server.php /app/server/

EXPOSE 9001

CMD ["php", "-S", "0.0.0.0:9001", "server.php"]