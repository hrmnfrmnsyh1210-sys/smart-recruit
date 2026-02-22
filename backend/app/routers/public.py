"""Public API endpoints - no authentication required. For job applicants."""

import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.resume import Resume
from app.security.encryption import encrypt_data
from app.config import get_settings
from app.ai.parser import extract_text
from app.ai.extractor import extract_entities
from app.schemas.job import JobResponse

router = APIRouter(prefix="/public", tags=["Public"])
settings = get_settings()

ALLOWED_EXTENSIONS = {".pdf": "pdf", ".docx": "docx"}


def _detect_file_type(filename: str) -> Optional[str]:
    if filename:
        ext = os.path.splitext(filename)[1].lower()
        return ALLOWED_EXTENSIONS.get(ext)
    return None


@router.get("/jobs", response_model=list[JobResponse])
async def list_open_jobs(db: Session = Depends(get_db)):
    """List all open job positions - publicly accessible."""
    jobs = (
        db.query(Job)
        .filter(Job.status == "open")
        .order_by(Job.created_at.desc())
        .all()
    )
    return [JobResponse.model_validate(j) for j in jobs]


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job_detail(job_id: int, db: Session = Depends(get_db)):
    """Get job detail - publicly accessible."""
    job = db.query(Job).filter(Job.id == job_id, Job.status == "open").first()
    if not job:
        raise HTTPException(status_code=404, detail="Lowongan tidak ditemukan")
    return JobResponse.model_validate(job)


@router.post("/apply")
async def apply_for_job(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(""),
    job_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Submit a job application with CV - publicly accessible."""

    # Validate job exists and is open
    job = db.query(Job).filter(Job.id == job_id, Job.status == "open").first()
    if not job:
        raise HTTPException(status_code=404, detail="Lowongan tidak ditemukan atau sudah ditutup")

    # Validate file type
    file_ext = _detect_file_type(file.filename or "")
    if not file_ext:
        raise HTTPException(status_code=400, detail="Tipe file tidak didukung. Gunakan PDF atau DOCX.")

    # Validate file size
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File terlalu besar (max 10MB)")

    # Save file
    file_id = str(uuid.uuid4())
    file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}.{file_ext}")
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(content)

    # Parse CV
    try:
        raw_text = extract_text(file_path, file_ext)
        parsed_data = extract_entities(raw_text)
    except Exception:
        parsed_data = {}
        raw_text = ""

    # Create candidate with encrypted PII (use form data as primary, parsed as fallback)
    candidate = Candidate(
        full_name_encrypted=encrypt_data(full_name),
        email_encrypted=encrypt_data(email),
        phone_encrypted=encrypt_data(phone),
        skills=parsed_data.get("skills", []),
        experience=parsed_data.get("experience", []),
        education=parsed_data.get("education", []),
        certifications=parsed_data.get("certifications", []),
        summary=parsed_data.get("summary", ""),
        source="applicant_portal",
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

    return {
        "message": "Lamaran berhasil dikirim! Terima kasih telah melamar.",
        "candidate_id": candidate.id,
        "job_title": job.title,
    }
