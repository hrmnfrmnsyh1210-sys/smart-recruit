import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.candidate import Candidate
from app.models.user import User
from app.schemas.candidate import CandidateResponse, CandidateUpdate, PaginatedCandidates
from app.security.jwt_handler import get_current_user
from app.security.encryption import decrypt_data
from app.security.permissions import check_role
from app.models.ranking import AuditLog

router = APIRouter(prefix="/candidates", tags=["Candidates"])


def _candidate_to_response(candidate: Candidate) -> CandidateResponse:
    return CandidateResponse(
        id=candidate.id,
        full_name=decrypt_data(candidate.full_name_encrypted) if candidate.full_name_encrypted else "",
        email=decrypt_data(candidate.email_encrypted) if candidate.email_encrypted else "",
        phone=decrypt_data(candidate.phone_encrypted) if candidate.phone_encrypted else None,
        skills=candidate.skills or [],
        experience=candidate.experience or [],
        education=candidate.education or [],
        certifications=candidate.certifications or [],
        summary=candidate.summary,
        source=candidate.source,
        created_at=candidate.created_at,
        updated_at=candidate.updated_at,
    )


@router.get("", response_model=PaginatedCandidates)
async def list_candidates(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    skills: str = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Candidate)

    # Search by summary (can't search encrypted fields efficiently)
    if search:
        query = query.filter(
            or_(
                Candidate.summary.ilike(f"%{search}%"),
                Candidate.skills.cast(str).ilike(f"%{search}%"),
            )
        )

    # Filter by skills
    if skills:
        skill_list = skills.split(",")
        for skill in skill_list:
            query = query.filter(Candidate.skills.cast(str).ilike(f"%{skill.strip()}%"))

    total = query.count()

    # Sorting
    sort_col = getattr(Candidate, sort_by, Candidate.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    # Pagination
    offset = (page - 1) * page_size
    candidates = query.offset(offset).limit(page_size).all()

    return PaginatedCandidates(
        items=[_candidate_to_response(c) for c in candidates],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Kandidat tidak ditemukan")
    return _candidate_to_response(candidate)


@router.put("/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(
    candidate_id: int,
    data: CandidateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_role(current_user, "admin", "recruiter")
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Kandidat tidak ditemukan")

    update_data = data.model_dump(exclude_unset=True)
    # Convert pydantic models to dicts for JSON columns
    if "experience" in update_data and update_data["experience"] is not None:
        update_data["experience"] = [e.model_dump() if hasattr(e, 'model_dump') else e for e in update_data["experience"]]
    if "education" in update_data and update_data["education"] is not None:
        update_data["education"] = [e.model_dump() if hasattr(e, 'model_dump') else e for e in update_data["education"]]

    for key, value in update_data.items():
        setattr(candidate, key, value)

    db.commit()
    db.refresh(candidate)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="update",
        entity_type="candidate",
        entity_id=candidate_id,
        details={"fields_updated": list(update_data.keys())},
    )
    db.add(audit)
    db.commit()

    return _candidate_to_response(candidate)


@router.delete("/{candidate_id}")
async def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_role(current_user, "admin", "recruiter")
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Kandidat tidak ditemukan")

    # Audit log before deletion
    audit = AuditLog(
        user_id=current_user.id,
        action="delete",
        entity_type="candidate",
        entity_id=candidate_id,
        details={"reason": "user_requested"},
    )
    db.add(audit)

    db.delete(candidate)
    db.commit()
    return {"message": "Kandidat berhasil dihapus"}


@router.get("/{candidate_id}/export")
async def export_candidate_data(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """GDPR: Right to data portability"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Kandidat tidak ditemukan")

    response_data = _candidate_to_response(candidate)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="export",
        entity_type="candidate",
        entity_id=candidate_id,
    )
    db.add(audit)
    db.commit()

    return JSONResponse(
        content=json.loads(response_data.model_dump_json()),
        headers={"Content-Disposition": f"attachment; filename=candidate-{candidate_id}-data.json"},
    )
