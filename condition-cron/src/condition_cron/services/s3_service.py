"""Document storage service — downloads files via the Object Storage API (presigned URLs).

Instead of connecting to S3 directly, this service authenticates with Keycloak as a
service account, requests a presigned GET URL from the Object Storage API, then
downloads the file from that URL.  No S3 credentials are required in the cron.
"""

import logging
import os
import tempfile
import time

import requests
from flask import current_app

logger = logging.getLogger(__name__)

_token_cache: dict = {'token': None, 'expires_at': 0.0}


class ObjectStorageAccessError(RuntimeError):
    """Raised when the cron cannot authenticate to or download from object storage."""


def _get_token() -> str:
    """Return a valid Keycloak service-account access token, refreshing when near expiry."""
    now = time.time()
    if _token_cache['token'] and now < _token_cache['expires_at']:
        return _token_cache['token']

    cfg = current_app.config
    url = (
        f"{cfg['KEYCLOAK_URL'].rstrip('/')}"
        f"/realms/{cfg['KEYCLOAK_REALM']}"
        f"/protocol/openid-connect/token"
    )
    try:
        resp = requests.post(
            url,
            data={
                'grant_type': 'client_credentials',
                'client_id': cfg['KEYCLOAK_CLIENT_ID'],
                'client_secret': cfg['KEYCLOAK_CLIENT_SECRET'],
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        raise ObjectStorageAccessError(
            f"Failed to fetch Keycloak service token from {url}: {exc}"
        ) from exc

    _token_cache['token'] = data['access_token']
    _token_cache['expires_at'] = now + data.get('expires_in', 300) - 60
    return _token_cache['token']


def download_file(key: str) -> str:
    """Download a file from object storage via presigned URL. Returns the local file path."""
    cfg = current_app.config
    storage_url = cfg['OBJECT_STORAGE_URL'].rstrip('/')
    token = _get_token()

    # 1. Request a presigned GET URL from the Object Storage API
    presigned_url_endpoint = f'{storage_url}/storage-operations/presigned-urls'
    try:
        resp = requests.post(
            presigned_url_endpoint,
            params={'public-read': False},
            json={'relative_url': key, 'action': 'GET'},
            headers={'Authorization': f'Bearer {token}'},
            timeout=15,
        )
        resp.raise_for_status()
        presigned_url = resp.json()['presigned_url']
    except requests.RequestException as exc:
        raise ObjectStorageAccessError(
            f"Failed to fetch presigned download URL for {key} from {presigned_url_endpoint}: {exc}"
        ) from exc
    except KeyError as exc:
        raise ObjectStorageAccessError(
            f"Object storage response for {key} did not contain presigned_url"
        ) from exc

    # 2. Stream the file to a temp location
    filename = os.path.basename(key)
    tmp = tempfile.NamedTemporaryFile(suffix=f'_{filename}', delete=False)
    try:
        try:
            with requests.get(presigned_url, stream=True, timeout=120) as r:
                r.raise_for_status()
                for chunk in r.iter_content(chunk_size=8192):
                    tmp.write(chunk)
        except requests.RequestException as exc:
            raise ObjectStorageAccessError(
                f"Failed to download file for {key} from presigned URL: {exc}"
            ) from exc
    finally:
        tmp.close()

    logger.info('Downloaded %s → %s', key, tmp.name)
    return tmp.name
