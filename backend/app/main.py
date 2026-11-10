
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, check_database_connection
from app.ticket import SupportTicket
from app.ticket_routes import router as ticket_router

# Load environment variables
load_dotenv()

APP_NAME = os.getenv("APP_NAME", "IntelliSupport AI")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Initialize FastAPI application
app = FastAPI(
    title=APP_NAME,
    description="AI-powered Intelligent Customer Support Platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Support Ticket API
app.include_router(ticket_router)


# Create database tables when application starts
@app.on_event("startup")
def create_database_tables():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")


# Root endpoint
@app.get("/")
def root():
    return {
        "message": "Welcome to IntelliSupport AI",
        "application": APP_NAME,
        "version": "1.0.0",
        "status": "running"
    }


# Backend health check
@app.get("/api/health")
def health_check():
    try:
        check_database_connection()

        return {
            "status": "healthy",
            "application": APP_NAME,
            "backend": "running",
            "database": "connected"
        }

    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(error)
            }
        )
