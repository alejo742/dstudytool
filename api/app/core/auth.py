from __future__ import annotations

import ssl
from dataclasses import dataclass
from functools import lru_cache
from typing import Optional

import certifi
import jwt
from fastapi import Depends, Header, HTTPException, status
from jwt import PyJWKClient
from jwt.exceptions import PyJWKClientError

from app.config import get_settings


@dataclass
class CurrentUser:
    id: str
    email: str
    raw_claims: dict


def _bearer(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient:
    settings = get_settings()
    ctx = ssl.create_default_context(cafile=certifi.where())
    return PyJWKClient(
        f"{settings.supabase_url}/auth/v1/.well-known/jwks.json",
        ssl_context=ctx,
    )


def _decode(token: str) -> dict:
    """Verify a Supabase access token.

    Supabase projects created after mid-2024 sign tokens with asymmetric keys
    (RS256/ES256) exposed via JWKS; older projects sign with HS256 using the
    project JWT secret. We dispatch on the token header's `alg`.
    """
    settings = get_settings()
    header = jwt.get_unverified_header(token)
    alg = header.get("alg", "")

    if alg == "HS256":
        if not settings.supabase_jwt_secret:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server auth not configured (SUPABASE_JWT_SECRET missing)",
            )
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"require": ["exp", "sub"]},
        )

    if alg in {"RS256", "ES256"}:
        if not settings.supabase_url:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server auth not configured (SUPABASE_URL missing)",
            )
        signing_key = _jwks_client().get_signing_key_from_jwt(token).key
        return jwt.decode(
            token,
            signing_key,
            algorithms=[alg],
            audience="authenticated",
            options={"require": ["exp", "sub"]},
        )

    raise HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        detail=f"Unsupported token algorithm: {alg}",
    )


async def current_user(
    authorization: Optional[str] = Header(default=None),
) -> CurrentUser:
    token = _bearer(authorization)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    settings = get_settings()
    try:
        claims = _decode(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}")
    except PyJWKClientError as e:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to verify token (JWKS fetch failed): {e}",
        )

    email = (claims.get("email") or "").lower()
    if not email.endswith(f"@{settings.allowed_email_domain}"):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail=f"Only @{settings.allowed_email_domain} accounts are allowed",
        )

    return CurrentUser(id=claims["sub"], email=email, raw_claims=claims)


UserDep = Depends(current_user)
