"""Logging setup helper."""

import logging
import logging.config
import os
from typing import Optional


def setup_logging(conf_file: Optional[str] = None):
    """Configure logging from file, or fall back to a basic console logger."""
    if conf_file and os.path.exists(conf_file):
        logging.config.fileConfig(conf_file, disable_existing_loggers=False)
    else:
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        )
