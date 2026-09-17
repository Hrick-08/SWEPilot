"""Logging setup shared by the API and agent."""

import logging
import os
import sys

from .log_stream import WebSocketLogHandler


def configure_logging() -> logging.Logger:

    level_name = os.getenv("SWEPILOT_LOG_LEVEL", "INFO").upper()

    logging.basicConfig(
        level=getattr(logging, level_name, logging.INFO),
        format="%(asctime)s | %(levelname)-8s | %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stdout,
        force=True,
    )

    # Keep the existing terminal logging
    # and additionally send logs to WebSocketLogHandler
    root_logger = logging.getLogger()
    if not any(isinstance(handler, WebSocketLogHandler) for handler in root_logger.handlers):
        root_logger.addHandler(WebSocketLogHandler())

    for name in (
        "LiteLLM",
        "litellm",
        "openai",
        "httpx",
        "httpcore",
        "uvicorn.access",
    ):
        logging.getLogger(name).setLevel(logging.WARNING)

    logging.getLogger("minisweagent").setLevel(logging.INFO)

    return logging.getLogger("SWEPilot")


logger = configure_logging()


def log(message: str, level: int = logging.INFO) -> None:
    logger.log(level, message)