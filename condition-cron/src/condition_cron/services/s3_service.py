"""Document storage service for downloading files directly from S3."""

import logging
import os
import tempfile

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from flask import current_app

logger = logging.getLogger(__name__)


class ObjectStorageAccessError(RuntimeError):
    """Raised when the cron cannot download from object storage."""


def _get_s3_client():
    """Create an S3 client using the same config shape as EPIC.document."""
    cfg = current_app.config
    s3_host = cfg['S3_HOST'].strip()
    endpoint_url = s3_host if s3_host.startswith(('http://', 'https://')) else f'https://{s3_host}'

    return boto3.client(
        's3',
        aws_access_key_id=cfg['S3_ACCESS_KEY_ID'],
        aws_secret_access_key=cfg['S3_SECRET_ACCESS_KEY'],
        endpoint_url=endpoint_url,
        region_name=cfg.get('S3_REGION') or 'us-east-1',
        config=Config(
            retries={'max_attempts': 3, 'mode': 'standard'},
            connect_timeout=60,
            read_timeout=120,
        ),
    )


def download_file(key: str) -> str:
    """Download a file directly from S3. Returns the local file path."""
    cfg = current_app.config
    filename = os.path.basename(key)
    tmp = tempfile.NamedTemporaryFile(suffix=f'_{filename}', delete=False)
    tmp.close()

    try:
        _get_s3_client().download_file(cfg['S3_BUCKET'], key, tmp.name)
    except (BotoCoreError, ClientError, OSError) as exc:
        if os.path.exists(tmp.name):
            os.remove(tmp.name)
        raise ObjectStorageAccessError(
            f"Failed to download file for {key} from S3 bucket {cfg['S3_BUCKET']}: {exc}"
        ) from exc
    finally:
        if not os.path.exists(tmp.name):
            logger.debug('Temporary download path was removed after failed S3 download: %s', tmp.name)

    logger.info('Downloaded %s from S3 bucket %s to %s', key, cfg['S3_BUCKET'], tmp.name)
    return tmp.name
