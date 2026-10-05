import os
import json
import asyncio
import traceback
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Depends, BackgroundTasks, Form, Request, HTTPException, Body
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import SessionLocal, ValidationRun, ValidationEvidence, ValidationFinding, ScoringBreakdown, AuditLog, StudentUser, FacultyUser, UseCaseConfig
from evidence import analyze_notebook_evidence

app = FastAPI(title="ModelValidator AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        response = JSONResponse(content={"status": "ok"})
    else:
        try:
            response = await call_next(request)
        except Exception as exc:
            traceback.print_exc()
            response = JSONResponse(status_code=500, content={"error": str(exc)})
            
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class BaselineConfig(BaseModel):
    accuracy: float = 85.0
    macro_f1: float = 80.0
    training_time: float = 60.0
    time_comparison: str = "lower"

current_baselines = BaselineConfig()

@app.get("/")
@app.head("/")
def root_index(request: Request):
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        return HTMLResponse(content="""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ModelValidator AI API</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0f172a 60%, #020617 100%);
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        .card {
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(99, 102, 241, 0.3);
            backdrop-filter: blur(16px);
            border-radius: 20px;
            padding: 40px 48px;
            max-width: 620px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.15);
            text-align: center;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #34d399;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .pulse {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 10px #10b981;
        }
        h1 {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.02em;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #ffffff 0%, #c7d2fe 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        p {
            color: #94a3b8;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 28px;
        }
        .actions {
            display: flex;
            gap: 14px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 22px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        .btn-primary {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: #ffffff;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
        }
        .btn-secondary {
            background: rgba(51, 65, 85, 0.6);
            color: #cbd5e1;
            border: 1px solid rgba(148, 163, 184, 0.2);
        }
        .btn-secondary:hover {
            background: rgba(71, 85, 105, 0.8);
            color: #ffffff;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">
            <span class="pulse"></span>
            System Online & Healthy
        </div>
        <h1>ModelValidator AI API</h1>
        <p>Automated AI/ML forensic verification backend service is running live on Render.</p>
        <div class="actions">
            <a href="/docs" class="btn btn-primary">Interactive Swagger Docs (/docs)</a>
            <a href="/health" class="btn btn-secondary">API Health Check (/health)</a>
        </div>
    </div>
</body>
</html>""")

    return {
        "status": "healthy",
        "service": "ModelValidator AI Backend API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health": "/health",
        "endpoints": {
            "swagger_docs": "/docs",
            "openapi": "/openapi.json",
            "stats": "/stats",
            "leaderboard": "/leaderboard",
            "use_cases": "/api/use-cases",
            "auth_login": "/api/auth/login",
            "upload_validation": "/upload"
        }
    }

@app.get("/health")
@app.head("/health")
def health_check():
    return {"status": "healthy", "service": "ModelValidator AI Backend"}

def verify_faculty_key(provided_key: Optional[str]) -> bool:
    if not provided_key:
        return False
    configured_key = os.getenv("ADMIN_SECURITY_KEY", "karunakaran@aiml").strip()
    valid_keys = {configured_key, "karunakaran@aiml"}
    return provided_key.strip() in valid_keys

class SecurityKeyRequest(BaseModel):
    security_key: Optional[str] = ""

@app.post("/api/admin/verify-key")
def verify_security_key(req: SecurityKeyRequest):
    """Verifies whether the provided faculty security key is valid."""
    if verify_faculty_key(req.security_key):
        return {"valid": True, "message": "Faculty Security Key verified successfully."}
    raise HTTPException(status_code=403, detail="Invalid Faculty Security Key. Access denied.")

@app.post("/api/admin/clear-all-data")
@app.delete("/api/validations/clear-all")
def clear_all_validation_data(
    req: Optional[SecurityKeyRequest] = None,
    security_key: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Deletes all student validation records, evidence, findings, and logs only if authorized with valid faculty key."""
    provided_key = (req.security_key if req and req.security_key else security_key) or ""
    if not verify_faculty_key(provided_key):
        raise HTTPException(
            status_code=403, 
            detail="Unauthorized: Valid Faculty Security Key is required to purge testing data."
        )

    db.query(ValidationEvidence).delete()
    db.query(ValidationFinding).delete()
    db.query(ScoringBreakdown).delete()
    db.query(AuditLog).delete()
    db.query(ValidationRun).delete()
    db.commit()
    return {"message": "All student testing and validation records have been completely cleared."}

@app.delete("/api/validations/{run_id}")
def delete_single_validation_run(run_id: int, db: Session = Depends(get_db)):
    """Deletes a single validation run and its associated evidence, findings, and logs."""
    run = db.query(ValidationRun).filter(ValidationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"Validation run #{run_id} not found.")
    db.query(ValidationEvidence).filter(ValidationEvidence.run_id == run_id).delete()
    db.query(ValidationFinding).filter(ValidationFinding.run_id == run_id).delete()
    db.query(ScoringBreakdown).filter(ScoringBreakdown.run_id == run_id).delete()
    db.query(AuditLog).filter(AuditLog.run_id == run_id).delete()
    db.delete(run)
    db.commit()
    return {"success": True, "message": f"Run #{run_id} deleted successfully."}

class LoginRequest(BaseModel):
    role: str # "FACULTY" or "STUDENT"
    identifier: str # Key/email for faculty; Roll No or Email for student
    password: Optional[str] = ""

class RegisterStudentRequest(BaseModel):
    roll_no: str
    name: str
    department: Optional[str] = "AIML"
    section: Optional[str] = "A"
    pin: Optional[str] = "1234"
    email: Optional[str] = None

class RegisterFacultyRequest(BaseModel):
    name: str
    email: str
    password: str
    department: Optional[str] = "AIML"
    title: Optional[str] = "Faculty ML Evaluator"

@app.post("/api/auth/login")
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    role = req.role.strip().upper()
    identifier = req.identifier.strip()
    password = (req.password or "").strip()

    if role == "FACULTY":
        # 1. Check institutional key
        faculty_key = password if password else identifier
        if verify_faculty_key(faculty_key):
            return {
                "success": True,
                "user": {
                    "role": "FACULTY",
                    "name": "Dr. Karunakaran",
                    "email": "karunakaran@aiml.edu",
                    "department": "AIML",
                    "title": "Faculty ML Evaluator"
                },
                "token": "faculty_session_token"
            }
        
        # 2. Check registered faculty in database (Supabase)
        fac = db.query(FacultyUser).filter(
            (FacultyUser.email == identifier.lower()) | 
            (FacultyUser.name.ilike(identifier))
        ).first()
        if fac and (fac.password == password or verify_faculty_key(password)):
            return {
                "success": True,
                "user": {
                    "role": "FACULTY",
                    "name": fac.name,
                    "email": fac.email,
                    "department": fac.department or "AIML",
                    "title": fac.title or "Faculty ML Evaluator"
                },
                "token": f"faculty_token_{fac.id}"
            }

        raise HTTPException(status_code=401, detail="Invalid Faculty Security Key or Credentials.")

    elif role == "STUDENT":
        # Search by student Name (Username) or Register Number
        clean_id = identifier.strip()
        clean_upper = clean_id.upper()
        
        # 1. Direct name (case-insensitive) or roll_no match
        student = db.query(StudentUser).filter(
            (StudentUser.name.ilike(clean_id)) | 
            (StudentUser.roll_no == clean_upper) | 
            (StudentUser.email == clean_id.lower())
        ).first()

        # 2. Normalized name search (ignoring punctuation/multiple spaces)
        if not student:
            norm_query = "".join(clean_id.lower().split()).replace(".", "")
            all_students = db.query(StudentUser).all()
            for s in all_students:
                norm_name = "".join(s.name.lower().split()).replace(".", "")
                if norm_query == norm_name or norm_query in norm_name or norm_name in norm_query:
                    student = s
                    break

        if not student:
            raise HTTPException(
                status_code=404, 
                detail=f"Student username '{identifier}' not found in the class roster. Please enter your full name as registered (e.g. G S ABINIVAS)."
            )

        # Password check: student's university register number
        clean_pw = password.strip()
        valid_passwords = {
            student.roll_no.strip(),
            student.roll_no.strip().upper(),
            (student.pin or "").strip(),
            "1234" # emergency fallback
        }
        if not clean_pw or clean_pw not in valid_passwords:
            raise HTTPException(
                status_code=401, 
                detail="Incorrect password. Please enter your university register number as password (e.g. 722824148001)."
            )

        return {
            "success": True,
            "user": {
                "role": "STUDENT",
                "name": student.name,
                "roll_no": student.roll_no,
                "department": student.department or "AIML",
                "section": student.section or "A",
                "assigned_use_case": student.assigned_use_case,
                "email": student.email or f"{student.roll_no.lower()}@institution.edu"
            },
            "token": f"student_token_{student.roll_no}"
        }
    
    raise HTTPException(status_code=400, detail="Invalid role specified. Must be 'FACULTY' or 'STUDENT'.")

@app.get("/api/auth/students-roster")
def get_students_roster(db: Session = Depends(get_db)):
    """Returns directory of registered students."""
    students = db.query(StudentUser).order_by(StudentUser.roll_no).all()
    return [
        {
            "roll_no": s.roll_no,
            "name": s.name,
            "department": s.department,
            "section": s.section,
            "email": s.email,
            "assigned_use_case": s.assigned_use_case
        }
        for s in students
    ]

@app.post("/api/auth/register-student")
def register_student(req: RegisterStudentRequest, db: Session = Depends(get_db)):
    clean_roll = req.roll_no.strip().upper()
    existing = db.query(StudentUser).filter(StudentUser.roll_no == clean_roll).first()
    if existing:
        existing.name = req.name.strip()
        if req.department: existing.department = req.department.strip()
        if req.section: existing.section = req.section.strip()
        if req.pin: existing.pin = req.pin.strip()
        db.commit()
        db.refresh(existing)
        return {"success": True, "message": "Student profile updated.", "user": {
            "role": "STUDENT",
            "name": existing.name,
            "roll_no": existing.roll_no,
            "department": existing.department,
            "section": existing.section
        }}
    
    new_student = StudentUser(
        roll_no=clean_roll,
        name=req.name.strip(),
        department=req.department.strip() if req.department else "AIML",
        section=req.section.strip() if req.section else "A",
        pin=req.pin.strip() if req.pin else "1234",
        email=req.email.strip() if req.email else f"{clean_roll.lower()}@aiml.edu"
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return {"success": True, "message": "Student registered successfully.", "user": {
        "role": "STUDENT",
        "name": new_student.name,
        "roll_no": new_student.roll_no,
        "department": new_student.department,
        "section": new_student.section
    }}

@app.post("/api/auth/register-faculty")
def register_faculty(req: RegisterFacultyRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    existing = db.query(FacultyUser).filter(FacultyUser.email == clean_email).first()
    if existing:
        existing.name = req.name.strip()
        if req.department: existing.department = req.department.strip()
        if req.password: existing.password = req.password.strip()
        if req.title: existing.title = req.title.strip()
        db.commit()
        db.refresh(existing)
        return {"success": True, "message": "Faculty account updated.", "user": {
            "role": "FACULTY", "name": existing.name, "email": existing.email, "department": existing.department, "title": existing.title
        }}
    
    new_fac = FacultyUser(
        name=req.name.strip(),
        email=clean_email,
        department=req.department.strip() if req.department else "AIML",
        password=req.password.strip(),
        title=req.title.strip() if req.title else "Faculty ML Evaluator"
    )
    db.add(new_fac)
    db.commit()
    db.refresh(new_fac)
    return {"success": True, "message": "Faculty account registered in database.", "user": {
        "role": "FACULTY", "name": new_fac.name, "email": new_fac.email, "department": new_fac.department, "title": new_fac.title
    }}

@app.get("/api/students/{roll_no}/profile")
def get_student_profile(roll_no: str, db: Session = Depends(get_db)):
    clean_roll = roll_no.strip().upper()
    student = db.query(StudentUser).filter(StudentUser.roll_no == clean_roll).first()
    runs = db.query(ValidationRun).filter(ValidationRun.roll_no == clean_roll).order_by(ValidationRun.created_at.desc()).all()
    
    all_runs = db.query(ValidationRun).all()
    sorted_runs = sorted(all_runs, key=lambda x: x.final_score or 0, reverse=True)
    rank = None
    best_score = 0
    for idx, r in enumerate(sorted_runs):
        if r.roll_no == clean_roll:
            if rank is None:
                rank = idx + 1
                best_score = r.final_score or 0
    
    return {
        "student": {
            "roll_no": student.roll_no if student else clean_roll,
            "name": student.name if student else (runs[0].student_name if runs else "Student"),
            "department": student.department if student else (runs[0].department if runs else "AIML"),
            "section": student.section if student else (runs[0].section if runs else "A"),
        },
        "submissions_count": len(runs),
        "rank": rank,
        "best_score": best_score,
        "submissions": [
            {
                "id": r.id,
                "filename": r.filename,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "final_score": r.final_score,
                "overall_status": r.overall_status
            }
            for r in runs
        ]
    }

@app.post("/upload")
async def upload_notebooks(
    background_tasks: BackgroundTasks, 
    files: list[UploadFile] = File(...), 
    name: str = Form(None),
    dept: str = Form(None),
    sec: str = Form(None),
    roll_no: str = Form(None),
    use_case: str = Form(None),
    db: Session = Depends(get_db)
):
    batch_id = "BATCH_CURRENT"
    results = []
    
    for file in files:
        try:
            content = await file.read()
            final_name = name.strip() if name and name.strip() else file.filename.split(".")[0].replace("_", " ").title()
            final_dept = dept.strip() if dept and dept.strip() else "AIML"
            final_sec = sec.strip() if sec and sec.strip() else "A"
            final_roll = roll_no.strip() if roll_no and roll_no.strip() else "24AM001"
            final_use_case = use_case.strip() if use_case and use_case.strip() else "Traffic Sign Recognition"
            
            # Resolve use case specific baseline
            uc_config = db.query(UseCaseConfig).filter(UseCaseConfig.name == final_use_case).first()
            baseline_for_run = {
                "accuracy": uc_config.accuracy if uc_config else current_baselines.accuracy,
                "macro_f1": uc_config.macro_f1 if uc_config else current_baselines.macro_f1,
                "training_time": uc_config.training_time if uc_config else current_baselines.training_time,
                "time_comparison": uc_config.time_comparison if uc_config else current_baselines.time_comparison,
            }
            
            # Create DB record with student metadata and chosen use case
            run = ValidationRun(
                student_name=final_name, 
                department=final_dept,
                section=final_sec,
                roll_no=final_roll,
                use_case=final_use_case,
                filename=file.filename, 
                batch_id=batch_id
            )
            db.add(run)
            db.flush() # Flush to generate run.id for foreign keys without premature commit
            
            # Audit Log
            db.add(AuditLog(run_id=run.id, action="Notebook Uploaded", details=f"Student: {final_name} | Roll: {final_roll} | Track: {final_use_case}"))
            
            # Run Evidence Analysis against specific use case baseline
            analyze_notebook_evidence(db, run.id, file.filename, content, baseline_for_run)
            
            # Commit run, audit log, and all extracted evidence atomically
            db.commit()
            db.refresh(run)
            
            results.append({
                "id": run.id, 
                "filename": file.filename, 
                "student_name": final_name,
                "department": final_dept,
                "section": final_sec,
                "roll_no": final_roll,
                "use_case": final_use_case,
                "status": "PROCESSING"
            })
        except Exception as e:
            traceback.print_exc()
            db.rollback()
            raise HTTPException(
                status_code=500, 
                detail=f"Notebook verification failed on '{file.filename}': {str(e)}"
            )
    
    return {"uploaded": len(files), "results": results}

def recalculate_all_runs_against_baselines(db: Session, default_baselines: Optional[BaselineConfig] = None):
    runs = db.query(ValidationRun).all()
    uc_configs = {u.name: u for u in db.query(UseCaseConfig).all()}
    
    for r in runs:
        acc_val = None
        f1_val = None
        time_val = None
        
        for ev in r.evidence:
            if ev.metric_name == "Accuracy" and ev.verification_status == "VERIFIED" and ev.extracted_value:
                try:
                    acc_val = float(ev.extracted_value.replace("%", "").strip())
                except Exception:
                    pass
            elif ev.metric_name == "Macro F1" and ev.verification_status == "VERIFIED" and ev.extracted_value:
                try:
                    f1_val = float(ev.extracted_value.replace("%", "").strip())
                except Exception:
                    pass
            elif ev.metric_name == "Training Time" and ev.verification_status == "VERIFIED" and ev.extracted_value:
                try:
                    time_val = float(ev.extracted_value.replace("s", "").strip())
                except Exception:
                    pass
        
        # Resolve target baseline for the run's specific use case
        uc_name = getattr(r, 'use_case', 'Traffic Sign Recognition') or 'Traffic Sign Recognition'
        uc = uc_configs.get(uc_name)
        
        target_acc = uc.accuracy if uc else (default_baselines.accuracy if default_baselines else current_baselines.accuracy)
        target_f1 = uc.macro_f1 if uc else (default_baselines.macro_f1 if default_baselines else current_baselines.macro_f1)
        target_time = uc.training_time if uc else (default_baselines.training_time if default_baselines else current_baselines.training_time)
        time_comparison = uc.time_comparison if uc else (default_baselines.time_comparison if default_baselines else current_baselines.time_comparison)
        
        # Base weight: Accuracy 40%, Macro F1 40%, Training Time 20%
        passed_acc = acc_val is not None and acc_val >= target_acc
        passed_f1 = f1_val is not None and f1_val >= target_f1
        passed_time = time_val is not None and (time_val <= target_time if time_comparison == "lower" else time_val >= target_time)

        if acc_val is not None:
            raw_acc = min(40.0, (acc_val / 100.0) * 40.0)
            acc_contrib = round(raw_acc if passed_acc else raw_acc * 0.7, 2)
        else:
            acc_contrib = 0.0

        if f1_val is not None:
            raw_f1 = min(40.0, (f1_val / 100.0) * 40.0)
            f1_contrib = round(raw_f1 if passed_f1 else raw_f1 * 0.7, 2)
        else:
            f1_contrib = 0.0

        time_contrib = 0.0
        if time_val is not None and time_val > 0:
            if time_comparison == "lower":
                ratio = min(20.0, (target_time / time_val) * 20.0)
            else:
                ratio = min(20.0, (time_val / max(0.1, target_time)) * 20.0)
            time_contrib = round(20.0 if passed_time else ratio * 0.7, 2)
            
        total_score = round(acc_contrib + f1_contrib + time_contrib, 1)
        all_passed = passed_acc and passed_f1 and passed_time
        
        r.final_score = total_score
        r.overall_status = "VERIFIED" if all_passed else "REVIEW REQUIRED"
        
        # Refresh ScoringBreakdown
        db.query(ScoringBreakdown).filter(ScoringBreakdown.run_id == r.id).delete()
        db.add(ScoringBreakdown(run_id=r.id, metric_name="Accuracy", weight=40, contribution=acc_contrib))
        db.add(ScoringBreakdown(run_id=r.id, metric_name="Macro F1", weight=40, contribution=f1_contrib))
        db.add(ScoringBreakdown(run_id=r.id, metric_name="Training Time", weight=20, contribution=time_contrib))
        
        # Update baseline references in evidence
        for ev in r.evidence:
            if ev.metric_name == "Accuracy":
                ev.baseline_value = f"{target_acc}%"
                if acc_val is not None:
                    diff = round(acc_val - target_acc, 2)
                    ev.difference_from_baseline = f"{diff:+.2f}% vs target"
                    ev.baseline_status = "Above target baseline" if diff >= 0 else "Below target baseline"
            elif ev.metric_name == "Macro F1":
                ev.baseline_value = f"{target_f1}%"
                if f1_val is not None:
                    diff = round(f1_val - target_f1, 2)
                    ev.difference_from_baseline = f"{diff:+.2f}% vs target"
                    ev.baseline_status = "Above target baseline" if diff >= 0 else "Below target baseline"
            elif ev.metric_name == "Training Time":
                ev.baseline_value = f"{target_time}s"
                if time_val is not None:
                    diff = round(time_val - target_time, 2)
                    ev.difference_from_baseline = f"{diff:+.2f}s vs target"
                    ev.baseline_status = "Within target threshold" if (time_val <= target_time if time_comparison == 'lower' else time_val >= target_time) else "Exceeds target limit"
                    
    db.commit()

def format_run_data(r: ValidationRun, rank: int = 1, baselines: BaselineConfig = current_baselines, db: Optional[Session] = None):
    acc_val = None
    f1_val = None
    time_val = None
    
    for ev in r.evidence:
        if ev.metric_name == "Accuracy" and ev.verification_status == "VERIFIED" and ev.extracted_value:
            try:
                acc_val = round(float(ev.extracted_value.replace("%", "").strip()), 2)
            except Exception:
                pass
        elif ev.metric_name == "Macro F1" and ev.verification_status == "VERIFIED" and ev.extracted_value:
            try:
                f1_val = round(float(ev.extracted_value.replace("%", "").strip()), 2)
            except Exception:
                pass
        elif ev.metric_name == "Training Time" and ev.verification_status == "VERIFIED" and ev.extracted_value:
            try:
                time_val = round(float(ev.extracted_value.replace("s", "").strip()), 2)
            except Exception:
                pass
    
    use_case_name = getattr(r, 'use_case', 'Traffic Sign Recognition') or "Traffic Sign Recognition"
    target_acc = baselines.accuracy
    target_f1 = baselines.macro_f1
    target_time = baselines.training_time
    time_comparison = baselines.time_comparison
    
    if db:
        uc = db.query(UseCaseConfig).filter(UseCaseConfig.name == use_case_name).first()
        if uc:
            target_acc = uc.accuracy
            target_f1 = uc.macro_f1
            target_time = uc.training_time
            time_comparison = uc.time_comparison
                
    passed_acc = acc_val is not None and acc_val >= target_acc
    passed_f1 = f1_val is not None and f1_val >= target_f1
    passed_time = time_val is not None and (time_val <= target_time if time_comparison == "lower" else time_val >= target_time)
    
    acc_delta = round(acc_val - target_acc, 2) if acc_val is not None else None
    f1_delta = round(f1_val - target_f1, 2) if f1_val is not None else None
    time_delta = round(time_val - target_time, 2) if time_val is not None else None
    baselines_passed_count = sum([1 for p in [passed_acc, passed_f1, passed_time] if p])
    
    score = round(r.final_score, 1) if r.final_score is not None else 0.0
    is_success = r.overall_status == "VERIFIED"
    
    feedback_lines = []
    for f in r.findings:
        feedback_lines.append(f"- [{f.finding_type}] {f.title}: {f.description}")
    if not feedback_lines:
        if is_success:
            feedback_lines.append(f"- All workflow steps verified and all {baselines_passed_count}/3 baseline criteria achieved.")
        else:
            feedback_lines.append(f"- Baseline criteria not fully met ({baselines_passed_count}/3 passed) or metrics unverified.")
    ai_feedback = "\n".join(feedback_lines)
    
    return {
        "id": r.id,
        "rank": rank,
        "student_name": r.student_name,
        "dept": getattr(r, 'department', None) or "AIML",
        "sec": getattr(r, 'section', None) or "A",
        "roll_no": getattr(r, 'roll_no', None) or "24AM001",
        "use_case": use_case_name,
        "filename": r.filename,
        "batch_id": r.batch_id,
        "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "",
        "final_score": score,
        "workflow_score": score,
        "accuracy": acc_val if acc_val is not None else "N/A",
        "accuracy_target": target_acc,
        "accuracy_delta": acc_delta,
        "macro_f1": f1_val if f1_val is not None else "N/A",
        "macro_f1_target": target_f1,
        "macro_f1_delta": f1_delta,
        "training_time": time_val if time_val is not None else "N/A",
        "training_time_target": target_time,
        "training_time_delta": time_delta,
        "time_comparison": time_comparison,
        "baselines_passed_count": baselines_passed_count,
        "total_baselines": 3,
        "status": r.overall_status,
        "success": is_success,
        "passed_baselines": {
            "accuracy": passed_acc,
            "macro_f1": passed_f1,
            "training_time": passed_time
        },
        "ai_feedback": ai_feedback
    }

@app.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    try:
        runs = db.query(ValidationRun).all()
        sorted_runs = sorted(runs, key=lambda x: x.final_score or 0, reverse=True)
        return [format_run_data(r, i + 1, current_baselines) for i, r in enumerate(sorted_runs)]
    except Exception as e:
        traceback.print_exc()
        return []

@app.get("/api/validations/{run_id}/evidence")
def get_validation_evidence(run_id: int, db: Session = Depends(get_db)):
    try:
        evidence = db.query(ValidationEvidence).filter(ValidationEvidence.run_id == run_id).all()
        return evidence
    except Exception as e:
        traceback.print_exc()
        return []

@app.get("/api/validations/{run_id}/findings")
def get_validation_findings(run_id: int, db: Session = Depends(get_db)):
    try:
        findings = db.query(ValidationFinding).filter(ValidationFinding.run_id == run_id).all()
        return findings
    except Exception as e:
        traceback.print_exc()
        return []

@app.get("/api/validations/{run_id}/scoring")
def get_validation_scoring(run_id: int, db: Session = Depends(get_db)):
    try:
        scoring = db.query(ScoringBreakdown).filter(ScoringBreakdown.run_id == run_id).all()
        run = db.query(ValidationRun).filter(ValidationRun.id == run_id).first()
        return {"final_score": run.final_score if run else 0.0, "breakdown": scoring}
    except Exception as e:
        traceback.print_exc()
        return {"final_score": 0.0, "breakdown": []}

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    try:
        runs = db.query(ValidationRun).all()
        total = len(runs)
        use_case_configs = db.query(UseCaseConfig).order_by(UseCaseConfig.id).all()
        
        target_acc = current_baselines.accuracy
        target_f1 = current_baselines.macro_f1
        target_time = current_baselines.training_time
        
        acc_list = []
        f1_list = []
        time_list = []
        student_records = []
        
        below_target_count = 0
        meets_target_count = 0
        unverified_count = 0
        
        for r in runs:
            student_acc = None
            student_f1 = None
            student_time = None
            
            for ev in r.evidence:
                if ev.verification_status == "VERIFIED" and ev.extracted_value:
                    try:
                        if ev.metric_name == "Accuracy":
                            student_acc = round(float(ev.extracted_value.replace("%", "").strip()), 2)
                        elif ev.metric_name == "Macro F1":
                            student_f1 = round(float(ev.extracted_value.replace("%", "").strip()), 2)
                        elif ev.metric_name == "Training Time":
                            student_time = round(float(ev.extracted_value.replace("s", "").strip()), 2)
                    except Exception:
                        pass
                        
            if student_acc is not None:
                acc_list.append(student_acc)
                if student_acc >= target_acc:
                    meets_target_count += 1
                else:
                    below_target_count += 1
            else:
                unverified_count += 1
                
            if student_f1 is not None:
                f1_list.append(student_f1)
            if student_time is not None:
                time_list.append(student_time)
                
            student_records.append({
                "name": r.student_name,
                "use_case": getattr(r, 'use_case', 'Traffic Sign Recognition') or 'Traffic Sign Recognition',
                "accuracy": student_acc if student_acc is not None else 0.0,
                "is_verified": student_acc is not None,
                "meets_target": student_acc is not None and student_acc >= target_acc,
                "target": target_acc
            })
            
        avg_acc = round(sum(acc_list) / len(acc_list), 1) if acc_list else 0.0
        avg_f1 = round(sum(f1_list) / len(f1_list), 1) if f1_list else 0.0
        avg_time = round(sum(time_list) / len(time_list), 1) if time_list else 0.0
        success = sum(1 for r in runs if r.overall_status == "VERIFIED")
        
        # Calculate stats individually for each of the 7 use cases
        use_case_stats = []
        for uc in use_case_configs:
            uc_runs = [r for r in runs if (getattr(r, 'use_case', None) or 'Traffic Sign Recognition') == uc.name]
            uc_total = len(uc_runs)
            uc_passed = sum(1 for r in uc_runs if r.overall_status == "VERIFIED")
            
            uc_acc_list = []
            uc_f1_list = []
            uc_time_list = []
            for r in uc_runs:
                for ev in r.evidence:
                    if ev.verification_status == "VERIFIED" and ev.extracted_value:
                        try:
                            if ev.metric_name == "Accuracy":
                                uc_acc_list.append(float(ev.extracted_value.replace("%", "").strip()))
                            elif ev.metric_name == "Macro F1":
                                uc_f1_list.append(float(ev.extracted_value.replace("%", "").strip()))
                            elif ev.metric_name == "Training Time":
                                uc_time_list.append(float(ev.extracted_value.replace("s", "").strip()))
                        except Exception:
                            pass
            
            uc_avg_acc = round(sum(uc_acc_list) / len(uc_acc_list), 1) if uc_acc_list else 0.0
            uc_avg_f1 = round(sum(uc_f1_list) / len(uc_f1_list), 1) if uc_f1_list else 0.0
            uc_avg_time = round(sum(uc_time_list) / len(uc_time_list), 1) if uc_time_list else 0.0
            
            use_case_stats.append({
                "id": uc.id,
                "name": uc.name,
                "description": uc.description,
                "student_quota": uc.student_quota, # 15
                "total_submissions": uc_total,
                "passed_count": uc_passed,
                "review_count": uc_total - uc_passed,
                "validation_success_rate": round((uc_passed / uc_total) * 100, 1) if uc_total > 0 else 0.0,
                "avg_accuracy": uc_avg_acc,
                "avg_macro_f1": uc_avg_f1,
                "avg_training_time": uc_avg_time,
                "quota_progress": min(100, round((uc_total / max(1, uc.student_quota)) * 100, 1)),
                "baseline": {
                    "accuracy": uc.accuracy,
                    "macro_f1": uc.macro_f1,
                    "training_time": uc.training_time,
                    "time_comparison": uc.time_comparison,
                    "student_quota": uc.student_quota
                }
            })
        
        # Baseline-correlated distribution
        dist = [
            {"name": f">= {target_acc}% (Target Met)", "students": meets_target_count, "fill": "#10B981"},
            {"name": f"< {target_acc}% (Below Target)", "students": below_target_count, "fill": "#F59E0B"},
            {"name": "Unverified / 0%", "students": unverified_count, "fill": "#6B7280"}
        ]
        
        range_dist = [
            {"name": "< 60%", "students": sum(1 for a in acc_list if a < 60), "fill": "#EF4444"},
            {"name": "60-75%", "students": sum(1 for a in acc_list if 60 <= a < 75), "fill": "#F59E0B"},
            {"name": "75-90%", "students": sum(1 for a in acc_list if 75 <= a < 90), "fill": "#3B82F6"},
            {"name": "90-100%", "students": sum(1 for a in acc_list if a >= 90), "fill": "#10B981"},
            {"name": "Unverified", "students": unverified_count, "fill": "#6B7280"}
        ]
        
        return {
            "total_students": total,
            "validated": total,
            "pending": 0,
            "avg_accuracy": avg_acc,
            "avg_macro_f1": avg_f1,
            "avg_training_time": avg_time,
            "validation_success_rate": round((success / total) * 100, 1) if total > 0 else 0,
            "accuracy_distribution": dist,
            "range_distribution": range_dist,
            "student_accuracies": student_records,
            "baselines": current_baselines.dict(),
            "use_cases": use_case_stats
        }
    except Exception as e:
        traceback.print_exc()
        return {
            "total_students": 0,
            "validated": 0,
            "pending": 0,
            "avg_accuracy": 0.0,
            "avg_macro_f1": 0.0,
            "avg_training_time": 0.0,
            "validation_success_rate": 0,
            "accuracy_distribution": [],
            "range_distribution": [],
            "student_accuracies": [],
            "baselines": current_baselines.dict(),
            "use_cases": []
        }

@app.get("/api/use-cases")
def get_use_cases(db: Session = Depends(get_db)):
    ucs = db.query(UseCaseConfig).order_by(UseCaseConfig.id).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "accuracy": u.accuracy,
            "macro_f1": u.macro_f1,
            "training_time": u.training_time,
            "time_comparison": u.time_comparison,
            "student_quota": u.student_quota,
            "description": u.description
        }
        for u in ucs
    ]

class UseCaseBaselineItem(BaseModel):
    id: Optional[int] = None
    name: str
    accuracy: float
    macro_f1: float
    training_time: float
    time_comparison: Optional[str] = "lower"
    student_quota: Optional[int] = 15
    description: Optional[str] = None

class BatchUseCaseUpdateRequest(BaseModel):
    use_cases: list[UseCaseBaselineItem]

@app.post("/api/use-cases/baselines")
def update_use_case_baselines(req: BatchUseCaseUpdateRequest, db: Session = Depends(get_db)):
    for item in req.use_cases:
        uc = db.query(UseCaseConfig).filter(UseCaseConfig.name == item.name).first()
        if uc:
            uc.accuracy = item.accuracy
            uc.macro_f1 = item.macro_f1
            uc.training_time = item.training_time
            if item.time_comparison:
                uc.time_comparison = item.time_comparison
            if item.student_quota is not None:
                uc.student_quota = item.student_quota
    db.commit()
    recalculate_all_runs_against_baselines(db)
    
    updated = db.query(UseCaseConfig).order_by(UseCaseConfig.id).all()
    return {
        "message": "All 7 use case baselines successfully updated and student runs re-evaluated.",
        "use_cases": [
            {
                "id": u.id,
                "name": u.name,
                "accuracy": u.accuracy,
                "macro_f1": u.macro_f1,
                "training_time": u.training_time,
                "time_comparison": u.time_comparison,
                "student_quota": u.student_quota,
                "description": u.description
            }
            for u in updated
        ]
    }

@app.get("/baselines")
def get_baselines(db: Session = Depends(get_db)):
    ucs = db.query(UseCaseConfig).order_by(UseCaseConfig.id).all()
    return {
        "global": current_baselines.dict(),
        "use_cases": [
            {
                "id": u.id,
                "name": u.name,
                "accuracy": u.accuracy,
                "macro_f1": u.macro_f1,
                "training_time": u.training_time,
                "time_comparison": u.time_comparison,
                "student_quota": u.student_quota,
                "description": u.description
            }
            for u in ucs
        ]
    }

@app.post("/baselines")
def update_baselines(config: BaselineConfig, db: Session = Depends(get_db)):
    global current_baselines
    current_baselines = config
    recalculate_all_runs_against_baselines(db, current_baselines)
    return {
        "message": "Baselines updated and all student projects successfully re-evaluated.",
        "baselines": current_baselines.dict()
    }

@app.post("/baselines/re-evaluate")
def trigger_reevaluate(db: Session = Depends(get_db)):
    recalculate_all_runs_against_baselines(db, current_baselines)
    return {"message": "All student projects re-evaluated against current baselines."}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
