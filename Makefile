.PHONY: help

help: ## Display this help screen
	@grep -E '^[a-z.A-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## installs dependancies
	npm install

run: install ## run the aem instance (port 3000)
	npx aem up

storybook: ## runs the storybook
	npm run storybook

lint: ## always lint before pushing!
	npm run lint