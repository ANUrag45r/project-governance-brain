from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Project Governance Brain"
    DATABASE_URL: str = "postgresql://gbrain:gbrainpassword@localhost:5432/project_governance_brain"
    REDIS_URL: str = "redis://localhost:6379/0"
    MINIO_URL: str = "http://localhost:9000"
    MINIO_ACCESS_KEY: str = "gbrainadmin"
    MINIO_SECRET_KEY: str = "gbrainpassword123"

    class Config:
        env_file = ".env"

settings = Settings()
