from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class JobBase(BaseModel):
    title: str
    department: Optional[str] = None
    description: str
    requirements: Optional[str] = None
    skills_required: Optional[list[str]] = None
    min_experience_years: int = 0
    education_level: Optional[str] = None
    status: str = "draft"


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    skills_required: Optional[list[str]] = None
    min_experience_years: Optional[int] = None
    education_level: Optional[str] = None
    status: Optional[str] = None


class JobResponse(JobBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginatedJobs(BaseModel):
    items: list[JobResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
