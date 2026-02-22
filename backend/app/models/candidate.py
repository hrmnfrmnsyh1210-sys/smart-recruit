from sqlalchemy import Column, Integer, LargeBinary, JSON, Text, String, Boolean, Date, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name_encrypted = Column(LargeBinary)
    email_encrypted = Column(LargeBinary)
    phone_encrypted = Column(LargeBinary)
    skills = Column(JSON)
    experience = Column(JSON)
    education = Column(JSON)
    certifications = Column(JSON)
    summary = Column(Text)
    source = Column(String(100), default="upload")
    consent_given = Column(Boolean, default=False)
    data_retention_until = Column(Date)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    resumes = relationship("Resume", back_populates="candidate", cascade="all, delete-orphan")
    rankings = relationship("Ranking", back_populates="candidate", cascade="all, delete-orphan")
