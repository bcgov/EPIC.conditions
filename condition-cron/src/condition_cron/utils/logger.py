"""Logging setup helper."""

import logging
import logging.config
import os


def setup_logging(conf_file: str | None = None):
    """Configure logging from file, or fall back to basicConfig."""
    if conf_file and os.path.exists(conf_file):
        logging.config.fileConfig(conf_file, disable_existing_loggers=False)
    else:
        logging.basicConfig(
            level=logging.DEBUG,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        )
