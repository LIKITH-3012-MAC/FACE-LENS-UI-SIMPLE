# Smart Attendance System using Face Recognition

An automated, full-stack biometric attendance management system built for academic demonstration, college viva, and real-world deployment. The system identifies registered students using OpenCV computer vision, extracts facial features/embeddings, and marks attendance into a Cloud MySQL database with automatic duplicate protection and configurable cutoff timings.

---

## 1. Project Overview

Traditional attendance systems relying on manual roll calls or paper sheets are slow, prone to proxy attendance, and difficult to audit. The **Smart Attendance System** automates the entire lifecycle:
1. **Student Registration**: Academic profile enrollment with client/server validation.
2. **Face Dataset Capture**: Automated 30-shot face crop capture with varying angles and expressions.
3. **Model Training & Feature Storage**: Extracts facial texture and multi-cell spatial embeddings, saving representations in Cloud MySQL.
4. **Live Attendance Engine**: Multi-face detection and real-time recognition via camera stream with immediate duplicate debouncing.
5. **Analytics & Reports**: Visual dashboard metrics, daily/monthly summaries, and direct CSV exports.

---

## 2. Key Features

- **Real-Time Computer Vision Pipeline**: OpenCV frame capture paired with 128-dimensional deep metric face recognition (dlib ResNet / HOG) and Euclidean distance matching against Cloud MySQL face encodings.
- **Strict Duplicate Prevention**:
  - **In-Memory Debounce**: Consecutive frames within 30 seconds are cached to avoid database hammering.
  - **Application Check**: Verified against today's database logs prior to insert.
  - **Database Level**: `UNIQUE KEY (student_id, attendance_date)` guarantees zero duplicate entries per day.
- **Configurable Cutoff Timing**: Before cutoff (e.g. `09:30:00`) marks as **Present**; after cutoff marks as **Late**.
- **Unknown Face Handling**: Unregistered or low-confidence faces are labeled `"Unknown Face"` and tracked without saving unauthorized personal data.
- **Dual Camera Architecture**:
  - **Backend OpenCV Stream**: Server captures directly from webcam index and streams annotated MJPEG video.
  - **Browser Client Mode**: Client browser webcam captures frames via HTML5 `getUserMedia` and sends snapshots to FastAPI backend.
- **Full Academic Viva Coverage**: Student profile views with exact attendance percentage `(Present / Total Classes) * 100`, CSV export, and Swagger OpenAPI docs.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, JavaScript, CSS3 | Modern, responsive Single Page Application |
| **Routing** | React Router v6 | Client-side page navigation |
| **Icons** | Lucide React | Lightweight SVG icons |
| **HTTP Client** | Axios | Centralized API communication with `VITE_API_URL` |
| **Backend** | Python 3.13, FastAPI, Uvicorn | High-performance asynchronous REST API framework |
| **Computer Vision** | OpenCV (`opencv-python` / `opencv-contrib-python`), NumPy | Face detection, preprocessing, CLAHE, feature vectors |
| **Database** | Cloud MySQL (Aiven, RDS, DigitalOcean, or Local) | Relational database with Foreign Keys and Unique constraints |
| **Database Driver** | `mysql-connector-python` | Native parameterized MySQL connection pooling |
| **Config & Secrets** | `pydantic-settings`, `python-dotenv` | Type-safe environment variable management |

---

## 4. System Architecture

