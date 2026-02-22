from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ExperienceItem(BaseModel):
    company: str
    title: str
    duration: str
    description: Optional[str] = None


class EducationItem(BaseModel):
    institution: str
    degree: str
    year: str


class CandidateBase(BaseModel):
    skills: Optional[list[str]] = None
    experience: Optional[list[ExperienceItem]] = None
    education: Optional[list[EducationItem]] = None
    certifications: Optional[list[str]] = None
    summary: Optional[str] = None
    source: Optional[str] = "upload"


class CandidateResponse(CandidateBase):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CandidateUpdate(BaseModel):
    skills: Optional[list[str]] = None
    experience: Optional[list[ExperienceItem]] = None
    education: Optional[list[EducationItem]] = None
    certifications: Optional[list[str]] = None
    summary: Optional[str] = None


class PaginatedCandidates(BaseModel):
    items: list[CandidateResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
