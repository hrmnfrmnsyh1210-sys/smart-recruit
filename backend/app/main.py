from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import engine, Base
from app.routers import auth, candidates, jobs, upload, ranking, analytics, public

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Resume Ranking System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(candidates.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(ranking.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(public.router, prefix="/api")


@app.on_event("startup")
async def startup():
    # Create tables
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}
