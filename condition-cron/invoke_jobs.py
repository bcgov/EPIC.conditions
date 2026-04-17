"""Condition Cron — job entry point.

Usage:
    python invoke_jobs.py PROCESS_DOCUMENTS
"""

import os
import sys
from datetime import datetime

from flask import Flask

import config

CURRENT_DIR = os.path.abspath(os.path.dirname(__file__))
SRC_DIR = os.path.join(CURRENT_DIR, 'src')
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from condition_cron.utils.logger import setup_logging

setup_logging(os.path.join(CURRENT_DIR, 'logging.conf'))


def validate_runtime_config(app: Flask) -> None:
    """Fail fast when required runtime configuration is missing."""
    required_keys = [
        "DB_USER",
        "DB_PASSWORD",
        "DB_NAME",
        "DB_HOST",
        "S3_BUCKET",
        "S3_ACCESS_KEY_ID",
        "S3_SECRET_ACCESS_KEY",
        "S3_HOST",
    ]
    missing = [key for key in required_keys if not app.config.get(key)]
    if missing:
        raise RuntimeError(
            f"Missing required condition-cron configuration: {', '.join(missing)}"
        )

    has_extractor_proxy = bool(app.config.get("EXTRACTOR_API_URL") and app.config.get("EXTRACTOR_API_KEY"))
    has_direct_openai = bool(app.config.get("OPENAI_API_KEY"))
    if not has_extractor_proxy and not has_direct_openai:
        raise RuntimeError(
            "Missing extractor configuration: set EXTRACTOR_API_URL and EXTRACTOR_API_KEY "
            "for the Azure extractor proxy, or set OPENAI_API_KEY for direct OpenAI."
        )


def create_app(run_mode=os.getenv('FLASK_ENV', 'production')):
    """Return a configured Flask app using the factory method."""
    app = Flask(__name__)
    app.config.from_object(config.get_named_config(run_mode))
    validate_runtime_config(app)
    app.logger.info('<<<< Starting Condition Cron Jobs >>>>')
    return app


def run(job_name):
    from condition_cron.tasks.process_documents import ProcessDocuments

    application = create_app()

    with application.app_context():
        print('Requested Job:', job_name)

        if job_name == 'PROCESS_DOCUMENTS':
            print('Starting Document Processing At', datetime.now())
            ProcessDocuments.process()
            application.logger.info('<<<< Completed Process Documents Task >>>>')
        else:
            print(f'Unknown job: {job_name}', file=sys.stderr)
            sys.exit(1)


if __name__ == '__main__':
    run(*sys.argv[1:])
