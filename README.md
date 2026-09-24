# 🎓 Sakra-Lens

<div align="center">

![Sakra-Lens Header](https://img.shields.io/badge/Sakra--Lens-128--D%20Biometric%20Engine-10b981?style=for-the-badge&logo=face-recognition&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![OpenCV](https://img.shields.io/badge/OpenCV-4.10-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![MySQL](https://img.shields.io/badge/Cloud%20MySQL-Aiven-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Resend](https://img.shields.io/badge/Email-Resend%20API-000000?style=for-the-badge&logo=resend&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)

<br />

**Sakra-Lens** is a modern, production-grade **Smart Face Recognition Based Attendance System** that unifies deep-metric computer vision, cloud relational databases, transactional email dispatch, and browser geolocation metadata into an automated academic attendance platform.

[Features](#-main-features) • [Architecture](#-system-architecture) • [Face Recognition Pipeline](#-face-recognition-explanation) • [Attendance Modes](#-attendance-modes) • [Installation Guide](#-complete-installation-guide) • [API Documentation](#-api-documentation) • [Viva Q&A](#-viva-quick-explanation)

</div>

---

## 📑 Table of Contents

1. [Project Introduction](#-1-project-introduction)
2. [Main Features](#-2-main-features)
3. [Technology Stack](#-3-technology-stack)
4. [System Architecture](#-4-system-architecture)
5. [Face Recognition Explanation](#-5-face-recognition-explanation)
6. [Attendance Modes](#-6-attendance-modes)
7. [Attendance Data & Schema](#-7-attendance-data)
8. [Resend Email Notification Flow](#-8-resend-email-flow)
9. [Browser Geolocation (GPS) Flow](#-9-gps-flow)
10. [Project Folder Structure](#-10-project-folder-structure)
11. [Complete Installation Guide](#-11-complete-installation-guide)
12. [Frontend Installation & Setup](#-12-frontend-installation)
13. [Backend Run Commands](#-13-backend-run-commands)
14. [Environment Variables Configuration](#-14-environment-variables)
15. [Database Architecture & Setup](#-15-database-setup)
16. [Running the Face Recognition System](#-16-running-the-face-recognition-system)
17. [Face Enrollment / Student Registration](#-17-training--face-enrollment)
18. [Authentication System](#-18-authentication-documentation)
19. [Admin Interface](#-19-admin-documentation)
20. [Advanced UI & Animation System](#-20-advanced-ui--animation-system)
21. [REST API Documentation](#-21-api-documentation)
22. [Security & Protection Guarantees](#-22-security)
23. [Troubleshooting Guide](#-23-troubleshooting)
24. [Development Command Reference](#-24-development-commands)
25. [Complete End-to-End User Flow](#-25-complete-user-flow)
26. [Viva Quick Explanation](#-26-viva-quick-explanation)
27. [Screenshots & Visual Placeholders](#-27-screenshots--demo-section)
28. [Future Enhancements & Roadmap](#-28-future-enhancements)
29. [License](#-29-license)

---

## 🌟 1. Project Introduction

**Sakra-Lens** replaces error-prone paper registers and slow manual roll calls with automated facial recognition. Operating on a **128-dimensional biometric embedding model**, Sakra-Lens detects students via live camera streams, matches them against registered cloud database records within a strict Euclidean distance threshold ($\le 0.50$), and records attendance in real-time.

```text
       Face Recognition (128-D Biometrics)
                        +
           Student Profile Management
                        +
      Dual Modes (Automated & Manual Button)
                        +
           Cloud Relational MySQL Database
                        +
         Transactional Resend Notifications
                        +
         Live Browser GPS & IP Verification
                        +
          Secure Role-Based Authentication
                        +
           Dedicated Admin Audit Console
```

Sakra-Lens is engineered with a strict **one-student-to-one-reference-image** design. It completely eliminates manual CSV attendance, hardcoded text files, and outdated LBPH texture classifiers.

---

## ⚡ 2. Main Features

### 🔐 Authentication & Access Control
- **Sakra-Lens Welcome Animation**: High-tech branded initialization sequence with glowing visual feedback.
- **Account Creation**: Two-step registration requiring email verification via cryptographically secure 6-digit numeric OTPs.
- **OTP Safeguards**: 3-minute strict expiration timer, 5-attempt rate-limiting threshold, and automatic single-use token invalidation.
- **Credential Security**: Passwords hashed using industry-standard **Bcrypt** with dynamic salt rounds. Plaintext passwords are never stored or logged.
- **Session Tokens**: Stateless signed JWT authorization headers with 24-hour expiration.
- **Role-Based Access**: Clear separation of privileges between standard students/faculty and privileged administrators.

### 👤 Student Management
- **Complete Academic Profiles**: Manages Student ID, Roll Number, Full Name, Department, Academic Year, Section, and Registered Email.
- **One-Shot Reference Face Enrollment**: Captures a single, high-quality reference photo (resolution $\ge 80 \times 80$, Laplacian sharpness $\ge 12.0$).
- **Cloud Feature Storage**: Converts face crops into 128-D floating-point vectors stored directly in Cloud MySQL as structured JSON arrays alongside JPEG blobs.

### 👁️ Face Recognition Engine
- **dlib ResNet-34 Architecture**: Computes deep 128-dimensional Euclidean feature representations.
- **Deterministic Tolerance Gate**: Strict threshold gate set at **0.50**.
- **Zero Hallucination / No Guessing**: Faces with Euclidean distance $> 0.50$ are immediately classified as **Unknown Person**; the system never assigns nearest identities blindly.
- **No LBPH Legacy Code**: The final production architecture does **NOT** use LBPH (`cv2.face.LBPHFaceRecognizer`), Haar Cascades for classification, `.yml` models, or `labels.json`.

### ⏱️ Attendance Engine & Dual Modes
- **Dual Operating Modes**:
  1. **Automatic Attendance**: Instantaneous zero-touch logging upon verified face detection.
  2. **Manual "Click Attendance"**: Face is recognized first, personal details and historical metrics are previewed, and attendance is committed **only** when the user clicks a dedicated dynamic button.
- **Dynamic Identity Buttons**: Action buttons dynamically display the verified student name (e.g. `[ ✓ CLICK ATTENDANCE — LIKITH NAIDU ANUMAKONDA ]`).
- **Multi-Face Handling**: Simultaneously detects multiple faces in camera view, rendering separate identity cards and buttons for each recognized individual.
- **Triple Duplicate Protection**:
  1. *In-Memory Debouncer*: 30-second cooldown per student ID.
  2. *Temporal Verification*: Requires a multi-frame recognition streak.
  3. *Cloud Database Constraint*: MySQL `UNIQUE(student_id, attendance_date)` prevents duplicate records on the same calendar day.
- **Policy Cutoff**: Evaluates arrival against a configurable cutoff time (`09:30:00`) to classify status as **Present** or **Late**.
- **Real-Time Student Statistics**: Computes and displays `Today's Attendance`, `Total Attendance Records`, and `Last Attendance Time`.

### ✉️ Resend Email Integration
- **Instant Dispatch**: Fires confirmation emails directly to the student's registered inbox immediately after successful Cloud MySQL insertion.
- **Rich Context**: Includes Student Name, Roll Number, Department, Date, Authoritative IST Time, Status, Face Distance, Device IP, and GPS Coordinates with accuracy.
- **Non-Rollback Resilience**: If email delivery fails (e.g., mail server network timeout), the MySQL attendance record is **never** rolled back. The API safely records `"email_notification": "failed"`.

### 📍 Browser Geolocation (GPS)
- **High-Accuracy Geolocation**: Uses browser `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true`.
- **Authoritative Coordinates**: Captures real device latitude, longitude, and accuracy radius ($\pm \text{meters}$).
- **Privacy & Security**: GPS coordinates serve strictly as audit metadata and are never used to derive identity. IP addresses are never used to fake GPS coordinates.

### 🛡️ Admin Management Console
- **Dedicated Route**: Separate admin route accessible at `/admin`.
- **Stealth Navigation**: Intentionally omitted from user navigation menus; accessible only via authorized direct access.
- **Audit Logging**: Comprehensive audit trail recording user registrations, login attempts, administrative views, client IP addresses, and timestamps.
- **System Overview**: Aggregates registered users, active students, total attendance logs, and security audit logs.

---

## 🛠️ 3. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | 18.3.1 | Single-Page Application component architecture |
| **Build Tool** | Vite | 5.4.2 | Ultra-fast HMR and optimized production bundling |
| **Frontend Router** | React Router DOM | 6.26.0 | Client-side declarative routing and navigation |
| **Icons & UI** | Lucide React | 0.441.0 | Clean, lightweight feather SVG icons |
| **HTTP Client** | Axios | 1.7.7 | Promise-based client for REST API communication |
| **Backend Framework** | FastAPI | $\ge 0.115.0$ | Asynchronous RESTful API framework with OpenAPI docs |
| **ASGI Server** | Uvicorn | $\ge 0.30.0$ | High-performance asynchronous server implementation |
| **Computer Vision** | OpenCV Contrib | $\ge 4.10.0$ | Video frame capture, image decoding, Laplacian sharpness |
| **Face Recognition** | `face_recognition` | $\ge 1.3.0$ | dlib ResNet-34 128-dimensional face embedding model |
| **Database** | Cloud MySQL (Aiven) | 8.0+ | Distributed relational database with connection pooling |
| **Database Driver** | `mysql-connector-python` | $\ge 9.0.0$ | Parameterized native MySQL connection driver |
| **Email Service** | Resend Python SDK | $\ge 2.6.0$ | Transactional email delivery service |
| **Data Validation** | Pydantic v2 | $\ge 2.8.0$ | Strict request/response schema modeling and serialization |
| **Configuration** | `pydantic-settings` | $\ge 2.4.0$ | Type-safe `.env` loading and environment parsing |
| **Security & Hashing** | Bcrypt & PyJWT | Latest | Password salting/hashing and signed JWT session tokens |
| **Test Suite** | Pytest & AnyIO | $\ge 8.0.0$ | Automated unit and integration testing suite |

---

## 🏗️ 4. System Architecture

### User Flow Architecture

```text
                           SAKRA-LENS
                               │
                       3-Second Welcome
                               │
                               ▼
                        Authentication
                       /              \
                      /                \
               New Account        Existing Account
                    │                    │
                  Email                Email
                    │                    │
                   OTP                Password
                    │                    │
                 Resend                  │
                    │                    │
                 MySQL                   │
                    │                    │
               Set Password              │
                    │                    │
                    └──────────┬─────────┘
                               ▼
                         Authenticated
                               │
                               ▼
                    Computer Vision Portal
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
            Students       Attendance      Reports
                               │
                               ▼
                         Live Attendance
                        (Auto vs Manual)
                               │
                               ▼
                       OpenCV Video Feed
                               │
                               ▼
                      Face Detection (dlib)
                               │
                               ▼
                      128-D Face Encodings
                               │
                               ▼
                    Vector Euclidean Distance
                               │
                               ▼
                     Tolerance Check (<= 0.50)
                      /                  \
                    PASS                FAIL
                     │                    │
                     ▼                    ▼
             Query Cloud MySQL         UNKNOWN
             `students` Table         (Red Box)
                     │
                     ▼
          Dynamic Action Card & Button
       [ ✓ CLICK ATTENDANCE — NAME ]
                     │
                     ▼
          Store in Cloud MySQL `attendance`
                     │
                     ▼
           Dispatch Resend Confirmation
```

### Admin Security Architecture

```text
                  Direct Route: /admin
                           │
                           ▼
                  Token Verification
                           │
                           ▼
                 Extract Claims from JWT
                           │
                           ▼
                    Is Role == 'admin'?
                    /                 \
                  YES                  NO
                   │                    │
                   ▼                    ▼
             Access Granted       HTTP 403 Forbidden
                   │                    │
                   ▼                    ▼
           Admin Console UI      Log Security Audit
       (Users, Audits, Stats)     Record in MySQL
```

---

## 🔬 5. Face Recognition Explanation

### 1. Enrollment Phase (Single Reference Face)

Unlike older multi-image algorithms, Sakra-Lens registers students using **one reference portrait image**:

```text
Student Registration Form
          │
          ▼
Capture Webcam / Upload Image
          │
          ▼
Image Quality Verification
  • Exactly 1 Face Detected
  • Minimum Resolution (70x70 px)
  • Laplacian Sharpness Variance (>= 12.0)
          │
          ▼
Generate 128-D Embedding
`face_recognition.face_encodings(rgb_frame)[0]`
          │
          ▼
Save to Cloud MySQL `face_data`
  • student_id (VARCHAR UNIQUE)
  • image_data (LONGBLOB)
  • face_encoding (JSON Array of 128 Floats)
```

> [!IMPORTANT]
> **Identity Decoupling**: File basenames (e.g. `image.jpg`) are never used as identity keys. The identity source is the foreign key `student_id` linked directly to the `students` table in Cloud MySQL.

### 2. Live Recognition Phase

When camera frames arrive at 750ms intervals:

1. **Frame Downsampling**: Frames are resized to quarter-scale ($0.25\times$) and converted to RGB to maximize throughput.
2. **Face Localization**: HOG (Histogram of Oriented Gradients) locates all facial bounding boxes.
3. **Embedding Computation**: Deep neural network generates a 128-dimensional vector $V_{\text{live}} \in \mathbb{R}^{128}$ for each detected face.
4. **Vector Distance**: Computes Euclidean distances against all pre-loaded database vectors:
   $$\text{Distance} = \| V_{\text{live}} - V_{\text{db}} \|_2 = \sqrt{\sum_{i=1}^{128} (V_{\text{live}}[i] - V_{\text{db}}[i])^2}$$
5. **Tolerance Gate ($\le 0.50$)**:
   - If $\min(\text{Distance}) \le 0.50 \implies$ **Match Identified** (`student_id` resolved).
   - If $\min(\text{Distance}) > 0.50 \implies$ **UNKNOWN Person** (Tolerance failed; no record created).

> [!NOTE]
> **Why LBPH is Not Used**: Local Binary Patterns Histograms (LBPH) rely on shallow pixel texture histograms sensitive to lighting variations, head pose, and facial expressions. Sakra-Lens uses a deep ResNet metric model with 128-dimensional continuous vector embeddings.

---

## 🕹️ 6. Attendance Modes

Sakra-Lens provides two attendance modes accessible from the interface:

```text
Attendance Mode:
(●) Automatic Attendance
( ) Manual "Click Attendance" Button
```

### Mode 1: Automatic Attendance
Designed for walk-through environments:
1. Student stands in front of camera.
2. Face detected and recognized within tolerance ($\le 0.50$).
3. System checks duplicate record for today.
4. Attendance inserted into Cloud MySQL automatically.
5. Confirmation email dispatched via Resend.
6. Feed updates with success badge.

### Mode 2: Manual "Click Attendance" Button
Designed for strict supervisory verification:
1. Student stands in front of camera.
2. Face recognized and academic card displays dynamically.
3. **Database insertion is NOT executed automatically**.
4. UI renders the student's metrics and dynamic button:

```text
┌──────────────────────────────────────────────────────────┐
│  ✓ PERSON DETECTED                                       │
│  LIKITH NAIDU ANUMAKONDA                                 │
│  2473A31139 • Computer Science (A)                       │
│                                                          │
│  Today's Count: 0  |  Total: 42  |  Last: Not marked     │
│                                                          │
│  [ ✓ CLICK ATTENDANCE — LIKITH NAIDU ANUMAKONDA ]        │
└──────────────────────────────────────────────────────────┘
```

5. When supervisor clicks the button:
   - Client sends student ID, face distance, client IP, and real GPS coordinates.
   - Cloud MySQL commits the record with an authoritative `Asia/Kolkata` timestamp.
   - Attendance counts update (`Today's Count` $\rightarrow$ 1).
   - Resend sends the confirmation email.
   - Button switches to disabled: `[ ✓ Attendance Already Marked Today ]`.

---

## 📊 7. Attendance Data

Each attendance transaction stores complete audit metadata in Cloud MySQL:

```sql
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    attendance_date DATE NOT NULL,
    attendance_time TIME NOT NULL,
    status ENUM('Present', 'Late', 'Absent') NOT NULL DEFAULT 'Present',
    face_distance FLOAT NULL,
    confidence_score FLOAT NULL,
    ip_address VARCHAR(45) NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    location_accuracy FLOAT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(student_id),
    CONSTRAINT uq_student_daily_attendance UNIQUE (student_id, attendance_date)
);
```

### Calculated Real-Time Metrics:
- **`today_count`**: Number of times attendance was logged for the student today.
- **`total_attendance_count`**: Total historical records recorded for this student.
- **`last_attendance_time`**: Timestamp of the most recent attendance event.

---

## 📧 8. Resend Email Flow

After an attendance record is committed to Cloud MySQL, the FastAPI backend initiates an automated email dispatch through the **Resend API**.

```text
                Attendance Recorded in MySQL
                             │
                             ▼
                 Query Student Email Address
                             │
                             ▼
             backend/services/email_service.py
                             │
                             ▼
             Resend API (HTTPS POST /emails)
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
      Delivery Success                 Delivery Failed
            │                                 │
            ▼                                 ▼
`email_notification: 'sent'`      `email_notification: 'failed'`
            │                                 │
            ▼                                 ▼
Attendance Record Preserved       Attendance Record PRESERVED
(Terminal Log ✓)                  (Terminal Log Error Logged)
```

### Sample Notification Layout:
```text
Subject: Sakra-Lens Attendance Confirmation — LIKITH NAIDU ANUMAKONDA

Hello Likith Naidu Anumakonda,

Your attendance has been successfully recorded in Sakra-Lens.

Student Details
-------------------------
Name: Likith Naidu Anumakonda
Student ID: 2473A31139
Department: Computer Science
Section: A

Attendance Details
-------------------------
Date: 10 September 2026
Time: 10:50:18 PM IST
Status: Present

Recognition Details
-------------------------
Face Recognition: Successful
Face Distance: 0.38

Location
-------------------------
Latitude: 14.918400
Longitude: 79.991400
Accuracy: 6.5 m

Attendance Count
-------------------------
Today's Attendance: 1
Total Attendance Records: 42

Regards,
Sakra-Lens Smart Attendance System
```

---

## 📍 9. GPS Flow

```text
                      Browser Client
                            │
              navigator.geolocation.getCurrentPosition
               { enableHighAccuracy: true }
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
         Permission Granted        Permission Denied
               │                         │
               ▼                         ▼
     Real Device Coordinates        GPS Set to NULL
    (Latitude, Longitude, Acc)    (Does Not Block Recognition)
               │                         │
               └────────────┬────────────┘
                            │
                            ▼
                  FastAPI Camera Router
                            │
                            ▼
              Cloud MySQL Attendance Record
```

- **Accuracy**: Derived from device hardware (Wi-Fi triangulation, mobile cell tower, or GPS chip).
- **Security Rule**: IP addresses are **never** used to invent GPS coordinates.

---

## 📁 10. Project Folder Structure

The following tree represents the exact current codebase structure:

```text
face-attendance/
├── backend/
│   ├── database/
│   │   ├── migrations/
│   │   │   └── drop_legacy_lbph_tables.sql
│   │   ├── __init__.py
│   │   ├── connection.py              # MySQL connection pool & SQLite fallback
│   │   ├── init_db.py                 # DB initialization script
│   │   ├── repository.py              # Data access layer & queries
│   │   └── schema.sql                 # Cloud MySQL DDL definitions
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── admin.py                   # Administrative endpoints
│   │   ├── attendance.py              # Attendance logging & stats
│   │   ├── auth.py                    # User authentication & OTP endpoints
│   │   ├── camera.py                  # Live video feed & frame recognition
│   │   ├── health.py                  # System health & diagnostics
│   │   ├── recognition.py             # 128-D embedding testing
│   │   ├── reports.py                 # Daily/monthly attendance reports
│   │   └── students.py                # Student CRUD & enrollment
│   ├── schemas/
│   │   ├── attendance.py              # Pydantic attendance schemas
│   │   ├── common.py                  # Standard ApiResponse wrapper
│   │   └── student.py                 # Student profile schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── attendance_service.py      # Attendance policy & debouncer
│   │   ├── auth_service.py            # Bcrypt, JWT, and OTP handlers
│   │   ├── camera_service.py          # OpenCV webcam manager
│   │   ├── email_service.py           # Resend transactional email client
│   │   └── recognition_service.py     # 128-D vector matching service
│   ├── tests/
│   │   ├── test_attendance.py         # Attendance rules tests
│   │   ├── test_dataset_pipeline.py   # Image quality & preview tests
│   │   ├── test_email_service.py      # Resend & timezone tests
│   │   ├── test_multi_student.py      # Vector separation tests
│   │   ├── test_recognition.py        # 128-D embedding tests
│   │   └── test_students.py           # Student validation & DB tests
│   ├── utils/
│   │   ├── __init__.py
│   │   └── network.py                 # Safe client IP resolver
│   ├── app.py                         # FastAPI application factory
│   ├── config.py                      # Pydantic BaseSettings configuration
│   ├── requirements.txt               # Backend Python dependencies
│   └── .env.example                   # Backend environment template
├── frontend/
│   ├── public/                        # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Modal.jsx              # Reusable dialog modal
│   │   │   ├── Navbar.jsx             # Top application navigation bar
│   │   │   ├── Sidebar.jsx            # Portal sidebar navigation
│   │   │   ├── StatCard.jsx           # Dashboard metric cards
│   │   │   └── Toast.jsx              # Toast notification container
│   │   ├── pages/
│   │   │   ├── Attendance.jsx         # Attendance log viewer & filters
│   │   │   ├── Dashboard.jsx          # Metric cards & system status
│   │   │   ├── LiveAttendance.jsx     # Dual-mode live camera recognition
│   │   │   ├── RegisterStudent.jsx    # Student registration & photo capture
│   │   │   ├── Reports.jsx            # Monthly & student-wise reports
│   │   │   ├── Settings.jsx           # Cutoff & recognition threshold config
│   │   │   └── Students.jsx           # Student directory & management
│   │   ├── services/
│   │   │   └── api.js                 # Centralized Axios API services
│   │   ├── utils/
│   │   │   └── formatters.js          # Time, date, and badge formatters
│   │   ├── App.jsx                    # React Router configuration
│   │   ├── index.css                  # Global styles & design system
│   │   └── main.jsx                   # React application entry point
│   ├── index.html                     # HTML5 template
│   ├── package.json                   # Frontend dependencies & scripts
│   ├── vite.config.js                 # Vite configuration
│   └── .env.example                   # Frontend environment template
├── .gitignore                         # Git exclusion rules
├── pytest.ini                         # Pytest configuration
└── README.md                          # Project documentation
```

---

## 🚀 11. Complete Installation Guide

### Prerequisites
- **Python**: Version 3.10, 3.11, 3.12, or 3.13
- **Node.js**: Version 18.x or 20.x LTS with `npm`
- **C++ Compiler**: Xcode Command Line Tools (Mac) or Visual Studio C++ Build Tools (Windows) for `dlib`
- **CMake**: Required for building dlib:
  ```bash
  # macOS
  brew install cmake

  # Ubuntu/Debian
  sudo apt-get install cmake build-essential
  ```

### 1. Obtain the Source Code
```bash
git clone https://github.com/LIKITH-3012-MAC/sakra-face-detection-project.git
cd sakra-face-detection-project
```
*(If using a downloaded ZIP archive, extract the contents and open the folder in VS Code).*

### 2. Python Virtual Environment Setup

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows (Command Prompt):**
```cmd
python -m venv venv
venv\Scripts\activate
```

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Upgrade Pip & Install Dependencies
```bash
python -m pip install --upgrade pip setuptools wheel
pip install -r backend/requirements.txt
```

### 4. Verify Computer Vision & Recognition Packages
```bash
python -c "import cv2; print('OpenCV Version:', cv2.__version__)"
python -c "import face_recognition; print('face_recognition Engine: OK')"
```

---

## 💻 12. Frontend Installation

Navigate to the `frontend/` directory and install all node packages:

```bash
cd frontend
npm install
```

### Available NPM Scripts:
```bash
# Start local development server with Hot Module Replacement
npm run dev

# Compile optimized static bundle for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🖥️ 13. Backend Run Commands

Run the full system using **two separate terminal windows**:

### Terminal 1: FastAPI Backend Server
```bash
# Ensure virtual environment is active
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Start Uvicorn ASGI server on port 8000
python3 -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
```
- **Backend URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Alternative ReDoc**: `http://localhost:8000/redoc`

### Terminal 2: React Frontend Dev Server
```bash
cd frontend
npm run dev
```
- **Frontend Portal**: `http://localhost:5173`

---

## 🔑 14. Environment Variables

Create `.env` files in both `backend/` and `frontend/` following the provided templates:

### Backend Configuration (`backend/.env`)
```env
# Cloud MySQL Database Credentials
DB_HOST=your-cloud-mysql-host.com
DB_PORT=13350
DB_NAME=smart_attendance
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_SSL_DISABLED=false

# Computer Vision & Recognition Policy
FACE_RECOGNITION_THRESHOLD=65.0
CAMERA_INDEX=0
ATTENDANCE_CUTOFF_TIME=09:30:00

# Server & CORS
FRONTEND_URL=http://localhost:5173
HOST=0.0.0.0
PORT=8000

# Resend Transactional Email API
RESEND_API_KEY=re_your_actual_resend_key_here
RESEND_FROM_EMAIL=Sakra-Lens <noreply@yourdomain.com>
TIMEZONE=Asia/Kolkata
```

### Frontend Configuration (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
```

> [!CAUTION]
> Never commit `.env` files containing live credentials to Git. The project `.gitignore` automatically excludes all `.env` files.

---

## 🗄️ 15. Database Architecture & Setup

Sakra-Lens connects to **Cloud MySQL** (e.g. Aiven, AWS RDS, DigitalOcean, or local MySQL 8.0).

Initialize the schema using `backend/database/schema.sql`:

```bash
mysql -h your-host -P 13350 -u your-user -p smart_attendance < backend/database/schema.sql
```

### Primary Database Tables:

| Table | Purpose | Key Columns |
| :--- | :--- | :--- |
| `students` | Academic student directory | `student_id` (PK), `roll_number`, `name`, `department`, `section`, `email` |
| `face_data` | Reference biometric facial vectors | `student_id` (FK UNIQUE), `image_data` (LONGBLOB), `face_encoding` (JSON) |
| `attendance` | Permanent attendance logs | `student_id`, `attendance_date`, `attendance_time`, `status`, `latitude`, `longitude`, `location_accuracy`, `ip_address` |
| `system_settings` | System-wide thresholds | `cutoff_time`, `recognition_threshold`, `auto_mark_enabled` |
| `users` | Authenticated system accounts | `email` (UNIQUE), `password_hash`, `full_name`, `role`, `is_verified` |
| `otp_verifications` | Temporary OTP audit records | `email`, `otp_hash`, `purpose`, `attempts`, `is_used`, `expires_at` |
| `audit_logs` | Security & admin activity logs | `user_email`, `action`, `details`, `ip_address`, `created_at` |

---

## 📷 16. Running the Face Recognition System

1. Start both backend and frontend servers.
2. Open your browser to `http://localhost:5173`.
3. Go to **Register Student**:
   - Fill in Student ID, Roll Number, Name, Department, Section, and Email.
   - Click **Capture from Webcam** or upload a clear front-facing portrait.
   - Click **Complete Registration & Save**. The system computes the 128-D vector and stores it in Cloud MySQL.
4. Navigate to **Live Attendance**:
   - Allow browser **Camera** permissions.
   - Allow browser **Location** permissions.
   - Select your attendance mode: **Automatic** or **Manual**.
   - Position your face in front of the camera.
5. **Observation**:
   - A green bounding box tracks your face displaying `✓ Name (Dist: 0.38 / Tol: 0.50)`.
   - The **Detected Person** card renders with your full academic profile and real-time attendance statistics.
   - If in **Manual Mode**, click `[ ✓ CLICK ATTENDANCE — YOUR NAME ]`.
   - The system records attendance, updates the feed, and sends a Resend confirmation email.
6. **Testing Unknown Faces**:
   - Have an un-enrolled person step in front of the camera.
   - A red bounding box displays `UNKNOWN (Dist: 0.68)`.
   - The status changes to `⚠️ Unknown Person Detected`. No attendance is recorded, and no action button is provided.

---

## 📸 17. Training / Face Enrollment

Sakra-Lens uses a modern **one-shot enrollment** architecture instead of iterative model training:

```text
Enroll Student → Capture 1 Reference Image → Validate Face Quality → Generate 128-D Vector → Commit to MySQL
```

### Reference Face Quality Checklist:
- **Subject Count**: Exactly 1 person visible in frame.
- **Pose**: Direct frontal gaze with neutral expression.
- **Lighting**: Even, diffused lighting without harsh backlighting or heavy shadows.
- **Obstructions**: No sunglasses, masks, or hands covering facial landmarks.
- **Resolution**: Face crop must be at least $70 \times 70$ pixels.
- **Sharpness**: Laplacian variance must exceed $12.0$ to filter out motion blur.

---

## 🔒 18. Authentication Documentation

### Registration with OTP Verification:
1. User provides Full Name and Email on registration page.
2. Backend generates a 6-digit numeric OTP with a 3-minute expiration.
3. Resend dispatches the OTP to the user's inbox.
4. User enters the OTP along with their chosen password.
5. Backend verifies the OTP hash and attempt count ($\le 5$), hashes the password with **Bcrypt**, marks the OTP as used, and creates the account.

### Login Flow:
1. User enters Email and Password.
2. Backend queries the `users` table and validates the password hash via `bcrypt.checkpw()`.
3. On match, a signed JWT session token containing user identity and role (`user` or `admin`) is returned.

---

## 🛡️ 19. Admin Documentation

- **Admin Access Route**: Accessible directly at `/admin`.
- **Navigation Security**: The link is intentionally hidden from the standard navigation bar.
- **Authorization**: Protected by the backend dependency `require_admin`. Every request must include an `Authorization: Bearer <token>` header where `role == 'admin'`. Unauthorized requests receive an immediate `HTTP 403 Forbidden`.
- **Admin Capabilities**:
  - View overall system stats (Registered Users, Enrolled Students, Total Attendance).
  - Inspect detailed security audit logs (Logins, Failed attempts, OTP requests).
  - Manage user verification statuses and roles.

---

## ✨ 20. Advanced UI & Animation System

### [IMPLEMENTED] Current Features:
- **Visual Face Bounding Boxes**: Real-time canvas overlay rendering green boxes with distance badges for recognized faces and orange/red boxes for unknown persons.
- **Pulsing Active Indicators**: Glowing status indicators showing live camera streaming states.
- **Dynamic GPS Chip**: Color-coded badges indicating real-time GPS state:
  - 🟢 `GPS: 14.9184, 79.9914 (±6m)` — Location actively acquired.
  - 🔴 `GPS: Denied (Please allow location)` — Location permissions blocked.
- **Dynamic Attendance Buttons**: Interactive button text that updates automatically to the recognized student's name: `[ ✓ CLICK ATTENDANCE — <NAME> ]`.
- **Smooth Feed Transitions**: Instant attendance feed animations when records are logged.
- **Interactive Modals & Toasts**: Floating feedback alerts with auto-dismiss timers for success, warning, and error states.

### [PLANNED / FUTURE] Roadmap:
- Multi-camera split-screen stream visualization.
- Canvas-based biometric landmark mesh overlay (68 facial landmark points).
- Audio speech confirmation feedback upon attendance logging.

---

## 📡 21. REST API Documentation

### Health & System
| Method | Endpoint | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | System health check (DB connection, camera, model tolerance) | None |

### Authentication (`/api/auth`)
| Method | Endpoint | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register-request-otp` | Request 6-digit OTP for new account | None |
| `POST` | `/api/auth/verify-otp-register` | Verify OTP and complete account creation | None |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT session token | None |
| `POST` | `/api/auth/admin/login` | Authenticate administrator with role validation | None |
| `GET` | `/api/auth/me` | Retrieve profile for current session token | Bearer Token |

### Students (`/api/students`)
| Method | Endpoint | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students` | List registered students with optional search/filter | None |
| `GET` | `/api/students/{id}` | Get detailed profile of a student | None |
| `POST` | `/api/students` | Register a new student profile | None |
| `POST` | `/api/students/{id}/register-face` | Enroll reference face photo and generate 128-D vector | None |
| `DELETE` | `/api/students/{id}` | Delete student profile and associated biometric data | None |

### Attendance (`/api/attendance`)
| Method | Endpoint | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/attendance` | Query attendance logs with date/department/status filters | None |
| `GET` | `/api/attendance/today` | Fetch all attendance records logged for today | None |
| `GET` | `/api/attendance/dashboard-stats`| Aggregate metric stats (Present, Late, Absent, Attendance %) | None |
| `GET` | `/api/attendance/stats/{id}` | Get attendance metrics for a specific student (`today_count`, etc.) | None |
| `POST` | `/api/attendance/mark` | Manually mark attendance with GPS accuracy, IP, and Resend email | None |

### Camera & Recognition (`/api/camera`)
| Method | Endpoint | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/camera/recognize-frame` | Process snapshot frame; returns detections and auto-marks if enabled | None |
| `POST` | `/api/camera/validate-preview` | Real-time face quality validation for registration | None |
| `GET` | `/api/camera/stream` | MJPEG video stream from server OpenCV camera | None |
| `GET` | `/api/camera/live-status` | Live detection events and unknown face count | None |

### Admin (`/api/admin`)
| Method | Endpoint | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/overview` | High-level system overview for administrators | Admin Token |
| `GET` | `/api/admin/audit-logs` | Comprehensive security audit log history | Admin Token |
| `GET` | `/api/admin/users` | List all registered user accounts | Admin Token |

---

## 🛡️ 22. Security & Protection Guarantees

- **No Plaintext Passwords**: All user passwords are encrypted using **Bcrypt** with random salts prior to database insertion.
- **No Plaintext OTPs**: OTP codes are salted with user emails and hashed using **SHA-256** before storage.
- **SQL Injection Prevention**: 100% of database queries use parameterized SQL placeholders (`%s`) managed by `mysql-connector-python`.
- **Duplicate Prevention**: MySQL table-level `UNIQUE(student_id, attendance_date)` constraint guarantees impossible duplicate entries per day.
- **Secret Isolation**: All credentials, database passwords, and API keys are strictly confined to `.env` files excluded by Git.
- **Non-Rollback Attendance**: Resend email delivery failures never rollback successfully inserted MySQL attendance records.

---

## 🔧 23. Troubleshooting Guide

### 1. Python & Pip Issues
```bash
# Check installed version
python3 --version  # Must be 3.10 or newer

# Upgrade pip
python3 -m pip install --upgrade pip setuptools wheel
```

### 2. `face_recognition` / `dlib` Installation Errors
`dlib` requires CMake and a C++ compiler to build:
```bash
# macOS
brew install cmake
pip install dlib face_recognition

# Linux (Ubuntu/Debian)
sudo apt-get install build-essential cmake libopenblas-dev liblapack-dev
pip install dlib face_recognition
```

### 3. Camera Stream Not Starting
- **Browser Camera**: Verify browser camera permissions in site settings (`chrome://settings/content/camera`). Ensure no other application (Zoom, Teams, Photo Booth) is using the webcam.
- **Server Stream**: If running locally on macOS, camera access from Python requires granting Camera permissions to Terminal/VS Code in **System Settings $\rightarrow$ Privacy & Security $\rightarrow$ Camera**.

### 4. GPS Location Unavailable
- Ensure you access the application via `http://localhost:5173` or `http://127.0.0.1:5173`. Modern browsers restrict geolocation APIs on non-secure HTTP origins unless accessing `localhost`.
- Verify browser site location permissions are granted.

### 5. Cloud MySQL Connection Failures
- Ensure your Aiven/Cloud MySQL host, port, username, and password are correctly set in `backend/.env`.
- Check whether your Cloud MySQL database requires SSL. If not using SSL, set `DB_SSL_DISABLED=true`.

---

## ⌨️ 24. Development Commands

### Git Operations
```bash
# Check status
git status

# Stage changes
git add .

# Commit changes
git commit -m "feat: your descriptive commit message"

# Push to repository
git push origin main
```

### Backend & Testing
```bash
# Run all automated tests
python3 -m pytest backend/tests/ -v

# Run specific test suite
python3 -m pytest backend/tests/test_email_service.py -v

# Start backend server
python3 -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
# Start frontend development server
npm --prefix frontend run dev

# Build production bundle
npm --prefix frontend run build
```

---

## 🔄 25. Complete End-to-End User Flow

```text
                     OPEN SAKRA-LENS
                           │
                           ▼
                    3-SECOND WELCOME
                           │
                           ▼
                     AUTHENTICATION
               (Login or Create Account)
                           │
                           ▼
                   ACADEMIC PORTAL
                           │
                           ▼
                   REGISTER STUDENT
                (Details + Single Face)
                           │
                           ▼
                   128-D EMBEDDING
                           │
                           ▼
               STORED IN CLOUD MYSQL
                           │
                           ▼
                    LIVE ATTENDANCE
                           │
                           ▼
                 SELECT ATTENDANCE MODE
                 (Automatic or Manual)
                           │
                           ▼
                     FACE DETECTED
                           │
                           ▼
                    FACE RECOGNITION
               (Distance <= Tolerance 0.50)
                           │
                           ▼
                 STUDENT IDENTIFICATION
                           │
                           ▼
            ATTENDANCE COMMITTED TO MYSQL
            (Date + IST Time + GPS + IP)
                           │
                           ▼
                RESEND EMAIL CONFIRMATION
                           │
                           ▼
               UI ATTENDANCE FEED UPDATED
```

---

## 🎓 26. Viva Quick Explanation

Quick answers for academic vivas, project presentations, and technical evaluations:

- **What is Sakra-Lens?**  
  An automated, biometric face recognition attendance management system combining a React frontend, FastAPI backend, Cloud MySQL database, Resend email notifications, and live GPS metadata.
- **Why FastAPI over Django/Flask?**  
  FastAPI provides asynchronous concurrency, automatic OpenAPI documentation, high performance with Uvicorn, and native data validation via Pydantic v2.
- **Why React + Vite?**  
  React provides a responsive component-driven user experience, while Vite offers sub-second build times and instant Hot Module Replacement (HMR).
- **Why OpenCV?**  
  OpenCV is the industry standard for real-time computer vision, handling video stream capture, color space conversion, and image quality analysis (Laplacian sharpness).
- **Why `face_recognition` instead of LBPH?**  
  LBPH uses shallow pixel texture patterns that degrade significantly under lighting and angle variations. `face_recognition` utilizes dlib's deep ResNet-34 model to generate robust 128-dimensional biometric embeddings.
- **What is a 128-D Face Encoding?**  
  A vector of 128 normalized floating-point numbers representing unique geometric and metric spatial relationships of facial landmarks.
- **What is Face Distance and Tolerance?**  
  Face distance is the Euclidean distance ($\ell_2$-norm) between two 128-D vectors. Tolerance is the threshold cutoff ($\le 0.50$). If the distance between the live face and the database vector is $\le 0.50$, a match is confirmed; otherwise, it is classified as Unknown.
- **Why Cloud MySQL?**  
  Provides structured relational storage with foreign key constraints, indexing for fast queries, and strict unique keys (`student_id`, `attendance_date`) to prevent duplicate attendance.
- **Why Resend?**  
  A modern, developer-first transactional email API providing fast delivery and clean HTML formatting for automated attendance notifications.
- **How is Duplicate Attendance Prevented?**  
  Through three layers: an in-memory 30-second cooldown cache, an application-level query check, and a database-level `UNIQUE(student_id, attendance_date)` constraint.
- **How is GPS Used?**  
  Captured via the browser's Geolocation API (`navigator.geolocation`) to provide attendance audit metadata (latitude, longitude, accuracy). It is never used to derive student identity.

---

## 📸 27. Screenshots & Demo Section

### Welcome Screen
<!-- Add Welcome Animation Screenshot Here -->

### Authentication & OTP Verification
<!-- Add Login and OTP Screen Screenshot Here -->

### Main Dashboard & Analytics
<!-- Add Dashboard Screen Screenshot Here -->

### Student Registration & Enrollment
<!-- Add Registration Page Screenshot Here -->

### Live Automated Attendance (Dual Mode)
<!-- Add Live Attendance Camera Feed & Dynamic Button Screenshot Here -->

### Dedicated Admin Console
<!-- Add Admin Overview & Audit Log Screenshot Here -->

---

## 🔮 28. Future Enhancements

The following capabilities are identified as **[PLANNED / FUTURE]** roadmap items:
- **Campus Geofencing**: Restricting attendance confirmation to verified campus boundaries using GPS polygon bounding algorithms.
- **Liveness Detection**: Anti-spoofing algorithms detecting eye blinks and micro-head movements to prevent photo/video replay attacks.
- **Automated PDF Reports**: Automated end-of-month attendance percentage report generation and email distribution to department heads.
- **Multi-Camera Support**: Centralized RTSP camera aggregation across multiple classrooms simultaneously.
- **Mobile Application**: Native iOS and Android companion apps built with React Native.

---

## 📄 29. License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by <strong>Likith Naidu</strong> • Sakra-Lens Smart Attendance System</sub>
</div>
# FACE-LENS-UI-SIMPLE
# FACE-LENS-UI-SIMPLE
