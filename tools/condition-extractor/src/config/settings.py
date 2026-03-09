"""
Application settings for the EPIC Condition Extractor.

All configuration is driven by environment variables (or a .env file).
"""

from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    azure_openai_api_key: str = Field("", alias="AZURE_OPENAI_API_KEY")
    azure_openai_endpoint: str = Field("", alias="AZURE_OPENAI_ENDPOINT")
    azure_openai_deployment: str = Field("", alias="AZURE_OPENAI_DEPLOYMENT")
    azure_openai_api_version: str = Field("2024-10-21", alias="AZURE_OPENAI_API_VERSION")
    openai_api_key: str = Field("", alias="OPENAI_API_KEY")
    api_key: str = Field("", alias="API_KEY")
    port: int = Field(8000, alias="PORT")

    model_config = {"populate_by_name": True, "env_file": ".env", "extra": "ignore"}


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
