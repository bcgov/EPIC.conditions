"""All configuration for the condition-cron service."""

import os
import sys

from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())


def _float_env(name: str, default: str) -> float:
    """Read a float environment variable with a safe default."""
    try:
        return float(os.getenv(name, default))
    except (TypeError, ValueError):
        return float(default)


def get_named_config(config_name: str = 'development'):
    """Return the configuration object based on the name."""
    if config_name in ['production', 'staging', 'default']:
        return ProdConfig()
    elif config_name == 'testing':
        return TestConfig()
    elif config_name == 'development':
        return DevConfig()
    elif config_name == 'docker':
        return DockerConfig()
    raise KeyError(f"Unknown configuration '{config_name}'")


class _Config:
    """Base configuration."""

    PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))

    TESTING = False
    DEBUG = False

    # PostgreSQL
    DB_USER = os.getenv('DATABASE_USERNAME', '')
    DB_PASSWORD = os.getenv('DATABASE_PASSWORD', '')
    DB_NAME = os.getenv('DATABASE_NAME', '')
    DB_HOST = os.getenv('DATABASE_HOST', '')
    DB_PORT = os.getenv('DATABASE_PORT', '5432')

    # S3 object storage
    S3_BUCKET = os.getenv('S3_BUCKET', '')
    S3_ACCESS_KEY_ID = os.getenv('S3_ACCESS_KEY_ID', '')
    S3_SECRET_ACCESS_KEY = os.getenv('S3_SECRET_ACCESS_KEY', '')
    S3_HOST = os.getenv('S3_HOST', '')
    S3_REGION = os.getenv('S3_REGION', 'us-east-1')
    S3_SERVICE = os.getenv('S3_SERVICE', 's3')

    # OpenAI / Extractor
    EXTRACTOR_API_URL = os.getenv('EXTRACTOR_API_URL', '')
    EXTRACTOR_API_KEY = os.getenv('EXTRACTOR_API_KEY', '')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    EXTRACTION_UNSUPPORTED_CONFIDENCE_THRESHOLD = _float_env(
        'EXTRACTION_UNSUPPORTED_CONFIDENCE_THRESHOLD',
        '0.75',
    )

    # Queue timing settings shared with condition-api for UI estimates.
    #
    # The cron schedule itself is still managed by cron/crontab or a deployment
    # config map. If that schedule changes, update
    # EXTRACTION_QUEUE_CRON_INTERVAL_MINUTES here and in condition-api so the UI
    # queue estimates stay accurate.
    EXTRACTION_QUEUE_CRON_INTERVAL_MINUTES = int(
        os.getenv('EXTRACTION_QUEUE_CRON_INTERVAL_MINUTES', '30')
    )
    EXTRACTION_PROCESSING_ESTIMATE_MINUTES = int(
        os.getenv('EXTRACTION_PROCESSING_ESTIMATE_MINUTES', '15')
    )
    EXTRACTION_PROCESSING_STALE_AFTER_MINUTES = int(
        os.getenv('EXTRACTION_PROCESSING_STALE_AFTER_MINUTES', '120')
    )


class DevConfig(_Config):
    DEBUG = True


class TestConfig(_Config):
    DEBUG = True
    TESTING = True
    DB_USER = os.getenv('DATABASE_TEST_USERNAME', 'postgres')
    DB_PASSWORD = os.getenv('DATABASE_TEST_PASSWORD', 'postgres')
    DB_NAME = os.getenv('DATABASE_TEST_NAME', 'testdb')
    DB_HOST = os.getenv('DATABASE_TEST_HOST', 'localhost')
    DB_PORT = os.getenv('DATABASE_TEST_PORT', '5432')


class DockerConfig(_Config):
    DB_USER = os.getenv('DATABASE_DOCKER_USERNAME', '')
    DB_PASSWORD = os.getenv('DATABASE_DOCKER_PASSWORD', '')
    DB_NAME = os.getenv('DATABASE_DOCKER_NAME', '')
    DB_HOST = os.getenv('DATABASE_DOCKER_HOST', '')
    DB_PORT = os.getenv('DATABASE_DOCKER_PORT', '5432')


class ProdConfig(_Config):
    SECRET_KEY = os.getenv('SECRET_KEY', None)

    if not SECRET_KEY:
        SECRET_KEY = os.urandom(24)
        print('WARNING: SECRET_KEY being set as a one-shot', file=sys.stderr)

    TESTING = False
    DEBUG = False
