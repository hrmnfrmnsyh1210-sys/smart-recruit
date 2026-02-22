"""Ranking Engine - Scores and ranks candidates against job requirements."""

from app.ai.matcher import (
    compute_similarity,
    compute_skill_match,
    compute_experience_score,
    compute_education_score,
    compute_certification_score,
)
from app.config import get_settings


def rank_candidates(job, candidates: list) -> list[dict]:
    """Rank candidates for a given job posting.

    Args:
        job: Job model instance with title, description, skills_required, etc.
        candidates: List of Candidate model instances.

    Returns:
        List of ranking result dictionaries, sorted by overall_score descending.
    """
    settings = get_settings()
    results = []

    job_text = f"{job.title} {job.description} {job.requirements or ''}"
    job_skills = job.skills_required or []

    for candidate in candidates:
        # 1. Skill matching
        skill_result = compute_skill_match(
            candidate.skills or [],
            job_skills,
        )
        skill_score = skill_result["score"]

        # 2. Experience scoring
        experience_score = compute_experience_score(
            candidate.experience or [],
            job_text,
            job.min_experience_years,
        )

        # 3. Education scoring
        education_score = compute_education_score(
            candidate.education or [],
            job.education_level or "",
        )

        # 4. Certification scoring
        certification_score = compute_certification_score(
            candidate.certifications or [],
        )

        # 5. Semantic similarity (CV summary vs job description)
        candidate_text = candidate.summary or ""
        if candidate.skills:
            candidate_text += " " + " ".join(candidate.skills)
        if candidate.experience:
            for exp in candidate.experience:
                candidate_text += f" {exp.get('title', '')} {exp.get('description', '')}"

        semantic_sim = compute_similarity(candidate_text, job_text)

        # 6. Weighted overall score
        overall_score = (
            skill_score * settings.SKILL_WEIGHT +
            experience_score * settings.EXPERIENCE_WEIGHT +
            education_score * settings.EDUCATION_WEIGHT +
            certification_score * settings.CERTIFICATION_WEIGHT
        )

        # Boost with semantic similarity
        overall_score = overall_score * 0.8 + (semantic_sim * 100) * 0.2

        # Generate explanation
        explanation = _generate_explanation(
            skill_score, experience_score, education_score,
            certification_score, semantic_sim, skill_result,
        )

        results.append({
            "candidate_id": candidate.id,
            "overall_score": round(overall_score, 2),
            "skill_score": round(skill_score, 2),
            "experience_score": round(experience_score, 2),
            "education_score": round(education_score, 2),
            "certification_score": round(certification_score, 2),
            "semantic_similarity": round(semantic_sim, 4),
            "rank_position": 0,  # Will be set after sorting
            "matched_skills": skill_result["matched"],
            "missing_skills": skill_result["missing"],
            "explanation": explanation,
        })

    # Sort by overall score descending
    results.sort(key=lambda x: x["overall_score"], reverse=True)

    # Assign rank positions
    for i, result in enumerate(results):
        result["rank_position"] = i + 1

    return results


def _generate_explanation(
    skill_score: float,
    experience_score: float,
    education_score: float,
    certification_score: float,
    semantic_sim: float,
    skill_result: dict,
) -> str:
    """Generate human-readable explanation of the ranking."""
    parts = []

    # Skill assessment
    matched_count = len(skill_result["matched"])
    missing_count = len(skill_result["missing"])
    total_required = matched_count + missing_count

    if total_required > 0:
        if skill_score >= 80:
            parts.append(f"Kecocokan skill sangat baik ({matched_count}/{total_required} skill cocok).")
        elif skill_score >= 60:
            parts.append(f"Kecocokan skill baik ({matched_count}/{total_required} skill cocok).")
        elif skill_score >= 40:
            parts.append(f"Kecocokan skill cukup ({matched_count}/{total_required} skill cocok).")
        else:
            parts.append(f"Kecocokan skill rendah ({matched_count}/{total_required} skill cocok).")

    if skill_result["missing"]:
        parts.append(f"Skill yang kurang: {', '.join(skill_result['missing'][:5])}.")

    # Experience assessment
    if experience_score >= 70:
        parts.append("Pengalaman kerja sangat relevan.")
    elif experience_score >= 40:
        parts.append("Pengalaman kerja cukup relevan.")
    elif experience_score > 0:
        parts.append("Pengalaman kerja kurang relevan.")
    else:
        parts.append("Tidak ada data pengalaman.")

    # Education assessment
    if education_score >= 60:
        parts.append("Latar belakang pendidikan sesuai.")
    elif education_score >= 30:
        parts.append("Latar belakang pendidikan cukup.")

    # Semantic similarity
    if semantic_sim >= 0.5:
        parts.append("Profil secara keseluruhan sangat cocok dengan posisi ini.")
    elif semantic_sim >= 0.3:
        parts.append("Profil secara keseluruhan cukup cocok.")

    return " ".join(parts)
