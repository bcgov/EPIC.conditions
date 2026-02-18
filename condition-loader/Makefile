VENV_DIR = venv

# Detect OS for activation path
ifeq ($(OS),Windows_NT)
	ACTIVATE = $(VENV_DIR)\Scripts\activate
	PYTHON = $(VENV_DIR)\Scripts\python
	PIP = $(VENV_DIR)\Scripts\pip
else
	ACTIVATE = $(VENV_DIR)/bin/activate
	PYTHON = $(VENV_DIR)/bin/python
	PIP = $(VENV_DIR)/bin/pip
endif

.PHONY: setup run clean

## Create virtual environment and install dependencies
setup:
	python -m venv $(VENV_DIR)
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r requirements.txt

## Run the condition loader
run:
	$(PYTHON) main.py

## Remove virtual environment
clean:
	rm -rf $(VENV_DIR)
