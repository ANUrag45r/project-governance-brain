from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Project Governance Brain"
    DATABASE_URL: str = "postgresql://postgres:Monunag22@localhost:5432/project_governance_brain"
    REDIS_URL: str = "redis://localhost:6379/0"
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
