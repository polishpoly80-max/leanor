"""Storage backends: Astra DB (via astrapy) and an in-memory store for local dev."""

from __future__ import annotations

import logging
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Protocol

logger = logging.getLogger("leanor.storage")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Storage(Protocol):
    mode: str

    def insert(self, document: dict[str, Any]) -> str: ...
    def list(self, limit: int = 200) -> list[dict[str, Any]]: ...
    def get(self, document_id: str) -> dict[str, Any] | None: ...
    def delete(self, document_id: str) -> bool: ...


class MemoryStorage:
    """Process-local store. Submissions are lost when the server stops."""

    mode = "memory"

    def __init__(self) -> None:
        self._documents: dict[str, dict[str, Any]] = {}
        self._lock = threading.Lock()

    def insert(self, document: dict[str, Any]) -> str:
        document_id = str(uuid.uuid4())
        with self._lock:
            self._documents[document_id] = {"_id": document_id, **document}
        return document_id

    def list(self, limit: int = 200) -> list[dict[str, Any]]:
        with self._lock:
            docs = list(self._documents.values())
        docs.sort(key=lambda d: str(d.get("created_at", "")), reverse=True)
        return docs[:limit]

    def get(self, document_id: str) -> dict[str, Any] | None:
        with self._lock:
            doc = self._documents.get(document_id)
        return dict(doc) if doc else None

    def delete(self, document_id: str) -> bool:
        with self._lock:
            return self._documents.pop(document_id, None) is not None


class AstraStorage:
    """Persists submissions as documents in an Astra DB Serverless collection."""

    mode = "astra"

    def __init__(self, api_endpoint: str, application_token: str, collection_name: str) -> None:
        from astrapy import DataAPIClient

        self._collection_name = collection_name
        client = DataAPIClient(token=application_token)
        self._database = client.get_database(api_endpoint, token=application_token)
        self._collection = self._ensure_collection()

    def _ensure_collection(self):
        """Return the collection, creating it on first use.

        Every branch ends with a real server round-trip: a lazy ``get_collection``
        never talks to the server, which would let bad endpoints/tokens slip
        through and only explode later on each read/write.
        """
        try:
            collection = self._database.get_collection(self._collection_name)
            list(collection.find({}, limit=1))  # bad token/DNS/missing collection raise here
            return collection
        except Exception:
            pass
        try:
            collection = self._database.create_collection(self._collection_name)
            logger.info("Created Astra DB collection %r", self._collection_name)
            list(collection.find({}, limit=1))
            return collection
        except Exception:
            pass
        # Collection already exists (or a concurrent create raced us): probe once
        # more so genuine connection errors propagate to the caller.
        collection = self._database.get_collection(self._collection_name)
        list(collection.find({}, limit=1))
        return collection

    def insert(self, document: dict[str, Any]) -> str:
        result = self._collection.insert_one(document)
        return str(result.inserted_id)

    def list(self, limit: int = 200) -> list[dict[str, Any]]:
        cursor = self._collection.find({}, sort={"created_at": -1}, limit=limit)
        return [dict(doc) for doc in cursor]

    def get(self, document_id: str) -> dict[str, Any] | None:
        doc = self._collection.find_one({"_id": document_id})
        return dict(doc) if doc else None

    def delete(self, document_id: str) -> bool:
        result = self._collection.delete_one({"_id": document_id})
        return bool(result.deleted_count)
