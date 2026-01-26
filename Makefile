# Makefile for Camagru project
.PHONY: help start stop restart logs db-connect db-user clean

# Default command
help: ## Display available commands
	@echo "Available commands:"
	@echo "  start      - Start the project"
	@echo "  stop       - Stop the project"
	@echo "  restart    - Restart the project"
	@echo "  logs       - Show logs"
	@echo "  db-connect - Connect to database (root)"
	@echo "  db-user    - Connect to database (app user)"
	@echo "  clean      - Clean containers"

# Start the project
start: ## Start services
	@echo "🚀 Starting Camagru..."
	docker-compose up -d --build
	@echo "✅ Project started!"
	@echo "📱 Application: http://localhost:3000"
	@echo "🗄️  phpMyAdmin: http://localhost:8080"

# Stop the project
stop: ## Stop services
	@echo "⏹️  Stopping Camagru..."
	docker-compose down

# Restart
restart: ## Restart services
	@echo "🔄 Restarting..."
	docker-compose restart

# View logs
logs: ## Show logs
	docker-compose logs -f

# Connect to database (root)
db-connect: ## Connect to MySQL (root)
	@echo "🗄️  Connecting to database (root)..."
	@echo "Password: root_password"
	docker-compose exec db mysql -u root -p

# Connect to database (app user)
db-user: ## Connect to MySQL (app user)
	@echo "🗄️  Connecting to database (camagru_user)..."
	@echo "Password: camagru_password"
	docker-compose exec db mysql -u camagru_user -p camagru

# Cleanup
clean: ## Clean containers
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	docker system prune -f