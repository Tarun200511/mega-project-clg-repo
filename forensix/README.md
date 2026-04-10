# ForensiX — AI Crime Scene Intelligence System
> **v2.0 · Production-Ready · Edge-Deployable**

ForensiX is a complete, modular AI-powered forensic evidence analysis platform built for field investigators. It accepts crime scene images and automatically runs four AI/CV modules in parallel, stores structured case data, and produces exportable forensic PDF reports.

---

## 🖥️ Screenshots

> Login → Dashboard → New Analysis → Case Details with AI overlays

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript, Vite, Tailwind CSS, Framer Motion |
| **Backend** | FastAPI (Python 3.10), SQLAlchemy, Pydantic v2 |
| **AI — Weapons** | YOLOv8 (Ultralytics) |
| **AI — Blood** | OpenCV HSV + morphological contours |
| **AI — Footprint** | OpenCV ORB feature matcher |
| **AI — Faces** | face_recognition (dlib) |
| **Database** | SQLite (local dev) / PostgreSQL (Docker/production) |
| **Reports** | ReportLab (PDF) |
| **Cloud (optional)** | Firebase Auth + Storage |
| **Deployment** | Docker + Docker Compose |

---

## 📂 Project Structure

```
forensix/
├── backend/
│   ├── main.py                  # FastAPI app entry
│   ├── database/config.py       # SQLAlchemy engine + session
│   ├── models/models.py         # Case, EvidenceItem, Report ORM models
│   └── routes/
│       ├── auth.py              # POST /api/auth/login
│       ├── cases.py             # Full CRUD + stats
│       ├── analyze.py           # POST /api/analyze (AI pipeline)
│       └── reports.py           # POST /api/reports/{id}/generate (PDF)
│
├── ai_modules/
│   ├── weapon_detection.py      # YOLOv8 object + weapon detection
│   ├── blood_analysis.py        # HSV mask + contour spatter classifier
│   ├── footprint_match.py       # ORB feature-based tread matching
│   └── face_recognition_module.py  # dlib face encoding + comparison
│
├── frontend/src/
│   ├── pages/
│   │   ├── Login.tsx            # Secure auth portal
│   │   ├── Dashboard.tsx        # Stats, ThreatGauge, activity feed
│   │   ├── NewAnalysis.tsx      # Upload + radar AI progress + quick results
│   │   ├── CasesArchive.tsx     # Searchable, filterable case grid
│   │   └── CaseDetails.tsx      # Full AI results + SVG overlays + PDF export
│   ├── components/
│   │   ├── Sidebar.tsx          # Navigation with system status
│   │   ├── TopBar.tsx           # Live clock + network status
│   │   ├── CaseCard.tsx         # Case summary with threat bar
│   │   ├── ThreatGauge.tsx      # SVG radial threat meter
│   │   └── EvidenceViewer.tsx   # Image + SVG bounding box overlays
│   ├── api.ts                   # Centralized Axios client
│   └── types.ts                 # TypeScript interfaces
│
├── storage/
│   ├── faces/                   # Add suspect images here (name = identity)
│   ├── treads/                  # Add tread reference images here
│   ├── temp/                    # Uploaded evidence (auto-cleaned)
│   └── reports/                 # Generated PDFs
│
├── seed_demo.py                 # Populate DB with sample cases
├── run_local.py                 # Start backend + frontend together
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start — Local (No Docker)

### 1. Backend

```bash
cd forensix

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

# Install dependencies
pip install -r backend/requirements.txt

# Start backend (SQLite auto-created)
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at → **http://localhost:8000/docs**

### 2. Seed Demo Data (Optional)

```bash
python seed_demo.py
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open → **http://localhost:5173**

Login with any credentials — click **"Continue as Demo Agent"** to bypass auth.

---

## 🐳 Docker Deployment

### Full Stack (Postgres + Backend + Frontend)

```bash
cd forensix
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## 🔐 Firebase Setup (Optional)

1. Go to [Firebase Console](https://console.firebase.google.com) → Create project
2. Enable **Authentication** → Email/Password
3. Enable **Storage**
4. Copy Web App config into `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=myproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=myproject
VITE_FIREBASE_STORAGE_BUCKET=myproject.appspot.com
```

---

## 🧠 AI Module Details

### Weapon Detection (YOLOv8)
- Uses `yolov8n.pt` (COCO) by default
- Detects: knife, baseball bat, scissors (COCO weapons)
- **Production**: replace with custom-trained weights on weapon datasets
- Returns: label, confidence, bounding box, `is_weapon` flag

### Blood Spatter (OpenCV)
- Dual-range HSV masking for fresh and dried blood
- Morphological open/close for noise removal
- 6-class classifier: Impact, Cast-off, Passive Drip, Transfer, Pooling
- Returns: pattern, spot count, average size, coverage %, top regions

### Footprint Match (ORB)
- `cv2.ORB_create(nfeatures=1500)` + `BFMatcher`
- Histogram equalization normalizes lighting
- Add reference tread images to `storage/treads/`
- Returns: match %, best match filename, all scores

### Face Recognition (dlib)
- Add suspect photos to `storage/faces/` (filename = identity)
- Lazy-loads on first use to avoid startup crash
- Returns: name, confidence %, bounding box, `matched` flag

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate agent |
| `POST` | `/api/analyze` | Run full AI pipeline on image |
| `POST` | `/api/create-case` | Save a forensic case |
| `GET` | `/api/cases` | List all cases (filterable) |
| `GET` | `/api/cases/stats` | Dashboard statistics |
| `GET` | `/api/case/{id}` | Get single case |
| `PATCH` | `/api/case/{id}` | Update status/priority |
| `DELETE` | `/api/case/{id}` | Delete a case |
| `POST` | `/api/reports/{id}/generate` | Generate PDF report |

---

## 🧪 Adding Test Data

**Weapons** — [Kaggle Weapon Detection Dataset](https://www.kaggle.com/datasets/emmarex/weapon-detection-dataset)

**Blood patterns** — [Open Access Forensic Image DB](https://www.nist.gov/forensic-science)

**Face suspects** — Place `.jpg` files in `storage/faces/` named as the identity:
```
storage/faces/John_Doe.jpg
storage/faces/Jane_Smith.jpg
```

**Footprints** — Place tread reference images in `storage/treads/`

---

## ☁️ Cloud Deployment

### Railway / Render (Backend)
```bash
# Set environment variable on platform:
DATABASE_URL=postgresql://user:pass@host/db

# Deploy from GitHub — Runtime: Python
# Start command: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

### Vercel (Frontend)
```bash
cd frontend
npm run build
# Deploy dist/ to Vercel
# Set VITE_API_URL=https://your-backend.railway.app
```

---

## 🔭 Future Scope — Edge Deployment

| Feature | Description |
|---|---|
| **3D-Printed Field Box** | NVIDIA Jetson Orin inside custom enclosure |
| **Offline AI** | All models run locally — no internet required |
| **Thermal Camera** | Integrate FLIR for body heat detection |
| **Drone Integration** | Aerial crime scene mapping via MAVLink |
| **Chain of Custody** | Blockchain hash for evidence integrity |
| **AR Overlay** | HoloLens display of detections at scene |

---

*ForensiX — Built for investigators who need answers in the field, not the lab.*
