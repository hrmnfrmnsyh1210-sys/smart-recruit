import io
import csv
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.resume import Resume
from app.models.ranking import Ranking
from app.schemas.ranking import RankingResponse, RunRankingRequest, RunRankingResponse
from app.schemas.candidate import CandidateResponse
from app.security.jwt_handler import get_current_user
from app.security.encryption import decrypt_data
from app.security.permissions import check_role
from app.ai.matcher import compute_similarity
from app.ai.ranker import rank_candidates

router = APIRouter(prefix="/ranking", tags=["Ranking"])


def _ranking_to_response(ranking: Ranking) -> RankingResponse:
    candidate_resp = None
    if ranking.candidate:
        candidate_resp = CandidateResponse(
            id=ranking.candidate.id,
            full_name=decrypt_data(ranking.candidate.full_name_encrypted) if ranking.candidate.full_name_encrypted else "",
            email=decrypt_data(ranking.candidate.email_encrypted) if ranking.candidate.email_encrypted else "",
            phone=decrypt_data(ranking.candidate.phone_encrypted) if ranking.candidate.phone_encrypted else None,
            skills=ranking.candidate.skills or [],
            experience=ranking.candidate.experience or [],
            education=ranking.candidate.education or [],
            certifications=ranking.candidate.certifications or [],
            summary=ranking.candidate.summary,
            source=ranking.candidate.source,
            created_at=ranking.candidate.created_at,
            updated_at=ranking.candidate.updated_at,
        )

    return RankingResponse(
        id=ranking.id,
        job_id=ranking.job_id,
        candidate_id=ranking.candidate_id,
        overall_score=float(ranking.overall_score or 0),
        skill_score=float(ranking.skill_score or 0),
        experience_score=float(ranking.experience_score or 0),
        education_score=float(ranking.education_score or 0),
        certification_score=float(ranking.certification_score or 0),
        semantic_similarity=float(ranking.semantic_similarity or 0),
        rank_position=ranking.rank_position or 0,
        matched_skills=ranking.matched_skills or [],
        missing_skills=ranking.missing_skills or [],
        explanation=ranking.explanation,
        candidate=candidate_resp,
        created_at=ranking.created_at,
    )


@router.post("/run", response_model=RunRankingResponse)
async def run_ranking(
    request: RunRankingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_role(current_user, "admin", "recruiter")

    job = db.query(Job).filter(Job.id == request.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Lowongan tidak ditemukan")

    # Get unique candidate IDs that have at least one completed resume
    # Using a subquery to avoid duplicate candidates from the join
    completed_candidate_ids = (
        db.query(Resume.candidate_id)
        .filter(Resume.processing_status == "completed")
        .distinct()
        .subquery()
    )
    candidates = (
        db.query(Candidate)
        .filter(Candidate.id.in_(completed_candidate_ids))
        .all()
    )

    if not candidates:
        raise HTTPException(
            status_code=400,
            detail="Tidak ada kandidat yang tersedia untuk di-ranking. Pastikan pelamar sudah mengupload CV.",
        )

    # Run ranking
    ranking_results = rank_candidates(job, candidates)

    # Delete old rankings for this job, then save new ones
    db.query(Ranking).filter(Ranking.job_id == request.job_id).delete(synchronize_session=False)
    db.flush()

    # Save new rankings
    for result in ranking_results:
        ranking = Ranking(
            job_id=request.job_id,
            candidate_id=result["candidate_id"],
            overall_score=result["overall_score"],
            skill_score=result["skill_score"],
            experience_score=result["experience_score"],
            education_score=result["education_score"],
            certification_score=result["certification_score"],
            semantic_similarity=result["semantic_similarity"],
            rank_position=result["rank_position"],
            matched_skills=result["matched_skills"],
            missing_skills=result["missing_skills"],
            explanation=result["explanation"],
        )
        db.add(ranking)

    db.commit()

    task_id = str(uuid.uuid4())
    return RunRankingResponse(
        task_id=task_id,
        message=f"Ranking selesai. {len(ranking_results)} kandidat di-ranking.",
    )


@router.get("/job/{job_id}", response_model=list[RankingResponse])
async def get_rankings_by_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rankings = (
        db.query(Ranking)
        .options(joinedload(Ranking.candidate))
        .filter(Ranking.job_id == job_id)
        .order_by(Ranking.rank_position)
        .all()
    )
    return [_ranking_to_response(r) for r in rankings]


@router.get("/compare", response_model=list[RankingResponse])
async def compare_candidates(
    candidate_ids: str = Query(..., description="Comma-separated candidate IDs"),
    job_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ids = [int(id.strip()) for id in candidate_ids.split(",")]
    rankings = (
        db.query(Ranking)
        .options(joinedload(Ranking.candidate))
        .filter(Ranking.job_id == job_id, Ranking.candidate_id.in_(ids))
        .order_by(Ranking.rank_position)
        .all()
    )
    return [_ranking_to_response(r) for r in rankings]


@router.get("/export/{job_id}")
async def export_rankings(
    job_id: int,
    format: str = Query("csv"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rankings = (
        db.query(Ranking)
        .options(joinedload(Ranking.candidate))
        .filter(Ranking.job_id == job_id)
        .order_by(Ranking.rank_position)
        .all()
    )

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Rank", "Nama", "Email", "Skor Total", "Skor Skills",
            "Skor Pengalaman", "Skor Pendidikan", "Skor Sertifikasi",
            "Similarity", "Skills Cocok", "Skills Kurang", "Penjelasan",
        ])

        for r in rankings:
            name = decrypt_data(r.candidate.full_name_encrypted) if r.candidate and r.candidate.full_name_encrypted else ""
            email = decrypt_data(r.candidate.email_encrypted) if r.candidate and r.candidate.email_encrypted else ""
            writer.writerow([
                r.rank_position, name, email,
                float(r.overall_score or 0), float(r.skill_score or 0),
                float(r.experience_score or 0), float(r.education_score or 0),
                float(r.certification_score or 0), float(r.semantic_similarity or 0),
                ", ".join(r.matched_skills or []),
                ", ".join(r.missing_skills or []),
                r.explanation or "",
            ])

        output.seek(0)
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=ranking-job-{job_id}.csv"},
        )

    raise HTTPException(status_code=400, detail="Format tidak didukung. Gunakan 'csv'.")
