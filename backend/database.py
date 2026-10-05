import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, JSON, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./validation_evidence.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

try:
    connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
    with engine.connect() as conn:
        pass
    print(f"Database connected: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'SQLite'}")
except Exception as e:
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
        except Exception as e:
            # PostgreSQL migration check
            try:
                conn.execute(text("ALTER TABLE validation_runs ADD COLUMN IF NOT EXISTS use_case VARCHAR DEFAULT 'Traffic Sign Recognition'"))
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
        "student_quota": 15,
        "description": "Autonomous vision classification of road signs and regulatory symbols."
    },
    {
        "name": "Crop Leaf Disease Classification",
        "accuracy": 86.0,
        "macro_f1": 82.0,
        "training_time": 60.0,
        "time_comparison": "lower",
        "student_quota": 15,
        "description": "Agricultural AI diagnostic pipeline for early foliar pathology identification."
    },
    {
        "name": "Face Mask Detection",
        "accuracy": 90.0,
        "macro_f1": 88.0,
        "training_time": 30.0,
        "time_comparison": "lower",
        "student_quota": 15,
        "description": "Real-time facial occlusion audit for public health compliance verification."
    },
    {
        "name": "Pet Image Segmentation",
        "accuracy": 82.0,
        "macro_f1": 78.0,
        "training_time": 90.0,
        "time_comparison": "lower",
        "student_quota": 15,
        "description": "Pixel-level semantic contour mask extraction for animal morphology."
    },
    {
        "name": "Image Generation with GANs",
        "accuracy": 80.0,
        "macro_f1": 75.0,
        "training_time": 120.0,
        "time_comparison": "lower",
        "student_quota": 15,
        "description": "Generative adversarial distribution synthesis with fidelity metrics."
    },
    {
        "name": "Image Captioning",
        "accuracy": 82.0,
        "macro_f1": 78.0,
        "training_time": 100.0,
        "time_comparison": "lower",
        "student_quota": 15,
        "description": "Multimodal vision-language synthesis bridging visual features with natural language."
    },
    {
        "name": "Pneumonia Detection from Chest X-Rays",
        "accuracy": 92.0,
        "macro_f1": 90.0,
        "training_time": 50.0,
        "time_comparison": "lower",
        "student_quota": 15,
        "description": "High-stakes clinical radiographic screening with stringent false-negative penalties."
    }
]

def seed_default_use_cases():
    db = SessionLocal()
    try:
        count = db.query(UseCaseConfig).count()
        if count < len(DEFAULT_USE_CASES):
            existing_names = {u.name for u in db.query(UseCaseConfig.name).all()}
            for uc in DEFAULT_USE_CASES:
                if uc["name"] not in existing_names:
                    db.add(UseCaseConfig(
                        name=uc["name"],
                        accuracy=uc["accuracy"],
                        macro_f1=uc["macro_f1"],
                        training_time=uc["training_time"],
                        time_comparison=uc["time_comparison"],
                        student_quota=uc["student_quota"],
                        description=uc["description"]
                    ))
            db.commit()
    except Exception as e:
        print("Note on seeding use cases:", e)
        db.rollback()
    finally:
        db.close()

seed_default_use_cases()

