import re


def validate_email(email: str) -> bool:
    pattern = r'^[\w.+-]+@[\w-]+\.[\w.-]+$'
    return bool(re.match(pattern, email))


def validate_file_type(content_type: str) -> bool:
    allowed = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    return content_type in allowed


def sanitize_filename(filename: str) -> str:
    """Remove potentially dangerous characters from filenames."""
    # Remove path separators and null bytes
    filename = filename.replace("/", "_").replace("\\", "_").replace("\x00", "")
    # Remove leading dots to prevent hidden files
    filename = filename.lstrip(".")
    return filename or "unnamed"
