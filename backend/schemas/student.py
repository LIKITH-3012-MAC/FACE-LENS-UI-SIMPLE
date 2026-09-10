from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict

class StudentBase(BaseModel):
    student_id: str = Field(..., min_length=2, max_length=50, description="Unique alphanumeric student ID")
    name: str = Field(..., min_length=2, max_length=100, description="Full name of student")
    roll_number: str = Field(..., min_length=2, max_length=50, description="Official college roll number")
    department: str = Field(..., min_length=2, max_length=100, description="Academic department")
    year: str = Field(..., min_length=1, max_length=20, description="Current year of study")
    section: str = Field(..., min_length=1, max_length=20, description="Class section")
    email: Optional[str] = Field(None, max_length=150, description="Student email address")

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    roll_number: Optional[str] = Field(None, min_length=2, max_length=50)
    department: Optional[str] = Field(None, min_length=2, max_length=100)
    year: Optional[str] = Field(None, min_length=1, max_length=20)
    section: Optional[str] = Field(None, min_length=1, max_length=20)
    email: Optional[str] = Field(None, max_length=150)

class StudentResponse(StudentBase):
    id: int
    face_dataset_count: int = 0
    is_trained: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class StudentProfileStats(BaseModel):
    total_classes: int = 0
    present_count: int = 0
    absent_count: int = 0
    late_count: int = 0
    attendance_percentage: float = 0.0

class StudentDetailResponse(StudentResponse):
    stats: Optional[StudentProfileStats] = None
