import os
from functools import lru_cache

from openai import OpenAI


@lru_cache(maxsize=1)
def get_openai_client() -> OpenAI:
    """Return a single, cached instance of the OpenAI client based on environment variables."""
    return OpenAI(
        api_key=os.getenv("EXTRACTOR_API_KEY") or os.getenv("OPENAI_API_KEY") or "not-set",
        base_url=f"{os.getenv('EXTRACTOR_API_URL', '').rstrip('/')}/v1" if os.getenv("EXTRACTOR_API_URL") else None,
    )
