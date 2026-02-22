from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "mysql+pymysql://root@localhost:3306/smart_recruit"

    # JWT
    JWT_SECRET_KEY: str = "change-this-to-a-long-random-secret-key-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440

    # Encryption
    ENCRYPTION_KEY: str = "change-this-to-a-32-byte-key-in-production-1234"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Upload
    UPLOAD_DIR: str = "../uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB

    # App
    APP_NAME: str = "SmartRecruit"
    DEBUG: bool = True

    # Ranking weights
    SKILL_WEIGHT: float = 0.40
    EXPERIENCE_WEIGHT: float = 0.30
    EDUCATION_WEIGHT: float = 0.20
    CERTIFICATION_WEIGHT: float = 0.10

    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
