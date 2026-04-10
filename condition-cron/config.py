"""All configuration for the condition-cron service."""

import os
import sys

from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())


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

    # Object Storage API
    OBJECT_STORAGE_URL = os.getenv('OBJECT_STORAGE_URL', '')

    # Keycloak service account (for Object Storage API auth)
    KEYCLOAK_URL = os.getenv('KEYCLOAK_URL', '')
    KEYCLOAK_REALM = os.getenv('KEYCLOAK_REALM', '')
    KEYCLOAK_CLIENT_ID = os.getenv('KEYCLOAK_CLIENT_ID', '')
    KEYCLOAK_CLIENT_SECRET = os.getenv('KEYCLOAK_CLIENT_SECRET', '')

    # OpenAI / Extractor
    EXTRACTOR_API_URL = os.getenv('EXTRACTOR_API_URL', '')
    EXTRACTOR_API_KEY = os.getenv('EXTRACTOR_API_KEY', '')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')


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
