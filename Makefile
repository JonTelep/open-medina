IMAGE_NAME := accountability
CONTAINER_NAME := accountability
PORT := 3000
DATA_DIR := $(CURDIR)/data

.PHONY: help build run clean rebuild stop logs seed shell

.DEFAULT_GOAL := help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

build: ## Build the container image
	podman build -t $(IMAGE_NAME) -f Containerfile .

run: ## Run the container
	@mkdir -p $(DATA_DIR)
	podman run -d \
		--name $(CONTAINER_NAME) \
		--replace \
		-p $(PORT):3000 \
		-v $(DATA_DIR):/app/data:Z \
		$(IMAGE_NAME)
	@echo "Running at http://localhost:$(PORT)"

stop: ## Stop and remove the container
	-podman stop $(CONTAINER_NAME)
	-podman rm $(CONTAINER_NAME)

clean: stop ## Stop container and remove image
	-podman rmi $(IMAGE_NAME)

rebuild: clean build run ## Clean, build, and run from scratch

logs: ## Tail container logs
	podman logs -f $(CONTAINER_NAME)

seed: ## Seed the database
	podman exec $(CONTAINER_NAME) npx tsx src/db/seed.ts

shell: ## Open a shell in the container
	podman exec -it $(CONTAINER_NAME) /bin/sh
