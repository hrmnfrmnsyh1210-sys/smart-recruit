"""Celery tasks for async CV processing.

NOTE: This module is prepared for when Celery + Redis are configured.
Currently, CV processing is done synchronously in the upload endpoint.
To enable async processing:
1. Start Redis: redis-server
2. Start Celery worker: celery -A app.tasks.cv_processing worker --loglevel=info
"""

# from celery import Celery
# from app.config import get_settings
#
# settings = get_settings()
# celery_app = Celery("smart_recruit", broker=settings.REDIS_URL)
#
# @celery_app.task
# def process_cv(resume_id: int):
#     """Process a CV asynchronously."""
#     from app.database import SessionLocal
#     from app.models.resume import Resume
#     from app.ai.parser import extract_text
#     from app.ai.extractor import extract_entities
#
#     db = SessionLocal()
#     try:
#         resume = db.query(Resume).filter(Resume.id == resume_id).first()
#         if not resume:
#             return
#
#         resume.processing_status = "processing"
#         db.commit()
#
#         raw_text = extract_text(resume.file_path, resume.file_type)
#         parsed_data = extract_entities(raw_text)
#
#         resume.raw_text = raw_text
#         resume.parsed_data = parsed_data
#         resume.processing_status = "completed"
#         db.commit()
#     except Exception as e:
#         resume.processing_status = "failed"
#         db.commit()
#     finally:
#         db.close()
