# condition-cron

Scheduled cron job that processes pending document extraction requests. It reads records from the `extraction_requests` database table, downloads the corresponding PDF directly from S3, extracts conditions using the cron-owned AI extraction package, and saves the parsed JSON for staff review.

---

## How It Works

1. **Trigger** — `go-crond` runs the job on a schedule (default: every 30 minutes)
2. **Poll** — queries `condition.extraction_requests` WHERE `status = 'pending'`, plus stale `processing` records older than two hours, ORDER BY `created_date ASC`
3. **Process** — for each pending record:
   - Sets status → `processing`
   - Downloads the PDF from S3 using the `s3_url` key stored in the record
   - Classifies the document type (numbered conditions, table format, etc.)
   - Extracts and enriches all conditions via OpenAI GPT
   - Extracts First Nations references from the document
   - Saves the parsed JSON in `condition.extraction_requests.extracted_data`
   - Sets status → `completed`
4. **On failure** — sets status → `failed` and stores the error message in `error_message` column for inspection
5. **Staff review** — staff preview the completed extraction in the web UI, then either import it into the condition tables or reject it

Documents are never deleted from S3. Processing state is managed entirely through the `extraction_requests` table status column.

---

## File Retrieval — S3

The cron is a trusted backend job, so it connects directly to S3 with credentials supplied through deployment secrets. Condition extraction uploads are stored under the `condition_extraction_documents/` prefix. The `s3_url` value stored on each extraction request is used as the S3 object key, matching the relative URL returned by EPIC.document.

Use a read-only S3 credential scoped to the document bucket, and preferably to the `condition_extraction_documents/` prefix used by this workflow.

---

## Extraction Request Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Uploaded via UI, waiting to be processed |
| `processing` | Currently being processed by the cron |
| `completed` | Successfully extracted and saved to `extracted_data` for staff review |
| `failed` | Processing failed — see `error_message` column for details. Staff can switch to manual entry. |
| `imported` | Staff imported the extracted JSON into the condition tables |
| `rejected` | Staff rejected or stopped the extraction; raw extracted JSON is cleared |

---

## Project Structure

```
condition-cron/
├── cron/
│   └── crontab                  # go-crond schedule definition
├── src/condition_cron/
│   ├── services/
│   │   ├── db_service.py        # Reads/updates extraction_requests table
│   │   ├── extraction_service.py # Thin wrapper around condition_cron.extraction
│   │   └── s3_service.py        # Downloads PDFs directly from S3
│   ├── tasks/
│   │   └── process_documents.py # Main pipeline orchestrator
│   └── utils/
│       └── logger.py
├── config.py                    # Flask config (dev / docker / prod)
├── invoke_jobs.py               # Entry point — called by the cron shell script
├── Makefile
├── Dockerfile
├── sample.env
└── requirements.txt
```

---

## Dependencies

The cron owns its runtime extraction package under `src/condition_cron/extraction`. It no longer depends on copying or importing the sibling `condition-parser` folder at runtime.

```
PYTHONPATH=/condition-cron/src
```

---

## Environment Variables

Copy `sample.env` to `.env` and fill in the values.

| Variable | Description |
|----------|-------------|
| `FLASK_ENV` | `development`, `docker`, or `production` |
| `DATABASE_USERNAME` | PostgreSQL username |
| `DATABASE_PASSWORD` | PostgreSQL password |
| `DATABASE_NAME` | PostgreSQL database name |
| `DATABASE_HOST` | PostgreSQL host |
| `DATABASE_PORT` | PostgreSQL port (default: `5432`) |
| `S3_BUCKET` | S3 bucket name |
| `S3_ACCESS_KEY_ID` | S3 access key ID |
| `S3_SECRET_ACCESS_KEY` | S3 secret access key |
| `S3_HOST` | S3 endpoint host, without protocol unless the provider requires one |
| `S3_REGION` | S3 region (defaults to `us-east-1` in code if unset) |
| `S3_SERVICE` | S3 service name, usually `s3` |
| `EXTRACTOR_API_URL` | Azure-hosted extractor API URL (optional) |
| `EXTRACTOR_API_KEY` | Extractor API key (optional) |

---

## Running Locally

```bash
# Copy and fill in environment variables
cp sample.env .env

# Create virtual environment and install all dependencies
make install

# Run the job manually
make run
```

`make install` installs the cron runtime dependencies, including the OpenAI and PDF libraries used by `condition_cron.extraction`.

`make run` sets `PYTHONPATH` correctly so `condition_cron` modules resolve, then runs `invoke_jobs.py PROCESS_DOCUMENTS`.

### Available Make targets

```
make setup       Clean everything and re-create the venv from scratch
make install     Create venv and install all dependencies
make clean       Remove venv and all generated files
make run         Run PROCESS_DOCUMENTS job manually
make build       Build the Docker image
make docker-run  Run the job once inside Docker (requires .env)
make help        List all targets
```

---

## Running with Docker

```bash
cd condition-cron
docker build -t condition-cron .
docker run --env-file .env condition-cron
```

---

## Cron Schedule

The default schedule runs every 30 minutes. Edit `cron/crontab` to change the interval:

```
*/30 * * * * default cd /condition-cron && ./run_process_documents.sh
```
