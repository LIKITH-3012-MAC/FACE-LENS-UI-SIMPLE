import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from mysql.connector import Error as MySQLError

from backend.config import settings
from backend.database.connection import init_connection_pool, execute_query
from backend.routers.health import router as health_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("smart_attendance")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Try to initialize MySQL pool
    logger.info("Initializing Smart Attendance System...")
    init_connection_pool()

    from backend.services.recognition_service import recognition_service
    students = execute_query("SELECT id FROM students", fetchall=True) or []
    encodings_count = recognition_service.load_registered_students()

    banner = f"""
==================================================
SMART ATTENDANCE SYSTEM - ENCODINGS LOADED
==================================================
Registered Students: {len(students)}
Encodings Loaded   : {encodings_count}
Tolerance Gate     : {recognition_service.tolerance:.2f}
Cloud MySQL        : CONNECTED
==================================================
"""
    print(banner, flush=True)

    yield
    # Shutdown
    logger.info("Shutting down Smart Attendance System...")

app = FastAPI(
    title="Smart Attendance System API",
    description="Automated Face Recognition Attendance System using FastAPI, OpenCV, and Cloud MySQL",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
allowed_origins = [
    "https://face-lens-ui-simple.vercel.app",
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
# Filter out duplicates and blanks, stripping trailing slashes for strict origin matching
origins = list(set([o.rstrip("/") for o in allowed_origins if o]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers for consistent API response format
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = " -> ".join([str(loc) for loc in error["loc"]])
        errors.append(f"{field}: {error['msg']}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": f"Validation Error: {'; '.join(errors)}",
            "data": None
        }
    )

@app.exception_handler(MySQLError)
async def mysql_exception_handler(request: Request, exc: MySQLError):
    logger.error(f"MySQL Error: {exc.msg}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": f"Database Error: {exc.msg}",
            "data": None
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An internal server error occurred.",
            "data": None
        }
    )

# Include Routers
from backend.routers import (
    health_router,
    students_router,
    attendance_router,
    camera_router,
    reports_router,
    recognition_router
)

app.include_router(health_router)
app.include_router(students_router)
app.include_router(attendance_router)
app.include_router(camera_router)
app.include_router(reports_router)
app.include_router(recognition_router)

@app.get("/")
def root():
    return {
        "success": True,
        "message": "Smart Attendance System API is running. Visit /docs for API documentation."
    }