```text
                 FACULTY / ADMIN / STUDENT
                            │
                            ▼
         ┌─────────────────────────────────────┐
         │     React + Vite Frontend (JS)      │  (Port 5173)
         │  • React Router v6                  │
         │  • Centralized api.js Service       │
         │  • Responsive Modern Academic UI    │
         └──────────────────┬──────────────────┘
                            │ REST APIs via VITE_API_URL
                            ▼
         ┌─────────────────────────────────────┐
         │      FastAPI + Uvicorn Backend      │  (Port 8000)
         │  • Modular API Routers              │
         │  • Pydantic v2 Request Validation   │
         │  • CORS Configured Middleware       │
         │  • Standard JSON Envelope           │
         └──────────┬──────────────┬───────────┘
                    │              │
        ┌───────────┴────┐         │
        ▼                ▼         ▼
  ┌───────────┐    ┌───────────┐ ┌───────────────────────────┐
  │  OpenCV   │    │ 128-D Face│ │ Cloud MySQL Database      │
  │ Frame     │    │ Encodings │ │ (mysql-connector-python)  │
  │ Capture   │    │ ResNet/HOG│ │ • students table          │
  │ (Webcam)  │    │ Distance  │ │ • face_data table         │
  └─────┬─────┘    └─────┬─────┘ │ • attendance table        │
        │                │       │ • system_settings         │
        └────────┬───────┘       └─────────────┬─────────────┘
                 ▼                             │
         ┌──────────────────────────────┐      │
         │     Attendance Service       │◄─────┘
         │  • Duplicate Prevention      │
         │  • Cooldown Debounce Filter  │
         │  • Cutoff Time: Present/Late │
         └──────────────┬───────────────┘
                        ▼
         ┌──────────────────────────────┐
         │   Real-Time Live Feed &      │
         │   Reports / CSV Export       │
         └──────────────────────────────┘
```

---

## 5. Folder Structure

```text
face-attendace/
├── backend/
│   ├── app.py                     # FastAPI application factory, CORS, exception handlers
│   ├── config.py                  # Pydantic BaseSettings & environment variables
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Cloud MySQL secrets (never committed to git)
│   ├── .env.example               # Template environment configuration
│   ├── database/
│   │   ├── __init__.py
│   │   ├── connection.py          # MySQL connection pool & context managers
│   │   ├── schema.sql             # MySQL DDL table definitions, indexes, constraints
│   │   ├── init_db.py             # Database schema execution script
│   │   └── migrations/            # Safe migration scripts
│   ├── services/
│   │   ├── __init__.py
│   │   ├── camera_service.py      # OpenCV VideoCapture lifecycle management
│   │   ├── recognition_service.py # 128-D face encoding extraction & Euclidean distance matching
│   │   └── attendance_service.py  # Attendance rules, cutoff logic & deduplication
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── health.py              # Health check, DB ping, camera & model status
│   │   ├── students.py            # Student CRUD, face capture & model training
│   │   ├── attendance.py          # Today's attendance, marking, stats & filters
│   │   ├── camera.py              # MJPEG live feed & frame recognition endpoint
│   │   └── reports.py             # Daily, monthly, student-wise reports & CSV export
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── student.py             # Pydantic models for Student Create, Update, Response
│   │   ├── attendance.py          # Pydantic models for Attendance Mark, Log, Stats
│   │   └── common.py              # Standard ApiResponse[T] format
│   ├── dataset/                   # Local face images (dataset/<student_id>_<name>/img_xx.jpg)
│   ├── models/                    # Serialized model weights & label mappings
│   └── tests/                     # Unit tests (pytest)
├── frontend/
│   ├── index.html                 # HTML5 document template
│   ├── vite.config.js             # Vite configuration with React plugin
│   ├── package.json               # Frontend dependencies & npm scripts
│   ├── .env                       # Frontend environment variables (VITE_API_URL)
│   ├── .env.example               # Frontend env template
│   ├── src/
│   │   ├── main.jsx               # React entry point
│   │   ├── App.jsx                # Router setup, global layout & navigation
│   │   ├── index.css              # Custom responsive CSS design system
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Top navbar with live status badge & clock
│   │   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   │   ├── StatCard.jsx       # Metric cards
│   │   │   ├── Modal.jsx          # Reusable modal dialog
│   │   │   └── Toast.jsx          # User notification alerts
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # System overview: stats, cards, today's logs
│   │   │   ├── Students.jsx       # Student directory, profile view, edit, delete
│   │   │   ├── RegisterStudent.jsx# Multi-step registration & 30-frame webcam capture
│   │   │   ├── LiveAttendance.jsx # Real-time camera feed with live recognition list
│   │   │   ├── Attendance.jsx     # Master attendance log, search, filters & manual mark
│   │   │   ├── Reports.jsx        # Daily, monthly, student-wise summaries + CSV export
│   │   │   └── Settings.jsx       # Cutoff time, threshold, camera config
│   │   ├── services/
│   │   │   └── api.js             # Centralized Axios API service
│   │   └── utils/
│   │       └── formatters.js      # Date, time, percentage formatting utilities
└── README.md                      # Complete documentation
```

