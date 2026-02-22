"""Semantic Similarity Matching Module."""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


# Global TF-IDF vectorizer (lightweight alternative to sentence-transformers)
_vectorizer = None


def _get_vectorizer():
    global _vectorizer
    if _vectorizer is None:
        _vectorizer = TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 2),
            stop_words="english",
        )
    return _vectorizer


def compute_similarity(text1: str, text2: str) -> float:
    """Compute semantic similarity between two texts using TF-IDF + cosine similarity."""
    if not text1 or not text2:
        return 0.0

    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        stop_words="english",
    )

    try:
        tfidf_matrix = vectorizer.fit_transform([text1, text2])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(similarity)
    except Exception:
        return 0.0


def compute_skill_match(candidate_skills: list[str], required_skills: list[str]) -> dict:
    """Compute skill matching between candidate and job requirements."""
    if not required_skills:
        return {"score": 100.0, "matched": candidate_skills or [], "missing": []}

    candidate_set = {s.lower() for s in (candidate_skills or [])}
    required_set = {s.lower() for s in required_skills}

    matched = candidate_set & required_set
    missing = required_set - candidate_set

    # Also check for partial matches (e.g., "React.js" matches "React")
    for req in list(missing):
        for cand in candidate_set:
            if req in cand or cand in req:
                matched.add(req)
                missing.discard(req)
                break

    score = (len(matched) / len(required_set)) * 100 if required_set else 100.0

    return {
        "score": round(score, 2),
        "matched": [s.title() if len(s) > 3 else s.upper() for s in matched],
        "missing": [s.title() if len(s) > 3 else s.upper() for s in missing],
    }


def compute_experience_score(
    candidate_experience: list[dict],
    job_description: str,
    min_years: int = 0,
) -> float:
    """Score candidate experience relevance."""
    if not candidate_experience:
        return 0.0

    score = 0.0
    total_entries = len(candidate_experience)

    # Base score for having experience
    score += min(total_entries * 15, 40)

    # Relevance scoring via text similarity
    for exp in candidate_experience:
        exp_text = f"{exp.get('title', '')} {exp.get('company', '')} {exp.get('description', '')}"
        if exp_text.strip():
            relevance = compute_similarity(exp_text, job_description)
            score += relevance * 30  # Up to 30 points for relevance

    # Duration bonus
    for exp in candidate_experience:
        duration = exp.get("duration", "")
        if "present" in duration.lower() or "sekarang" in duration.lower():
            score += 10
            break

    return min(score, 100.0)


def compute_education_score(
    candidate_education: list[dict],
    required_level: str = "",
) -> float:
    """Score candidate education."""
    if not candidate_education:
        return 20.0  # Base score even without education info

    score = 40.0  # Base for having education
    education_levels = {
        "sma": 20, "smk": 20, "diploma": 30, "d3": 30, "d4": 35,
        "sarjana": 40, "bachelor": 40, "s1": 40,
        "master": 60, "magister": 60, "s2": 60, "mba": 60,
        "doktor": 80, "phd": 80, "s3": 80,
    }

    max_edu_score = 0
    for edu in candidate_education:
        degree = (edu.get("degree", "") + " " + edu.get("institution", "")).lower()
        for level, level_score in education_levels.items():
            if level in degree:
                max_edu_score = max(max_edu_score, level_score)

    score = max(score, max_edu_score)

    # Bonus for relevant institution
    if any("universitas" in (e.get("institution", "")).lower() or
           "university" in (e.get("institution", "")).lower() or
           "institut" in (e.get("institution", "")).lower()
           for e in candidate_education):
        score += 10

    return min(score, 100.0)


def compute_certification_score(certifications: list[str]) -> float:
    """Score candidate certifications."""
    if not certifications:
        return 0.0

    # Base score per certification
    score = min(len(certifications) * 20, 60)

    # Bonus for well-known certifications
    premium_certs = [
        "aws", "azure", "google cloud", "gcp", "cisco", "pmp",
        "scrum", "comptia", "oracle", "microsoft", "certified",
    ]

    for cert in certifications:
        cert_lower = cert.lower()
        if any(pc in cert_lower for pc in premium_certs):
            score += 15

    return min(score, 100.0)
