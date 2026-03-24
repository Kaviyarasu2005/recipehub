import os
import uuid
import logging
from django.conf import settings
from supabase import create_client, Client

logger = logging.getLogger(__name__)

# Lazy singleton — avoid creating the client at module import time.
_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """Return a cached Supabase client, creating it on first call."""
    global _supabase_client
    if _supabase_client is None:
        url = getattr(settings, "SUPABASE_URL", "")
        key = getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "")
        
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file."
            )
        _supabase_client = create_client(url, key)
    return _supabase_client


def upload_file_to_supabase(file_obj, bucket_name='videos') -> str:
    """Upload a file to Supabase Storage and return its public URL."""
    import mimetypes
    supabase = get_supabase_client()
    
    file_ext = os.path.splitext(file_obj.name)[1]
    filename = f"{uuid.uuid4()}{file_ext}"

    # Determine content type
    content_type = getattr(file_obj, 'content_type', None)
    if not content_type:
        content_type, _ = mimetypes.guess_type(file_obj.name)
    if not content_type:
        content_type = 'application/octet-stream'

    # Read file content
    if hasattr(file_obj, 'seek'):
        file_obj.seek(0)
    content = file_obj.read()

    # Upload to Supabase Storage
    supabase.storage.from_(bucket_name).upload(
        path=filename,
        file=content,
        file_options={"content-type": content_type}
    )

    # Get public URL
    public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
    if hasattr(public_url, 'public_url'):
        public_url = public_url.public_url
        
    return public_url


def delete_file_from_supabase(public_url: str, bucket_name='videos') -> None:
    """Delete a file from Supabase Storage given its public URL."""
    supabase = get_supabase_client()
    # Extract filename from public URL (last part, handling potential query params)
    filename = public_url.split('/')[-1].split('?')[0]
    try:
        supabase.storage.from_(bucket_name).remove([filename])
    except Exception as e:
        logger.warning(
            "Failed to delete orphan file %s from bucket %s: %s",
            filename, bucket_name, e,
        )
