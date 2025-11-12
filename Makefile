NAME = transcendence

GREEN := \033[0;32m

YELLOW := \033[0;33m

RESET := \033[0m

all:
	mkdir -p srcs/friend/tools/data srcs/record/tools/data srcs/record/tools/data
	mkdir -p srcs/user/tools/data srcs/user/tools/avatar
	mkdir -p srcs/database/init

	docker compose -f docker-compose.yml up --build
	clear
	@echo "$(GREEN)----------------------FT_TRANSCENDENCE-----------------------$(RESET)"
	@echo "$(GREEN)Camagru is running$(RESET)"
	@echo "$(GREEN)Local launch: https://localhost$(RESET)"
	@echo "$(GREEN)Remote launch: https://server_ip$(RESET)"
	@echo "$(GREEN)-------------------------------------------------------------$(RESET)"
	@echo "--------------------------[Service built]----------------------------" >> log.txt
	@echo >> log.txt
	
	@docker compose -f docker-compose.yml logs -f >> log.txt &

$(NAME): all

start:
	docker compose -f docker-compose.yml up -d
	clear
	@echo "$(GREEN)----------------------FT_TRANSCENDENCE-----------------------$(RESET)"
	@echo "$(GREEN)Camagru is running$(RESET)"
	@echo "$(GREEN)Local launch: https://localhost$(RESET)"
	@echo "$(GREEN)Remote launch: https://server_ip$(RESET)"
	@echo "$(GREEN)-------------------------------------------------------------$(RESET)"
	@echo "--------------------------[Service started]----------------------------" >> log.txt
	@echo >> log.txt

	@docker compose -f docker-compose.yml logs -f >> log.txt &
	

stop:
	docker compose -f docker-compose.yml stop

	@echo >> log.txt

clean:
	make stop
	docker system prune -af

re: clean all

.PHONY: all start stop clean re get-data put-data restore re-restore
