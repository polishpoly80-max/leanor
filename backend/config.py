"""Application configuration loaded from environment variables / .env file."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent

load_dotenv(BACKEND_DIR / ".env")


def _split_csv(value: str) -> list[str]:
    return [part.strip() for part in value.split(",") if part.strip()]


def _as_int(value: str | None, default: int) -> int:
    try:
        return int(str(value).strip() or default)
    except ValueError:
        return default


class Settings:
    """Every tunable of the API in one place, all overridable through .env."""

    def __init__(self) -> None:
        # --- storage ---------------------------------------------------
        self.storage_backend: str = (
            os.getenv("STORAGE_BACKEND", "auto").strip().lower() or "auto"
        )
        self.astra_api_endpoint: str = os.getenv("ASTRA_DB_API_ENDPOINT", "").strip()
        self.astra_application_token: str = os.getenv(
            "ASTRA_DB_APPLICATION_TOKEN", ""
        ).strip()
        self.astra_collection: str = (
            os.getenv("ASTRA_COLLECTION", "submissions").strip() or "submissions"
        )

        # --- admin / security -------------------------------------------
        self.admin_password: str = os.getenv("ADMIN_PASSWORD", "").strip()
        self.token_secret: str = os.getenv("TOKEN_SECRET", "").strip()
        self.token_ttl_hours: int = _as_int(os.getenv("TOKEN_TTL_HOURS"), 12)

        # --- http ------------------------------------------------------
        self.cors_origins: list[str] = _split_csv(
            os.getenv(
                "CORS_ORIGINS",
                "http://localhost:41783,http://127.0.0.1:41783",
            )
        )

        # --- uploads ---------------------------------------------------
        self.max_upload_mb: int = _as_int(os.getenv("MAX_UPLOAD_MB"), 5)
        self.max_pictures: int = _as_int(os.getenv("MAX_PICTURES"), 8)
        self.max_id_cards: int = _as_int(os.getenv("MAX_ID_CARDS"), 2)
        self.upload_dir: Path = Path(
            os.getenv("UPLOAD_DIR", str(BACKEND_DIR / "uploads"))
        )
        self.frontend_dist: Path = PROJECT_DIR / "frontend" / "dist"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def has_astra_credentials(self) -> bool:
        return bool(self.astra_api_endpoint and self.astra_application_token)

    @property
    def auth_enabled(self) -> bool:
        """Without a password the inbox stays open — only for local dev."""
        return bool(self.admin_password)


settings = Settings()