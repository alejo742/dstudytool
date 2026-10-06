from __future__ import annotations

import logging
from typing import Optional

from app.core.crypto import decrypt, encrypt, mask_hint
from app.features.api_keys import repository

log = logging.getLogger(__name__)


def set_key(user_id: str, key: str) -> dict:
    key = key.strip()
    hint = mask_hint(key)
    encrypted = encrypt(key)
    return repository.upsert(user_id, encrypted_key=encrypted, hint=hint)


def get_decrypted(user_id: str) -> Optional[str]:
    row = repository.get(user_id)
    if not row:
        return None
    return decrypt(row["encrypted_key"])


def status_row(user_id: str) -> dict:
    row = repository.get(user_id)
    if not row:
        return {"configured": False, "last_verified_at": None, "masked_hint": None}
    return {
        "configured": True,
        "last_verified_at": row.get("last_verified_at"),
        "masked_hint": row.get("hint"),
    }


def verify_key(user_id: str) -> bool:
    """Quick live check against Dartmouth-hosted model via langchain_dartmouth.
    Treats any successful ChatDartmouth.invoke() as a pass.
    """
    key = get_decrypted(user_id)
    if not key:
        return False
    try:
        # Import here to avoid import cost at module load.
        import os

        os.environ["DARTMOUTH_CHAT_API_KEY"] = key
        from langchain_dartmouth.llms import ChatDartmouth
        from app.config import get_settings

        llm = ChatDartmouth(model_name=get_settings().dartmouth_default_model)
        resp = llm.invoke("Respond with the single word: OK.")
        ok = bool(resp and getattr(resp, "content", ""))
        if ok:
            repository.mark_verified(user_id)
        return ok
    except Exception as e:
        log.warning("Dartmouth key verification failed: %s", e)
        return False


def remove(user_id: str) -> None:
    repository.delete(user_id)
