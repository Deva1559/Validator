import os
import json
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, JSON, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./validation_evidence.db")

# Ensure robust SQLAlchemy driver dialect for PostgreSQL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

try:
    connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {"connect_timeout": 5}
    engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
    with engine.connect() as conn:
        pass
    print(f"Database connected successfully: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'SQLite'}")
except Exception as e:
    # Try alternative driver if psycopg2 is missing
    tried_fallback = False
    if "postgresql+psycopg2" in DATABASE_URL:
        try:
            alt_url = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
            engine = create_engine(alt_url, connect_args={"connect_timeout": 5}, pool_pre_ping=True)
            with engine.connect() as conn:
                pass
            DATABASE_URL = alt_url
            print(f"Database connected with psycopg3: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'Postgres'}")
            tried_fallback = True
        except Exception:
            pass

    if not tried_fallback:
        print(f"Database connection note ({e}). Falling back to local SQLite.")
        DATABASE_URL = "sqlite:///./validation_evidence.db"
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class StudentUser(Base):
    __tablename__ = "student_users"
    
    id = Column(Integer, primary_key=True, index=True)
    roll_no = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    department = Column(String, default="AIML", nullable=True)
    section = Column(String, default="A", nullable=True)
    pin = Column(String, default="1234", nullable=True)
    email = Column(String, nullable=True)
    assigned_use_case = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class FacultyUser(Base):
    __tablename__ = "faculty_users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    department = Column(String, default="AIML", nullable=True)
    password = Column(String, nullable=False)
    title = Column(String, default="Faculty ML Evaluator", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ValidationRun(Base):
    __tablename__ = "validation_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String, index=True)
    department = Column(String, default="AIML", nullable=True)
    section = Column(String, default="A", nullable=True)
    roll_no = Column(String, default="24AM001", nullable=True)
    use_case = Column(String, default="Traffic Sign Recognition", nullable=True, index=True)
    filename = Column(String)
    batch_id = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    final_score = Column(Float, nullable=True)
    overall_status = Column(String, default="PENDING") # VERIFIED, REVIEW REQUIRED, FAILED
    
    evidence = relationship("ValidationEvidence", back_populates="run", cascade="all, delete-orphan")
    findings = relationship("ValidationFinding", back_populates="run", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="run", cascade="all, delete-orphan")
    scoring_breakdown = relationship("ScoringBreakdown", back_populates="run", cascade="all, delete-orphan")

class UseCaseConfig(Base):
    __tablename__ = "use_case_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    accuracy = Column(Float, default=85.0)
    macro_f1 = Column(Float, default=80.0)
    training_time = Column(Float, default=60.0)
    time_comparison = Column(String, default="lower")
    student_quota = Column(Integer, default=15)
    description = Column(String, nullable=True)

class ValidationEvidence(Base):
    __tablename__ = "validation_evidence"
    
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("validation_runs.id"))
    
    metric_name = Column(String) # Accuracy, Macro F1, Training Time, ML-001 Dataset
    evidence_type = Column(String) # METRIC, WORKFLOW
    extracted_value = Column(String, nullable=True)
    unit = Column(String, nullable=True)
    
    source_cell = Column(Integer, nullable=True)
    detection_method = Column(String, nullable=True)
    relevant_code = Column(Text, nullable=True)
    relevant_output = Column(Text, nullable=True)
    
    confidence_score = Column(Float, nullable=True)
    verification_status = Column(String) # VERIFIED, NOT VERIFIED, MULTIPLE VALUES
    
    baseline_value = Column(String, nullable=True)
    difference_from_baseline = Column(String, nullable=True)
    baseline_status = Column(String, nullable=True)
    
    run = relationship("ValidationRun", back_populates="evidence")

class ValidationFinding(Base):
    __tablename__ = "validation_findings"
    
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("validation_runs.id"))
    
    finding_type = Column(String) # WARNING, ERROR, POTENTIAL LEAKAGE
    title = Column(String)
    description = Column(Text)
    source = Column(String) # RULE ENGINE, AI INTERPRETATION, FACULTY REVIEW
    
    run = relationship("ValidationRun", back_populates="findings")

