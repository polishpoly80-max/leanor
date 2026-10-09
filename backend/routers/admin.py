"""Admin sign-in endpoints."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from auth import (
    clear_failures,
    is_locked_out,
    issue_token,
    register_failure,
    require_admin,
    verify_password,
)
from config import settings

router = APIRouter(prefix="/api/admin", tags=["admin"])


class LoginBody(BaseModel):
    password: str = Field(..., min_length=1, max_length=200)


class LoginResponse(BaseModel):
    token: str
    expires_at: str
    auth_enabled: bool = True


@router.post("/login", response_model=LoginResponse)
def login(body: LoginBody, request: Request) -> LoginResponse:
    host = request.client.host if request.client else "unknown"

    if is_locked_out(host):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Try again in a few minutes.",
        )

    if not verify_password(body.password):
        register_failure(host)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password."
        )

    clear_failures(host)
    token, expires_at = issue_token()
    return LoginResponse(
        token=token,
        expires_at=datetime.fromtimestamp(expires_at, tz=timezone.utc).isoformat(),
        auth_enabled=settings.auth_enabled,
    )


@router.get("/session")
def session(claims: dict = Depends(require_admin)) -> dict:
    """Lets the frontend validate a stored token before showing the inbox."""
    return {
        "authenticated": True,
        "subject": claims.get("sub", "admin"),
        "expires_at": claims.get("exp"),
        "auth_enabled": settings.auth_enabled,
    }