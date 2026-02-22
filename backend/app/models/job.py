from sqlalchemy import Column, Integer, String, Text, JSON, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    department = Column(String(255))
    description = Column(Text, nullable=False)
    requirements = Column(Text)
    skills_required = Column(JSON)
    min_experience_years = Column(Integer, default=0)
    education_level = Column(String(100))
    status = Column(Enum("open", "closed", "draft"), default="draft")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    rankings = relationship("Ranking", back_populates="job", cascade="all, delete-orphan")
