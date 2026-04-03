.PHONY: setup install clean clean-build clean-pyc run help

MKFILE_PATH:=$(abspath $(lastword $(MAKEFILE_LIST)))
CURRENT_ABS_DIR:=$(patsubst %/,%,$(dir $(MKFILE_PATH)))

PROJECT_NAME:=condition_cron
DOCKER_NAME:=condition_cron

#################################################################################
# COMMANDS -- Setup                                                             #
#################################################################################
setup: clean install ## Clean and re-create the virtual environment

clean: clean-build clean-pyc ## Remove venv and all generated files
	rm -rf venv/

clean-build: ## Remove build artefacts
	rm -fr build/
	rm -fr dist/
	rm -fr .eggs/
	find . -name '*.egg-info' -exec rm -fr {} +
	find . -name '*.egg' -exec rm -fr {} +

clean-pyc: ## Remove Python cache files
	find . -name '*.pyc' -exec rm -f {} +
	find . -name '*.pyo' -exec rm -f {} +
	find . -name '*~' -exec rm -f {} +
	find . -name '__pycache__' -exec rm -fr {} +

install: ## Create venv and install all dependencies (cron + condition-parser)
	test -f venv/bin/activate || python3 -m venv $(CURRENT_ABS_DIR)/venv ;\
	. venv/bin/activate ;\
	pip install --upgrade pip ;\
	pip install -Ur requirements.txt ;\
	pip install -Ur ../condition-parser/requirements.txt

#################################################################################
# COMMANDS -- Local                                                             #
#################################################################################
run: ## Run PROCESS_DOCUMENTS job manually
	. venv/bin/activate && \
	PYTHONPATH=$(CURRENT_ABS_DIR)/src:$(CURRENT_ABS_DIR)/src/condition_cron:$(CURRENT_ABS_DIR)/../condition-parser \
	python invoke_jobs.py PROCESS_DOCUMENTS

#################################################################################
# COMMANDS -- Docker                                                            #
#################################################################################
build: ## Build the Docker image
	docker build . -t $(DOCKER_NAME) \
		--build-arg VCS_REF=$(shell git rev-parse --short HEAD) \
		--build-arg BUILD_DATE=$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

build-nc: ## Build the Docker image without cache
	docker build --no-cache -t $(DOCKER_NAME) .

docker-run: ## Run the job once inside Docker (requires .env)
	docker run --env-file .env $(DOCKER_NAME)

#################################################################################
# Self Documenting Commands                                                     #
#################################################################################
.DEFAULT_GOAL := help

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
