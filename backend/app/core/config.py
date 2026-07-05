import os
from typing import List
from dotenv import dotenv_values
from pydantic_settings import BaseSettings

config = dotenv_values(".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "PulseLIMS API"
    DESCRIPTION: str = "PulseLIMS API for managing laboratory information and patient data."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DOCS_URL: str = "/docs"
    REDOC_URL: str = "/redoc"
    SECRET_KEY: str = config.get('SECRET_KEY')
    ALGORITHM: str = config.get('ALGORITHM')
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"
    
settings = Settings()