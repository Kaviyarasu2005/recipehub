import uuid
import logging
from django.conf import settings
from supabase import create_client, Client

logger = logging.getLogger(__name__)

# Lazy singleton — avoid creating the client at module import time,
# which would crash if Django settings aren't fully loaded yet.
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


def upload_file_to_supabase(file, bucket_name: str) -> str:
    """Upload a file to Supabase Storage and return its public URL."""
    import mimetypes
    supabase = get_supabase_client()
    
    file_ext = file.name.split('.')[-1] if '.' in file.name else ''
    file_name = f"{uuid.uuid4()}.{file_ext}" if file_ext else str(uuid.uuid4())

    # Determine content type
    content_type = getattr(file, 'content_type', None)
    if not content_type:
        content_type, _ = mimetypes.guess_type(file.name)
    if not content_type:
        content_type = 'application/octet-stream'

    if hasattr(file, 'seek'):
        file.seek(0)
    file_bytes = file.read()
    
    logger.info("Uploading %s (%d bytes, %s) to bucket '%s'",
                file.name, len(file_bytes), content_type, bucket_name)

    try:
        supabase.storage.from_(bucket_name).upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
    except Exception as exc:
        logger.exception("Supabase storage upload error for %s", file_name)
        raise RuntimeError(f"Supabase upload failed for {file.name}: {exc}") from exc

    res = supabase.storage.from_(bucket_name).get_public_url(file_name)
    
    # Handle both string response and object response
    public_url = res.public_url if hasattr(res, 'public_url') else res
    if isinstance(public_url, dict):
        public_url = public_url.get('publicURL') or public_url.get('public_url')
        
    logger.info("Upload successful, public URL: %s", public_url)
    return public_url


def delete_file_from_supabase(public_url: str, bucket_name: str) -> None:
    """Delete a file from Supabase Storage given its public URL."""
    supabase = get_supabase_client()
    filename = public_url.split("/")[-1].split("?")[0]
    try:
        supabase.storage.from_(bucket_name).remove([filename])
    except Exception as e:
        logger.warning(
            "Failed to delete file %s from bucket %s: %s",
            filename, bucket_name, e,
        )
