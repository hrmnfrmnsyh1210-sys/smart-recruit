import os
from app.config import get_settings


def get_upload_path(filename: str) -> str:
    settings = get_settings()
    upload_dir = os.path.abspath(settings.UPLOAD_DIR)
    os.makedirs(upload_dir, exist_ok=True)
    return os.path.join(upload_dir, filename)


def delete_file(file_path: str) -> bool:
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
    except OSError:
        pass
    return False


def validate_file_size(content: bytes, max_size: int = None) -> bool:
    settings = get_settings()
    max_size = max_size or settings.MAX_FILE_SIZE
    return len(content) <= max_size
