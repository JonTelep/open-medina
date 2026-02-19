IMAGE_NAME := accountability
CONTAINER_NAME := accountability
PORT := 3000
DATA_DIR := $(CURDIR)/data

.PHONY: build run clean rebuild stop logs seed shell

build:
	podman build -t $(IMAGE_NAME) -f Containerfile .

run:
	@mkdir -p $(DATA_DIR)
	podman run -d \
		--name $(CONTAINER_NAME) \
		--replace \
		-p $(PORT):3000 \
		-v $(DATA_DIR):/app/data:Z \
		$(IMAGE_NAME)
	@echo "Running at http://localhost:$(PORT)"

stop:
	-podman stop $(CONTAINER_NAME)
	-podman rm $(CONTAINER_NAME)

clean: stop
	-podman rmi $(IMAGE_NAME)

rebuild: clean build run

logs:
	podman logs -f $(CONTAINER_NAME)

seed:
	podman exec $(CONTAINER_NAME) npx tsx src/db/seed.ts

shell:
	podman exec -it $(CONTAINER_NAME) /bin/sh
