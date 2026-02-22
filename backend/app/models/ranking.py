from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey, DECIMAL, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Ranking(Base):
    __tablename__ = "rankings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    overall_score = Column(DECIMAL(5, 2))
    skill_score = Column(DECIMAL(5, 2))
    experience_score = Column(DECIMAL(5, 2))
    education_score = Column(DECIMAL(5, 2))
    certification_score = Column(DECIMAL(5, 2))
    semantic_similarity = Column(DECIMAL(5, 4))
    rank_position = Column(Integer)
    matched_skills = Column(JSON)
    missing_skills = Column(JSON)
    explanation = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("job_id", "candidate_id", name="unique_job_candidate"),
    )

    job = relationship("Job", back_populates="rankings")
    candidate = relationship("Candidate", back_populates="rankings")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(100))
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    details = Column(JSON)
    ip_address = Column(String(45))
    created_at = Column(DateTime, server_default=func.now())
