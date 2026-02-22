from sqlalchemy import Column, Integer, String, Text, JSON, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    file_path = Column(String(500))
    file_type = Column(Enum("pdf", "docx"))
    file_size = Column(Integer)
    raw_text = Column(Text)
    parsed_data = Column(JSON)
    processing_status = Column(
        Enum("pending", "processing", "completed", "failed"),
        default="pending",
    )
    uploaded_at = Column(DateTime, server_default=func.now())

    candidate = relationship("Candidate", back_populates="resumes")
