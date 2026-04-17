"""Tests for direct S3 document downloads."""

from pathlib import Path

from flask import Flask

from condition_cron.services import s3_service


def test_download_file_uses_s3_bucket_and_key(monkeypatch):
    """Downloads the requested key from the configured S3 bucket."""
    calls = {}

    class FakeS3Client:
        def download_file(self, bucket, key, destination):
            calls["bucket"] = bucket
            calls["key"] = key
            calls["destination"] = destination
            Path(destination).write_bytes(b"pdf")

    def fake_boto_client(service_name, **kwargs):
        calls["service_name"] = service_name
        calls["client_kwargs"] = kwargs
        return FakeS3Client()

    app = Flask(__name__)
    app.config.update(
        S3_BUCKET="documents",
        S3_ACCESS_KEY_ID="access",
        S3_SECRET_ACCESS_KEY="secret",
        S3_HOST="s3.example.com",
        S3_REGION="ca-central-1",
    )

    monkeypatch.setattr(s3_service.boto3, "client", fake_boto_client)

    with app.app_context():
        local_path = s3_service.download_file("condition_extraction_documents/document.pdf")

    try:
        assert Path(local_path).read_bytes() == b"pdf"
        assert calls["service_name"] == "s3"
        assert calls["bucket"] == "documents"
        assert calls["key"] == "condition_extraction_documents/document.pdf"
        assert calls["client_kwargs"]["endpoint_url"] == "https://s3.example.com"
        assert calls["client_kwargs"]["region_name"] == "ca-central-1"
        assert calls["client_kwargs"]["aws_access_key_id"] == "access"
        assert calls["client_kwargs"]["aws_secret_access_key"] == "secret"
    finally:
        Path(local_path).unlink(missing_ok=True)
