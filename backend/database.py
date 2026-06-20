from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings
from urllib.parse import urlparse
import psycopg2

def create_database_if_not_exists():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql"):
        try:
            result = urlparse(db_url)
            username = result.username
            password = result.password
            host = result.hostname
            port = result.port or 5432
            database = result.path.lstrip('/')
            
            # Connect to default postgres database to run CREATE DATABASE
            conn = psycopg2.connect(
                dbname='postgres',
                user=username,
                password=password,
                host=host,
                port=port
            )
            conn.autocommit = True
            cur = conn.cursor()
            cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{database}'")
            exists = cur.fetchone()
            if not exists:
                cur.execute(f"CREATE DATABASE {database}")
                print(f"Database '{database}' created successfully.")
            cur.close()
            conn.close()
        except Exception as e:
            print(f"Automatic database creation skipped/failed: {e}")

# Run database check
create_database_if_not_exists()

engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
