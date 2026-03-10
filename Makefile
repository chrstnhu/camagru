# Variables
COMPOSE = docker-compose
GREEN := \033[0;32m
RESET := \033[0m

# Help
help:
	@echo "🎬 Camagru - Commands:"
	@echo ""
	@echo "  all           - Build and start all services"
	@echo "  build         - Build Docker images"
	@echo "  up            - Start services"
	@echo "  down          - Stop services"
	@echo "  restart       - Restart services"
	@echo "  clean         - Stop and remove containers (keeps database)"
	@echo "  fclean        - Deep clean (removes everything including database)"
	@echo "  re            - Full deep clean + rebuild"
	@echo "  logs          - Show logs"
	@echo "  server        - Rebuild server only"
	@echo "  client        - Rebuild client only"
	@echo "  database      - Rebuild database only"
	@echo "  shell-server  - Shell into server container"
	@echo "  shell-db      - Shell into database"

# Build and start (default target)
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