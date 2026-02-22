import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.candidate import Candidate
from app.models.resume import Resume
from app.security.jwt_handler import get_current_user
from app.security.encryption import encrypt_data
from app.config import get_settings
from app.ai.parser import extract_text
from app.ai.preprocessor import preprocess_text
from app.ai.extractor import extract_entities

router = APIRouter(prefix="/upload", tags=["Upload"])
settings = get_settings()

ALLOWED_CONTENT_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/octet-stream": None,  # Will detect by extension
}

ALLOWED_EXTENSIONS = {".pdf": "pdf", ".docx": "docx"}


def _detect_file_type(filename: str, content_type: str) -> Optional[str]:
    """Detect file type from content type or file extension."""
    # First try by extension (most reliable)
    if filename:
        ext = os.path.splitext(filename)[1].lower()
        if ext in ALLOWED_EXTENSIONS:
            return ALLOWED_EXTENSIONS[ext]
    # Then try by content type
    if content_type in ALLOWED_CONTENT_TYPES:
        result = ALLOWED_CONTENT_TYPES[content_type]
        if result:
            return result
    return None


@router.post("/resume")
async def upload_resumes(
    files: list[UploadFile] = File(...),
    job_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    results = []
    task_ids = []

    for file in files:
        # Validate file type
        file_ext = _detect_file_type(file.filename or "", file.content_type or "")
        if not file_ext:
            results.append({"file": file.filename, "error": "Tipe file tidak didukung. Gunakan PDF atau DOCX."})
            continue

        # Validate file size
        content = await file.read()
        if len(content) > settings.MAX_FILE_SIZE:
            results.append({"file": file.filename, "error": "File terlalu besar (max 10MB)"})
            continue
        file_id = str(uuid.uuid4())
        file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}.{file_ext}")
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        with open(file_path, "wb") as f:
            f.write(content)

        # Extract text from CV
        try:
            raw_text = extract_text(file_path, file_ext)
            processed_text = preprocess_text(raw_text)
            parsed_data = extract_entities(raw_text)

            # Create candidate with encrypted PII
            candidate = Candidate(
                full_name_encrypted=encrypt_data(parsed_data.get("name", "Unknown")),
                email_encrypted=encrypt_data(parsed_data.get("email", "")),
                phone_encrypted=encrypt_data(parsed_data.get("phone", "")),
                skills=parsed_data.get("skills", []),
                experience=parsed_data.get("experience", []),
                education=parsed_data.get("education", []),
                certifications=parsed_data.get("certifications", []),
                summary=parsed_data.get("summary", ""),
                source="upload",
                consent_given=True,
            )
            db.add(candidate)
            db.flush()

            # Create resume record
            resume = Resume(
                candidate_id=candidate.id,
                file_path=file_path,
                file_type=file_ext,
                file_size=len(content),
                raw_text=raw_text,
                parsed_data=parsed_data,
                processing_status="completed",
            )
            db.add(resume)
            db.commit()

            task_id = file_id
            task_ids.append(task_id)
            results.append({
                "file": file.filename,
                "task_id": task_id,
                "candidate_id": candidate.id,
                "status": "completed",
            })

        except Exception as e:
            # Save resume with failed status
            candidate = Candidate(
                full_name_encrypted=encrypt_data(file.filename or "Unknown"),
                email_encrypted=encrypt_data(""),
                phone_encrypted=encrypt_data(""),
                source="upload",
            )
            db.add(candidate)
            db.flush()

            resume = Resume(
                candidate_id=candidate.id,
                file_path=file_path,
                file_type=file_ext,
                file_size=len(content),
                processing_status="failed",
            )
            db.add(resume)
            db.commit()

            task_ids.append(file_id)
            results.append({
                "file": file.filename,
                "task_id": file_id,
                "status": "failed",
                "error": str(e),
            })

    return {"task_ids": task_ids, "results": results, "message": f"{len(task_ids)} files processed"}


@router.get("/status/{task_id}")
async def get_upload_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    # For synchronous processing, always return completed
    return {
        "task_id": task_id,
        "status": "completed",
        "progress": 100,
        "message": "Processing complete",
    }
