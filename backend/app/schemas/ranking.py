from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.candidate import CandidateResponse


class RankingBase(BaseModel):
    job_id: int
    candidate_id: int
    overall_score: float
    skill_score: float
    experience_score: float
    education_score: float
    certification_score: float
    semantic_similarity: float
    rank_position: int
    matched_skills: Optional[list[str]] = None
    missing_skills: Optional[list[str]] = None
    explanation: Optional[str] = None


class RankingResponse(RankingBase):
    id: int
    candidate: Optional[CandidateResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RunRankingRequest(BaseModel):
    job_id: int


class RunRankingResponse(BaseModel):
    task_id: str
    message: str
