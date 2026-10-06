from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import jwt
from fastapi import Depends, Header, HTTPException, status

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


async def current_user(
    authorization: Optional[str] = Header(default=None),
) -> CurrentUser:
    settings = get_settings()
    token = _bearer(authorization)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server auth not configured (SUPABASE_JWT_SECRET missing)",
        )
    try:
        claims = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}")

    email = (claims.get("email") or "").lower()
    if not email.endswith(f"@{settings.allowed_email_domain}"):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail=f"Only @{settings.allowed_email_domain} accounts are allowed",
        )

    return CurrentUser(id=claims["sub"], email=email, raw_claims=claims)


UserDep = Depends(current_user)
