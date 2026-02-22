from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.database import get_db
from app.models.user import User
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.resume import Resume
from app.models.ranking import Ranking
from app.security.jwt_handler import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
async def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_candidates = db.query(func.count(Candidate.id)).scalar()
    total_jobs = db.query(func.count(Job.id)).scalar()
    open_positions = db.query(func.count(Job.id)).filter(Job.status == "open").scalar()

    avg_score = db.query(func.avg(Ranking.overall_score)).scalar()

    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_uploads = (
        db.query(func.count(Resume.id))
        .filter(Resume.uploaded_at >= week_ago)
        .scalar()
    )

    return {
        "total_candidates": total_candidates or 0,
        "total_jobs": total_jobs or 0,
        "open_positions": open_positions or 0,
        "avg_score": round(float(avg_score or 0), 1),
        "recent_uploads": recent_uploads or 0,
    }


@router.get("/applicants-trend")
async def get_applicants_trend(
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_date = datetime.utcnow() - timedelta(days=days)

    results = (
        db.query(
            func.date(Candidate.created_at).label("date"),
            func.count(Candidate.id).label("count"),
        )
        .filter(Candidate.created_at >= start_date)
        .group_by(func.date(Candidate.created_at))
        .order_by(func.date(Candidate.created_at))
        .all()
    )

    # Fill in missing dates
    trend = []
    current = start_date.date()
    end = datetime.utcnow().date()
    date_counts = {str(r.date): r.count for r in results}

    while current <= end:
        date_str = str(current)
        trend.append({"date": date_str, "count": date_counts.get(date_str, 0)})
        current += timedelta(days=1)

    return trend


@router.get("/score-distribution")
async def get_score_distribution(
    job_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Ranking.overall_score)
    if job_id:
        query = query.filter(Ranking.job_id == job_id)

    scores = [float(r[0]) for r in query.all() if r[0] is not None]

    ranges = [
        ("0-20", 0, 20),
        ("20-40", 20, 40),
        ("40-60", 40, 60),
        ("60-80", 60, 80),
        ("80-100", 80, 100),
    ]

    distribution = []
    for label, low, high in ranges:
        count = sum(1 for s in scores if low <= s < high or (high == 100 and s == 100))
        distribution.append({"range": label, "count": count})

    return distribution


@router.get("/source-breakdown")
async def get_source_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = (
        db.query(
            Candidate.source,
            func.count(Candidate.id).label("count"),
        )
        .group_by(Candidate.source)
        .all()
    )

    total = sum(r.count for r in results) or 1
    return [
        {
            "source": r.source or "unknown",
            "count": r.count,
            "percentage": round(r.count / total * 100, 1),
        }
        for r in results
    ]


@router.get("/bias-report/{job_id}")
async def get_bias_report(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rankings = (
        db.query(Ranking)
        .filter(Ranking.job_id == job_id)
        .all()
    )

    if not rankings:
        return {
            "job_id": job_id,
            "total_candidates": 0,
            "demographic_distribution": {},
            "score_by_demographic": {},
            "four_fifths_compliant": True,
            "details": "Tidak ada data ranking untuk lowongan ini.",
        }

    total = len(rankings)
    scores = [float(r.overall_score or 0) for r in rankings]
    avg_score = sum(scores) / len(scores) if scores else 0

    # Score distribution analysis
    high_scorers = sum(1 for s in scores if s >= 60)
    selection_rate = high_scorers / total if total > 0 else 0

    # Basic quartile analysis for bias detection
    sorted_scores = sorted(scores)
    q1_scores = sorted_scores[: total // 4]
    q4_scores = sorted_scores[3 * total // 4 :]
    q1_avg = sum(q1_scores) / len(q1_scores) if q1_scores else 0
    q4_avg = sum(q4_scores) / len(q4_scores) if q4_scores else 0

    # 4/5ths rule check (comparing quartiles as proxy)
    q1_rate = sum(1 for s in q1_scores if s >= 60) / len(q1_scores) if q1_scores else 0
    q4_rate = sum(1 for s in q4_scores if s >= 60) / len(q4_scores) if q4_scores else 0
    max_rate = max(q1_rate, q4_rate, 0.001)
    min_rate = min(q1_rate, q4_rate)
    four_fifths_compliant = (min_rate / max_rate) >= 0.8 if max_rate > 0 else True

    return {
        "job_id": job_id,
        "total_candidates": total,
        "demographic_distribution": {
            "Kuartil 1 (Bawah)": len(q1_scores),
            "Kuartil 2-3 (Tengah)": total - len(q1_scores) - len(q4_scores),
            "Kuartil 4 (Atas)": len(q4_scores),
        },
        "score_by_demographic": {
            "Kuartil 1 Rata-rata": round(q1_avg, 1),
            "Overall Rata-rata": round(avg_score, 1),
            "Kuartil 4 Rata-rata": round(q4_avg, 1),
            "Selection Rate": round(selection_rate * 100, 1),
        },
        "four_fifths_compliant": four_fifths_compliant,
        "details": (
            f"Analisis {total} kandidat. Rata-rata skor: {avg_score:.1f}. "
            f"Selection rate (skor >= 60): {selection_rate*100:.1f}%. "
            f"{'Compliant' if four_fifths_compliant else 'Non-compliant'} dengan aturan 4/5ths."
        ),
    }
