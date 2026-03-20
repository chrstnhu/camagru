# Variables
COMPOSE = docker compose
GREEN := \033[0;32m
RESET := \033[0m

# Help
help:
	@echo "🎬 Camagru - Commands:"
	@echo ""
	@echo "  all             - Build and start all services"
	@echo "  build           - Build Docker images"
	@echo "  up              - Start all services"
	@echo "  down            - Stop all services"
	@echo "  restart         - Restart all services"
	@echo "  clean           - Stop and remove containers (keeps database volume)"
	@echo "  fclean          - Deep clean (removes everything including database volume)"
	@echo "  re              - Full deep clean and rebuild"
	@echo "  logs            - Show logs for all services"
	@echo "  server          - Rebuild and restart server only"
	@echo "  client          - Rebuild and restart client only"
	@echo "  database        - Rebuild and restart database only"
	@echo "  phpmyadmin      - Rebuild and restart phpmyadmin only"
	@echo "  mailhog         - Rebuild and restart mailhog only"
	@echo "  reset-server    - Remove and rebuild server container and volume"
	@echo "  reset-client    - Remove and rebuild client container and volume"
	@echo "  reset-database  - Remove database container and mariadb_data volume, then restart database (reinit SQL)"
	@echo "  reset-phpmyadmin- Remove and rebuild phpmyadmin container and volume"
	@echo "  reset-mailhog   - Remove and rebuild mailhog container and volume"
	@echo "  shell-server    - Open a shell in the server container"
	@echo "  shell-db        - Open a MySQL shell in the database container"

# Build and start
all: build up 

# Build Docker images
build:
	@echo "🏗️ Building Docker images..."
	@mkdir -p srcs/user/tools/data srcs/user/tools/avatar srcs/database/init
	@$(COMPOSE) build --no-cache

# Start services
up:
	@$(COMPOSE) up -d
	@echo "$(GREEN)----------------------CAMAGRU-----------------------$(RESET)"
	@echo "$(GREEN)Camagru is running$(RESET)"
	@echo "$(GREEN)Client: https://localhost:8080$(RESET)"
	@echo "$(GREEN)API: https://localhost:9001$(RESET)"
	@echo "$(GREEN)Database: https://localhost:3306$(RESET)"
	@echo "$(GREEN)PHPMyAdmin: http://localhost:8081$(RESET)"
	@echo "$(GREEN)Mailhog: http://localhost:8025$(RESET)"
	@echo "$(GREEN)--------------------------------------------------$(RESET)"

# Stop services
down:
	@echo "⏹️ Stopping services..."
	@$(COMPOSE) down

# Restart services
restart: down up

# Show logs
logs:
	@$(COMPOSE) logs -f

# Surface clean (stop containers, remove images, keep database volume)
clean:
	@echo "🧹 Cleaning containers and images..."
	@$(COMPOSE) down --remove-orphans
	@docker system prune -af

# Deep clean (remove everything including database volume)
fclean:
	@echo "🧹 Deep cleaning (removing everything)..."
	@$(COMPOSE) down -v --remove-orphans
	@docker system prune -af


# Rebuild and restart a single service
server:
	@echo "🔄 Rebuilding server..."
	@$(COMPOSE) up -d --build server

client:
	@echo "🔄 Rebuilding client..."
	@$(COMPOSE) up -d --build client

database:
	@echo "🔄 Rebuilding database..."
	@$(COMPOSE) up -d --build database

phpmyadmin:
	@echo "🔄 Rebuilding phpmyadmin..."
	@$(COMPOSE) up -d --build phpmyadmin

mailhog:
	@echo "🔄 Rebuilding mailhog..."
	@$(COMPOSE) up -d --build mailhog


# Reset a single service (remove container and volume, then rebuild)
reset-server:
	@echo "🗑️ Suppression du container et volume server..."
	@$(COMPOSE) rm -sf server
	@$(COMPOSE) up -d --build server

reset-client:
	@echo "🗑️ Suppression du container et volume client..."
	@$(COMPOSE) rm -sf client
	@$(COMPOSE) up -d --build client

reset-database:
	@echo "🗑️ Suppression du conteneur database et du volume mariadb_data (données SQL)..."
	@$(COMPOSE) stop database
	@$(COMPOSE) rm -sf database
	@docker volume rm mariadb_data || true
	@$(COMPOSE) up -d --build database

reset-phpmyadmin:
	@echo "🗑️ Suppression du container et volume phpmyadmin..."
	@$(COMPOSE) rm -sf phpmyadmin
	@$(COMPOSE) up -d --build phpmyadmin

reset-mailhog:
	@echo "🗑️ Suppression du container et volume mailhog..."
	@$(COMPOSE) rm -sf mailhog
	@$(COMPOSE) up -d --build mailhog


# Shell into the server container
shell-server:
	@$(COMPOSE) exec server bash

# Shell into the database
shell-db:
	@$(COMPOSE) exec database mysql -u root -p

# Full deep clean + rebuild
re: fclean all

.DEFAULT_GOAL := all

.PHONY: all build up down restart logs clean fclean \
        server client database shell-server shell-db re help
