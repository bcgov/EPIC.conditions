# condition-cron

Scheduled cron job that processes pending document extraction requests. It reads records from the `extraction_requests` database table, fetches the corresponding PDF via the Object Storage API, extracts conditions using the condition-parser AI pipeline, and loads the results into the condition database.

---

## How It Works

1. **Trigger** — `go-crond` runs the job on a schedule (default: every 30 minutes)
2. **Poll** — queries `condition.extraction_requests` WHERE `status = 'pending'` ORDER BY `created_date ASC`
3. **Process** — for each pending record:
   - Sets status → `processing`
   - Authenticates with Keycloak using a service-account client credentials grant
   - Requests a presigned GET URL from the Object Storage API for the `s3_url` stored in the record
   - Downloads the PDF from the presigned URL
   - Classifies the document type (numbered conditions, table format, etc.)
   - Extracts and enriches all conditions via OpenAI GPT
   - Extracts First Nations references from the document
   - Loads conditions, subconditions, and attributes into PostgreSQL
   - Sets status → `completed`
4. **On failure** — sets status → `failed` and stores the error message in `error_message` column for inspection

Documents are never deleted from S3. Processing state is managed entirely through the `extraction_requests` table status column.

---

## File Retrieval — Object Storage API

The cron does **not** connect to S3 directly. Instead it delegates to the shared Object Storage API (the same service the web frontend uses for uploads):

```
POST {OBJECT_STORAGE_URL}/storage-operations/presigned-urls
  Body:  { "relative_url": "<s3_url>", "action": "GET" }
  Auth:  Bearer <Keycloak service-account token>

← { "presigned_url": "https://..." }

GET <presigned_url>   ← streams the PDF
```

The Keycloak token is obtained via the `client_credentials` grant and cached locally until 60 seconds before expiry.

---

## Extraction Request Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Uploaded via UI, waiting to be processed |
| `processing` | Currently being processed by the cron |
| `completed` | Successfully extracted and loaded into the database |
| `failed` | Processing failed — see `error_message` column for details. Will be retried on the next cron run. |

---

## Project Structure

```
condition-cron/
├── cron/
│   └── crontab                  # go-crond schedule definition
├── src/condition_cron/
│   ├── services/
│   │   ├── db_service.py        # Reads/updates extraction_requests table
│   │   ├── extraction_service.py # Thin wrapper around condition-parser
│   │   ├── loader_service.py    # Inserts extracted data into PostgreSQL
│   │   └── s3_service.py        # Fetches PDFs via Object Storage API (presigned URLs)
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

The cron imports condition-parser modules directly at runtime. The Dockerfile copies `../condition-parser` into the image at `/condition-parser` and adds it to `PYTHONPATH`.

```
PYTHONPATH=/condition-cron/src:/condition-parser
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
| `OBJECT_STORAGE_URL` | Base URL of the Object Storage service that issues presigned S3 URLs |
| `KEYCLOAK_URL` | Keycloak base URL (e.g. `https://loginproxy.gov.bc.ca/auth`) |
| `KEYCLOAK_REALM` | Keycloak realm name |
| `KEYCLOAK_CLIENT_ID` | Service-account client ID |
| `KEYCLOAK_CLIENT_SECRET` | Service-account client secret |
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

`make install` installs both `requirements.txt` (cron dependencies) and `../condition-parser/requirements.txt` (AI pipeline dependencies) into the same virtualenv.

`make run` sets `PYTHONPATH` correctly so `condition-parser` modules resolve, then runs `invoke_jobs.py PROCESS_DOCUMENTS`.

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
docker build -t condition-cron .
docker run --env-file .env condition-cron
```

---

## Cron Schedule

The default schedule runs every 30 minutes. Edit `cron/crontab` to change the interval:

```
*/30 * * * * default cd /condition-cron && ./run_process_documents.sh
```
