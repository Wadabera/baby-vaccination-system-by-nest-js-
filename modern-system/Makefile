# Makefile for the Infant Vaccination Management System

.PHONY: help up down restart logs clean build test lint format seed smoke up-db

help:
	@echo "Infant Vaccination Management System"
	@echo ""
	@echo "  make up        Start MongoDB, backend and frontend with Docker"
	@echo "  make down      Stop the Docker services"
	@echo "  make up-db     Start only MongoDB (for local npm development)"
	@echo "  make seed      Load demo accounts and sample records"
	@echo "  make smoke     Run the end-to-end smoke test against a running backend"
	@echo "  make build     Build the backend and frontend"
	@echo "  make test      Run the unit tests"
	@echo "  make lint      Lint the backend and frontend"
	@echo "  make format    Format the backend and frontend"
	@echo "  make logs      Follow the Docker logs"
	@echo "  make clean     Remove containers, volumes and images"

up:
	docker compose up -d
	@echo ""
	@echo "Frontend: http://localhost:3000"
	@echo "API:      http://localhost:5000/api"
	@echo ""
	@echo "Run 'make seed' once to create the demo accounts."

down:
	docker compose down

restart: down up

up-db:
	docker compose up -d mongodb
	@echo "MongoDB is starting on localhost:27017"

seed:
	cd backend && npm run seed

smoke:
	cd backend && npm run test:smoke

build:
	cd backend && npm run build
	cd frontend && npm run build

test:
	cd backend && npx jest --testPathIgnorePatterns "clinics.integration"

lint:
	cd backend && npm run lint
	cd frontend && npm run lint

format:
	cd backend && npm run format
	cd frontend && npx prettier --write "src/**/*.{js,jsx,css}"

logs:
	docker compose logs -f

clean:
	docker compose down -v --rmi all

# Database maintenance
db-shell:
	docker exec -it vaccination-mongodb mongosh -u admin -p password123 --authenticationDatabase admin vaccination

db-backup:
	docker exec vaccination-mongodb mongodump --uri="mongodb://admin:password123@localhost:27017/vaccination?authSource=admin" --out=/backup
	docker cp vaccination-mongodb:/backup ./backup

db-restore:
	docker cp ./backup vaccination-mongodb:/restore
	docker exec vaccination-mongodb mongorestore --uri="mongodb://admin:password123@localhost:27017/vaccination?authSource=admin" /restore
