"""Logging setup shared by the API and worker services."""

import logging
import os
import sys


def configure_logging() -> logging.Logger:
    level_name = os.getenv("SWEPILOT_LOG_LEVEL", "INFO").upper()
    logging.basicConfig(
        level=getattr(logging, level_name, logging.INFO),
        format="%(asctime)s | %(levelname)-8s | %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stdout,
        force=True,
    )
    for name in ("LiteLLM", "litellm", "openai", "httpx", "httpcore", "uvicorn.access"):
        logging.getLogger(name).setLevel(logging.WARNING)
    logging.getLogger("minisweagent").setLevel(logging.INFO)
    return logging.getLogger("SWEPilot")


logger = configure_logging()


def log(message: str, level: int = logging.INFO) -> None:
    logger.log(level, message)
