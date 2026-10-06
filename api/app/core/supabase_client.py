from __future__ import annotations

from functools import lru_cache
from typing import Optional

from supabase import Client, create_client

from app.config import get_settings


@lru_cache(maxsize=1)
def service_client() -> Client:
    """Supabase client using the service role key — bypasses RLS.

    All server-side writes go through this. We enforce access control via the
    JWT dependency (`current_user`) and by filtering every query by user_id.
    """
    s = get_settings()
    if not s.supabase_url or not s.supabase_service_role_key:
        raise RuntimeError("Supabase service client not configured")
    return create_client(s.supabase_url, s.supabase_service_role_key)


def user_client(access_token: Optional[str]) -> Client:
    """Supabase client acting as the end-user (RLS applies). Useful for storage
    paths where we want ACLs enforced by Postgres directly."""
    s = get_settings()
    client = create_client(s.supabase_url, s.supabase_publishable_key)
    if access_token:
        client.postgrest.auth(access_token)
        try:
            client.storage._client.headers["Authorization"] = f"Bearer {access_token}"
        except Exception:
            pass
    return client
