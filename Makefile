.PHONY: help dev-backend dev-api dev-deploy dev-payment dev-seo migrate migrate-down seed test lint fmt scan build logs reset-db

COMPOSE_DEV := docker compose -f docker-compose.dev.yml

# All backend Go services — single source of truth
SERVICES := api-gateway deploy-service payment-service seo-service

help: ## List all available make commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# --- Development ---

dev-backend: ## Start all backend services with hot-reload
	@$(foreach svc,$(SERVICES),air -c .air.toml -- $(svc) &) wait

dev-api: ## Start api-gateway only
	air -c .air.toml -- api-gateway

dev-deploy: ## Start deploy-service only
	air -c .air.toml -- deploy-service

dev-payment: ## Start payment-service only
	air -c .air.toml -- payment-service

dev-seo: ## Start seo-service only
	air -c .air.toml -- seo-service

# --- Database ---

migrate: ## Apply pending migrations
	@echo "Applying migrations..."
	@for f in migrations/*.sql; do echo "Applying $$f ..."; docker exec -i vallexis-postgres psql -U $${POSTGRES_USER:-vallexis} -d $${POSTGRES_DB:-vallexis_db} -f /dev/stdin < "$$f"; done
	@echo "All migrations applied."

migrate-down: ## Roll back last migration
	@echo "Rolling back last migration..."
	@last=$$(ls -t migrations/*.sql | head -1); \
	if [ -n "$$last" ]; then echo "Would rollback: $$last"; else echo "No migrations to rollback."; fi

seed: ## Seed development data
	@echo "Seeding development data..."
	@docker exec -i vallexis-postgres psql -U $${POSTGRES_USER:-vallexis} -d $${POSTGRES_DB:-vallexis_db} < scripts/seed.sql
	@echo "Seed complete."

reset-db: ## Drop and recreate the database (destructive!)
	@read -p "Are you sure? This will DELETE all data. [y/N] " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker exec vallexis-postgres psql -U $${POSTGRES_USER:-vallexis} -c "DROP DATABASE IF EXISTS $${POSTGRES_DB:-vallexis_db};" && \
		docker exec vallexis-postgres psql -U $${POSTGRES_USER:-vallexis} -c "CREATE DATABASE $${POSTGRES_DB:-vallexis_db};" && \
		echo "Database reset complete."; \
	else \
		echo "Aborted."; \
	fi

# --- Quality ---

test: ## Run all Go tests
	go test ./... -v -count=1

lint: ## Run golangci-lint
	golangci-lint run ./...

fmt: ## Format all Go code
	gofmt -s -w .
	goimports -w .

scan: ## Run Trivy security scan on all images
	@$(foreach svc,$(SERVICES),trivy image --severity CRITICAL,HIGH $(svc):latest;)

# --- Docker ---

build: ## Build all Docker images
	docker compose build

logs: ## Tail all service logs
	docker compose logs -f
