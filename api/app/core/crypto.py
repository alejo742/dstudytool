from __future__ import annotations

from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

from app.config import get_settings


@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    s = get_settings()
    if not s.api_key_encryption_key:
        raise RuntimeError("API_KEY_ENCRYPTION_KEY is not set")
    return Fernet(s.api_key_encryption_key.encode())


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken as e:
        raise RuntimeError("Stored secret could not be decrypted") from e


def mask_hint(key: str) -> str:
    key = key.strip()
    if len(key) <= 8:
        return "•" * len(key)
    return f"{key[:4]}••••{key[-4:]}"