---

## 6. Database Schema (Cloud MySQL)

### `students` Table
```sql
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    year VARCHAR(20) NOT NULL,
    section VARCHAR(20) NOT NULL,
    email VARCHAR(150) NULL,
    face_encoding LONGTEXT NULL,
    face_dataset_count INT DEFAULT 0,
    is_trained BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_students_dept_sec (department, section),
    INDEX idx_students_roll (roll_number)
);
```

### `attendance` Table
```sql
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    attendance_date DATE NOT NULL,
    attendance_time TIME NOT NULL,
    status ENUM('Present', 'Late', 'Absent') NOT NULL DEFAULT 'Present',
    confidence_score FLOAT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_student
        FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_student_daily_attendance
        UNIQUE (student_id, attendance_date),
    INDEX idx_attendance_date (attendance_date),
    INDEX idx_attendance_status (status)
);
```

### `system_settings` Table
```sql
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    cutoff_time TIME NOT NULL DEFAULT '09:30:00',
    recognition_threshold FLOAT NOT NULL DEFAULT 65.0,
    min_dataset_images INT NOT NULL DEFAULT 25,
    auto_mark_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 7. Installation & Setup

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js v18+ & npm
- Cloud MySQL instance (e.g. [Aiven.io](https://aiven.io), AWS RDS, Clever Cloud) or local MySQL

---

### Step 1: Clone and Configure Backend

1. Navigate to `backend`:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure environment variables in `backend/.env`:
   ```env
   # Cloud MySQL Credentials
   DB_HOST=your-cloud-mysql-host.aivencloud.com
   DB_PORT=12345
   DB_NAME=smart_attendance
   DB_USER=avnadmin
   DB_PASSWORD=your_secure_password
   DB_SSL_DISABLED=false

   # Recognition & Rules
   FACE_RECOGNITION_THRESHOLD=65.0
   MIN_DATASET_IMAGES=25
   CAMERA_INDEX=0
   ATTENDANCE_CUTOFF_TIME=09:30:00

   # Server
   FRONTEND_URL=http://localhost:5173
   HOST=0.0.0.0
   PORT=8000
   ```
4. Initialize the MySQL tables:
   ```bash
   python -m backend.database.init_db
   ```
5. Start the FastAPI backend:
   ```bash
   uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
   ```
   - Swagger OpenAPI Documentation will be live at: **`http://localhost:8000/docs`**
   - Health Check: **`http://localhost:8000/api/health`**

---

### Step 2: Configure and Start Frontend

1. In a separate terminal, navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. Start Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser at: **`http://localhost:5173`**

---

## 8. Step-by-Step Viva Demonstration Workflow

1. **Open Dashboard (`/`)**:
   - Inspect the live metric cards (Total Students, Present Today, Absent Today, Attendance %).
   - Check the top navbar's **Cloud MySQL Connected** status indicator.
2. **Register a Student (`/register-student`)**:
   - Fill in: Student ID (e.g. `STD-101`), Full Name, Roll Number, Department, Year, Section.
   - Click **Next: Capture Face**.
   - Click **Connect Camera**, then click **Capture Face Dataset (30 Shots)**.
   - Tilt your head slightly left, right, smile, and look straight. The progress counter updates in real time: `17 / 25`, `25 / 25`.
   - Click **Train & Enroll Student**. The backend extracts spatial multi-cell embeddings, writes weights, and updates the database.
