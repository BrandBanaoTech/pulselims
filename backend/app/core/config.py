import os
from typing import List
from dotenv import dotenv_values
from pydantic_settings import BaseSettings, SettingsConfigDict

config = dotenv_values(".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "PulseLIMS Advanced Cloud API"
    DESCRIPTION: str = "PulseLIMS API for managing laboratory information and patient data."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DOCS_URL: str = "/docs"
    REDOC_URL: str = "/redoc"
    DEBUG: bool = True
    SECRET_KEY: str = config.get('SECRET_KEY')
    ALGORITHM: str = config.get('ALGORITHM')
    ORIGINS: str = config.get('ORIGINS')
    ACCESS_TOKEN_EXPIRE_MINUTES: int = config.get('ACCESS_TOKEN_EXPIRE_MINUTES')
    DATABASE_URL: str = config.get('DATABASE_URL')

    model_config = SettingsConfigDict(env_file=".env", case_sensitive = True, extra="ignore")

    @property
    def get_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ORIGINS.split(",")]

    # class Config:
    #     case_sensitive = True
    #     env_file = ".env"
    
settings = Settings()