.PHONY: pull prune build up deploy

pull:
	git pull

prune: pull
	docker system prune -f

build: prune
	docker compose build

up: build
	docker compose up -d

deploy: up