3. **Start Live Attendance (`/live-attendance`)**:
   - Click **Start Stream**.
   - Stand before the camera: the system draws a green bounding box labeled `✓ Your Name` with confidence score.
   - Notice the attendance record appears immediately in the right-hand feed with current timestamp.
   - Keep standing in front of the camera: **no duplicate records are created** thanks to the 30-second cooldown and `UNIQUE` database constraint.
4. **View Attendance Log (`/attendance`)**:
   - Inspect the newly recorded row with student details, exact time, and "Present" status.
   - Test filtering by date, status, or department.
5. **Generate Analytics & Reports (`/reports`)**:
   - View Daily Summary, Student-Wise Percentage report, and Monthly aggregates.
   - Click **Export to CSV** to download a spreadsheet.

---

## 9. API Reference Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Diagnostic check (API, DB connection, camera, model status) |
| `GET` | `/api/students` | List students with search, department, and section filters |
| `POST` | `/api/students` | Register student profile |
| `GET` | `/api/students/{id}` | Student attendance statistics and profile |
| `PUT` | `/api/students/{id}` | Update student details |
| `DELETE` | `/api/students/{id}` | Cascade delete student, attendance logs, and face images |
| `POST` | `/api/students/{id}/capture-frame` | Save single normalized face frame to dataset |
| `POST` | `/api/students/{id}/train` | Train face recognizer on captured dataset |
| `GET` | `/api/attendance` | Filterable attendance logs |
| `GET` | `/api/attendance/today` | Today's attendance records |
| `GET` | `/api/attendance/dashboard-stats` | Dashboard statistics summary |
| `POST` | `/api/attendance/mark` | Mark attendance with duplicate prevention |
| `GET` | `/api/camera/stream` | Multipart MJPEG stream with detection overlay |
| `POST` | `/api/camera/recognize-frame` | Recognize base64 snapshot from browser webcam |
| `GET` | `/api/reports/daily` | Daily attendance summary |
| `GET` | `/api/reports/student-wise` | Student attendance percentages |
| `GET` | `/api/reports/export-csv` | Download CSV attendance report |

---

## 10. Automated Tests

Run the backend pytest test suite:
```bash
python3 -m pytest backend/tests/ -v
```
Verifies 12 test cases covering student creation, duplicate rejection, attendance cutoff rules, debouncing, face detection, normalized feature embeddings, and health check endpoints.

---

## 11. Frequently Asked Viva Questions (Cheat Sheet)

**Q1: What algorithm is used for Face Recognition?**
> **A:** The system employs deep metric face recognition using 128-dimensional unit embeddings (dlib ResNet / HOG face localization). For each detected face, a 128-D floating-point vector is computed and compared against registered student encodings in Cloud MySQL using Euclidean distance (`face_recognition.face_distance()`). A strict tolerance gate (default `0.50`) is enforced: if the minimum Euclidean distance is $\le 0.50$, the identity is resolved to the corresponding student; otherwise, it is strictly classified as UNKNOWN.

**Q2: How is duplicate attendance prevented?**
> **A:** Duplicate prevention is implemented at three distinct layers:
> 1. *Temporal Confirmation & In-Memory Debounce*: Requires 3 consecutive positive detections, and subsequent frames within 60 seconds are cached to avoid database hammering.
> 2. *Application Layer*: A pre-insert query verifies if the student has already been recorded for today's date.
> 3. *Database Constraint*: An explicit `UNIQUE KEY uq_student_daily_attendance (student_id, attendance_date)` at the MySQL storage engine level guarantees that even concurrent requests cannot insert duplicates.

**Q3: How are face encodings stored and matched?**
> **A:** When a student enrolls their profile photo, the 128-D numerical embedding is serialized as JSON and stored directly in Cloud MySQL inside the `face_data` and `students` tables, alongside the reference photo image. On startup or reload, all registered encodings are preloaded into memory so real-time video frames can be matched in milliseconds without per-frame database reads.

---

## 12. License & Academic Integrity

This project is built for educational demonstration and academic viva submission. Biometric facial data is processed locally and stored exclusively for academic identification.