class ScoringBreakdown(Base):
    __tablename__ = "scoring_breakdowns"
    
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("validation_runs.id"))
    
    metric_name = Column(String)
    weight = Column(Float)
    contribution = Column(Float)
    
    run = relationship("ValidationRun", back_populates="scoring_breakdown")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("validation_runs.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user = Column(String, default="SYSTEM")
    action = Column(String)
    details = Column(Text, nullable=True)
    
    run = relationship("ValidationRun", back_populates="audit_logs")

Base.metadata.create_all(bind=engine)

# Auto-migrate schema
def auto_migrate():
    with engine.connect() as conn:
        # SQLite migrations
        try:
            result = conn.execute(text("PRAGMA table_info(validation_runs)"))
            existing_cols = [row[1] for row in result.fetchall()]
            if existing_cols:
                if "department" not in existing_cols:
                    conn.execute(text("ALTER TABLE validation_runs ADD COLUMN department VARCHAR DEFAULT 'AIML'"))
                if "section" not in existing_cols:
                    conn.execute(text("ALTER TABLE validation_runs ADD COLUMN section VARCHAR DEFAULT 'A'"))
                if "roll_no" not in existing_cols:
                    conn.execute(text("ALTER TABLE validation_runs ADD COLUMN roll_no VARCHAR DEFAULT '24AM001'"))
                if "use_case" not in existing_cols:
                    conn.execute(text("ALTER TABLE validation_runs ADD COLUMN use_case VARCHAR DEFAULT 'Traffic Sign Recognition'"))
                conn.commit()

            result_s = conn.execute(text("PRAGMA table_info(student_users)"))
            existing_s_cols = [row[1] for row in result_s.fetchall()]
            if existing_s_cols and "assigned_use_case" not in existing_s_cols:
                conn.execute(text("ALTER TABLE student_users ADD COLUMN assigned_use_case VARCHAR"))
                conn.commit()

            result_ev = conn.execute(text("PRAGMA table_info(validation_evidence)"))
            existing_ev_cols = [row[1] for row in result_ev.fetchall()]
            if existing_ev_cols:
                for col, col_t in [
                    ("evidence_type", "VARCHAR"),
                    ("source_cell", "INTEGER"),
                    ("unit", "VARCHAR"),
                    ("detection_method", "VARCHAR"),
                    ("relevant_code", "TEXT"),
                    ("relevant_output", "TEXT")
                ]:
                    if col not in existing_ev_cols:
                        conn.execute(text(f"ALTER TABLE validation_evidence ADD COLUMN {col} {col_t}"))
                conn.commit()
        except Exception:
            pass

        # PostgreSQL migrations (adds missing columns in Supabase automatically)
        try:
            # validation_runs
            conn.execute(text("ALTER TABLE validation_runs ADD COLUMN IF NOT EXISTS department VARCHAR DEFAULT 'AIML'"))
            conn.execute(text("ALTER TABLE validation_runs ADD COLUMN IF NOT EXISTS section VARCHAR DEFAULT 'A'"))
            conn.execute(text("ALTER TABLE validation_runs ADD COLUMN IF NOT EXISTS roll_no VARCHAR DEFAULT '24AM001'"))
            conn.execute(text("ALTER TABLE validation_runs ADD COLUMN IF NOT EXISTS use_case VARCHAR DEFAULT 'Traffic Sign Recognition'"))
            
            # student_users
            conn.execute(text("ALTER TABLE student_users ADD COLUMN IF NOT EXISTS assigned_use_case VARCHAR"))
            
            # validation_evidence
            conn.execute(text("ALTER TABLE validation_evidence ADD COLUMN IF NOT EXISTS evidence_type VARCHAR"))
            conn.execute(text("ALTER TABLE validation_evidence ADD COLUMN IF NOT EXISTS source_cell INTEGER"))
            conn.execute(text("ALTER TABLE validation_evidence ADD COLUMN IF NOT EXISTS unit VARCHAR"))
            conn.execute(text("ALTER TABLE validation_evidence ADD COLUMN IF NOT EXISTS detection_method VARCHAR"))
            conn.execute(text("ALTER TABLE validation_evidence ADD COLUMN IF NOT EXISTS relevant_code TEXT"))
            conn.execute(text("ALTER TABLE validation_evidence ADD COLUMN IF NOT EXISTS relevant_output TEXT"))
            conn.commit()
        except Exception:
            pass

auto_migrate()

DEFAULT_USE_CASES = [
    {
        "name": "Traffic Sign Recognition",
        "accuracy": 88.0,
        "macro_f1": 85.0,
        "training_time": 45.0,
        "time_comparison": "lower",
        "student_quota": 19,
        "description": "Autonomous vision classification of road signs and regulatory symbols."
    },
    {
        "name": "Crop Leaf Disease Classification",
        "accuracy": 86.0,
        "macro_f1": 82.0,
        "training_time": 60.0,
        "time_comparison": "lower",
        "student_quota": 19,
        "description": "Agricultural AI diagnostic pipeline for early foliar pathology identification."
    },
    {
        "name": "Face Mask Detection",
        "accuracy": 90.0,
        "macro_f1": 88.0,
        "training_time": 30.0,
        "time_comparison": "lower",
        "student_quota": 19,
        "description": "Real-time facial occlusion audit for public health compliance verification."
    },
    {
        "name": "Pet Image Segmentation",
        "accuracy": 82.0,
        "macro_f1": 78.0,
        "training_time": 90.0,
        "time_comparison": "lower",
        "student_quota": 19,
        "description": "Pixel-level semantic contour mask extraction for animal morphology."
    },
    {
        "name": "Image Generation with GANs",
        "accuracy": 80.0,
        "macro_f1": 75.0,
        "training_time": 120.0,
        "time_comparison": "lower",
        "student_quota": 18,
        "description": "Generative adversarial distribution synthesis with fidelity metrics."
    },
    {
        "name": "Image Captioning",
        "accuracy": 82.0,
        "macro_f1": 78.0,
        "training_time": 100.0,
        "time_comparison": "lower",
        "student_quota": 18,
        "description": "Multimodal vision-language synthesis bridging visual features with natural language."
    },
    {
        "name": "Pneumonia Detection from Chest X-Rays",
        "accuracy": 92.0,
        "macro_f1": 90.0,
        "training_time": 50.0,
        "time_comparison": "lower",
        "student_quota": 18,
        "description": "High-stakes clinical radiographic screening with stringent false-negative penalties."
    }
]

def seed_default_use_cases():
    db = SessionLocal()
    try:
        existing_ucs = {u.name: u for u in db.query(UseCaseConfig).all()}
        for uc in DEFAULT_USE_CASES:
            if uc["name"] not in existing_ucs:
                db.add(UseCaseConfig(
                    name=uc["name"],
                    accuracy=uc["accuracy"],
                    macro_f1=uc["macro_f1"],
                    training_time=uc["training_time"],
                    time_comparison=uc["time_comparison"],
                    student_quota=uc["student_quota"],
                    description=uc["description"]
                ))
            else:
                # Update quota to 19/18 for 130 students distribution
                existing_ucs[uc["name"]].student_quota = uc["student_quota"]
        db.commit()
    except Exception as e:
        print("Note on seeding use cases:", e)
        db.rollback()
    finally:
        db.close()

seed_default_use_cases()

def seed_130_students():
    """Seeds or updates all 130 students from students_data.json with username=name, password=reg_no, and assigned_use_case chained 1..7."""
    db = SessionLocal()
    try:
        base_dir = os.path.dirname(__file__)
        json_path = os.path.join(base_dir, "students_data.json")
        if not os.path.exists(json_path):
            json_path = os.path.join(os.path.dirname(base_dir), "backend", "students_data.json")
        if not os.path.exists(json_path):
            json_path = "students_data.json"

        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                students_list = json.load(f)

            existing_by_roll = {s.roll_no: s for s in db.query(StudentUser).all()}
            new_cnt = 0
            upd_cnt = 0
            for item in students_list:
                roll = item["roll_no"]
                if roll in existing_by_roll:
                    st = existing_by_roll[roll]
                    st.name = item["name"]
                    st.pin = item["pin"] # password is register number
                    st.department = item.get("department", "AIML")
                    st.section = item.get("section", "A")
                    st.assigned_use_case = item.get("assigned_use_case")
                    st.email = item.get("email")
                    upd_cnt += 1
                else:
                    st = StudentUser(
                        roll_no=roll,
                        name=item["name"],
                        department=item.get("department", "AIML"),
                        section=item.get("section", "A"),
                        pin=item["pin"], # password is register number
                        email=item.get("email"),
                        assigned_use_case=item.get("assigned_use_case")
                    )
                    db.add(st)
                    new_cnt += 1
            db.commit()
            print(f"130 Students roster seeded: {new_cnt} created, {upd_cnt} updated.")
    except Exception as e:
        print("Note on seeding 130 students roster:", e)
        db.rollback()
    finally:
        db.close()

seed_130_students()

