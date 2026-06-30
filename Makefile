.PHONY: help dev-backend dev-api dev-deploy dev-payment dev-seo migrate migrate-down seed test lint fmt scan build logs reset-db

export PATH := $(HOME)/go/bin:$(PATH)

COMPOSE_DEV := docker compose -f docker-compose.yml -f docker-compose.dev.yml

# All backend Go services — single source of truth
SERVICES := api-gateway deploy-service payment-service seo-service

help: ## List all available make commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# --- Development ---

dev-backend: ## Start all backend services with hot-reload
	@mkdir -p ./tmp/api-gateway ./tmp/deploy-service ./tmp/payment-service ./tmp/seo-service
	@API_PORT=3000 air -c .air.toml -build.cmd "go build -buildvcs=false -o ./tmp/api-gateway/main ./src/api-gateway" -build.bin "./tmp/api-gateway/main" -build.exclude_dir "tmp,node_modules,vendor,tests,docs,scripts,secrets,migrations" -build.delay 500 &
	@DEPLOY_PORT=3001 air -c .air.toml -build.cmd "go build -buildvcs=false -o ./tmp/deploy-service/main ./src/deploy-service" -build.bin "./tmp/deploy-service/main" -build.exclude_dir "tmp,node_modules,vendor,tests,docs,scripts,secrets,migrations" -build.delay 500 &
	@PAYMENT_PORT=3002 air -c .air.toml -build.cmd "go build -buildvcs=false -o ./tmp/payment-service/main ./src/payment-service" -build.bin "./tmp/payment-service/main" -build.exclude_dir "tmp,node_modules,vendor,tests,docs,scripts,secrets,migrations" -build.delay 500 &
	@SEO_PORT=3003 air -c .air.toml -build.cmd "go build -buildvcs=false -o ./tmp/seo-service/main ./src/seo-service" -build.bin "./tmp/seo-service/main" -build.exclude_dir "tmp,node_modules,vendor,tests,docs,scripts,secrets,migrations" -build.delay 500 &
	@wait

dev-api: ## Start api-gateway only
	air -c .air.toml -build.cmd "go build -buildvcs=false -o ./tmp/main ./src/api-gateway"

dev-deploy: ## Start deploy-service only
	air -c .air.toml -build.cmd "go build -buildvcs=false -o ./tmp/main ./src/deploy-service"

dev-payment: ## Start payment-service only
	air -c .air.toml -build.cmd "go build -buildvcs=false -o ./tmp/main ./src/payment-service"

dev-seo: ## Start seo-service only
	air -c .air.toml -build.cmd "go build -buildvcs=false -o ./tmp/main ./src/seo-service"

# --- Database ---

PG_CONTAINER := $(shell docker ps --filter name=postgres --format "{{.Names}}" | head -n 1)
ifeq ($(PG_CONTAINER),)
  PG_CONTAINER := vallexis-postgres-1
endif

migrate: ## Apply pending migrations
	@echo "Applying migrations..."
	@if ! ls migrations/*.sql 1>/dev/null 2>&1; then echo "No migration files found in migrations/"; exit 1; fi
	@fail=0; for f in migrations/*.sql; do \
		echo "Applying $$f ..."; \
		if ! docker exec -i $(PG_CONTAINER) psql -U $${POSTGRES_USER:-vallexis} -d $${POSTGRES_DB:-vallexis_db} -f /dev/stdin < "$$f"; then \
			echo "Error: Migration $$f failed" >&2; fail=1; break; \
		fi; \
	done; if [ "$$fail" -eq 1 ]; then exit 1; fi
	@echo "All migrations applied."

migrate-down: ## Roll back last migration
	@echo "Rolling back last migration..."
	@if ! ls migrations/*.sql 1>/dev/null 2>&1; then echo "No migration files found in migrations/"; exit 1; fi
	@last=$$(ls -t migrations/*.sql | head -1); \
	if [ -n "$$last" ]; then \
		echo "Error: Automatic rollback not implemented. Last migration: $$last" >&2; \
		echo "Manually apply the corresponding down migration or restore from backup." >&2; \
		exit 1; \
	else \
		echo "No migrations to rollback."; \
	fi

seed: ## Seed development data
	@echo "Seeding development data..."
	@if [ ! -f scripts/seed.sql ]; then echo "Error: scripts/seed.sql not found" >&2; exit 1; fi
	@if ! docker exec -i $(PG_CONTAINER) psql -U $${POSTGRES_USER:-vallexis} -d $${POSTGRES_DB:-vallexis_db} < scripts/seed.sql; then \
		echo "Error: Seeding failed" >&2; exit 1; \
	fi
	@echo "Seed complete."

reset-db: ## Drop and recreate the database (destructive!)
	@read -p "Are you sure? This will DELETE all data. [y/N] " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		if ! docker exec $(PG_CONTAINER) psql -U $${POSTGRES_USER:-vallexis} -c "DROP DATABASE IF EXISTS $${POSTGRES_DB:-vallexis_db};"; then \
			echo "Error: Failed to drop database" >&2; exit 1; \
		fi; \
		if ! docker exec $(PG_CONTAINER) psql -U $${POSTGRES_USER:-vallexis} -c "CREATE DATABASE $${POSTGRES_DB:-vallexis_db};"; then \
			echo "Error: Failed to create database" >&2; exit 1; \
		fi; \
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
	@$(foreach svc,$(SERVICES),docker build -t vallexis-$(svc):scan -f src/$(svc)/Dockerfile . && trivy image --severity CRITICAL,HIGH vallexis-$(svc):scan;)

# --- Docker ---

build: ## Build all Docker images
	docker compose build

logs: ## Tail all service logs
	docker compose logs -f
