# Condition Loader

Batch loader that reads extracted condition JSON files and inserts them into the PostgreSQL database.

## Prerequisites

- Python 3.12+
- PostgreSQL database with the `condition` schema set up
- `make` (optional, for using the Makefile)

## Setup

### Using Make

```bash
cd condition-loader
make setup
```

This creates a Python virtual environment and installs all dependencies from `requirements.txt`.

### Manual Setup

```bash
cd condition-loader
python -m venv venv

# Activate the virtual environment
source venv/bin/activate      # Mac/Linux
venv\Scripts\activate          # Windows

pip install -r requirements.txt
```

## Configuration

1. Copy `sample.env` to `.env`:
   ```bash
   cp sample.env .env
   ```

2. Update the database credentials in `.env`:
   ```
   DB_NAME=app
   DB_USER=condition
   DB_PASSWORD=condition
   DB_HOST=localhost
   DB_PORT=5432
   ```

## Usage

1. Place your extracted condition JSON files in the `condition_jsons/` folder.
Open the file in your editor (e.g., VS Code).

Press Ctrl + H (Find & Replace).

Replace:
“ → '
” → '
‘ → '
’ → '

Save the file.

2. Run the loader:
   ```bash
   # Using Make
   make run

   # Or directly
   python main.py
   ```

The loader will process all `.json` files in the `condition_jsons/` directory, inserting projects, documents, conditions, clauses, and deliverable attributes into the database.

## Input File Format

JSON files should be placed in the `condition_jsons/` folder. The filename convention is `{project_id}_{document_id}.json`.
