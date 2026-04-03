"""Condition Cron — job entry point.

Usage:
    python invoke_jobs.py PROCESS_DOCUMENTS
"""

import os
import sys
from datetime import datetime

from flask import Flask

import config
from src.condition_cron.utils.logger import setup_logging

setup_logging(os.path.join(os.path.abspath(os.path.dirname(__file__)), 'logging.conf'))


def create_app(run_mode=os.getenv('FLASK_ENV', 'production')):
    """Return a configured Flask app using the factory method."""
    app = Flask(__name__)
    app.config.from_object(config.get_named_config(run_mode))
    app.logger.info('<<<< Starting Condition Cron Jobs >>>>')
    return app


def run(job_name):
    from tasks.process_documents import ProcessDocuments

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
