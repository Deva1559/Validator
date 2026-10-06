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
    
    baseline_value = Column(Text, nullable=True)
    difference_from_baseline = Column(Text, nullable=True)
    baseline_status = Column(Text, nullable=True)
    
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

# ==========================================
# 7-USE-CASE LEADERBOARD & SCORING MODELS
# ==========================================

class ScoringConfiguration(Base):
    __tablename__ = "scoring_configurations"
    
    id = Column(Integer, primary_key=True, index=True)
    version = Column(Integer, default=1, index=True)
    baseline_weight = Column(Float, default=60.0)    # 60%
    relative_weight = Column(Float, default=25.0)    # 25%
    validation_weight = Column(Float, default=15.0)  # 15%
    missing_metric_policy = Column(String, default="RENORMALIZE") # RENORMALIZE, REVIEW_REQUIRED, EXCLUDE
    min_cohort_normal = Column(Integer, default=15)
    min_cohort_limited = Column(Integer, default=8)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, default="FACULTY_ADMIN")
    notes = Column(Text, nullable=True)

class UseCaseMetricConfig(Base):
    __tablename__ = "use_case_metric_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    use_case_id = Column(String, index=True)      # e.g. GTSRB, PLANTVILLAGE, FACE_MASK, PET_SEGMENTATION, GAN, FLICKR8K, PNEUMONIA
    use_case_name = Column(String, index=True)    # e.g. Traffic Sign Recognition
    task_type = Column(String, index=True)        # IMAGE_CLASSIFICATION, OBJECT_DETECTION, IMAGE_SEGMENTATION, IMAGE_GENERATION, IMAGE_CAPTIONING, BINARY_CLASSIFICATION
    dataset_name = Column(String, nullable=True)
    metric_key = Column(String, index=True)       # accuracy, macro_f1, map50, dice, fid, bleu4, etc.
    metric_display_name = Column(String)          # Accuracy, Macro F1, mAP@0.5, etc.
    direction = Column(String, default="higher")  # higher, lower
    weight = Column(Float, default=0.333)         # Decimal fraction, e.g. 0.50
    baseline_target = Column(Float, default=85.0)
    unit = Column(String, default="%")
    is_primary = Column(Boolean, default=True)
    version = Column(Integer, default=1)
    updated_at = Column(DateTime, default=datetime.utcnow)

class MetricBaselineVersion(Base):
    __tablename__ = "metric_baseline_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    use_case_name = Column(String, index=True)
    metric_key = Column(String, index=True)
    target_value = Column(Float)
    direction = Column(String, default="higher")
    weight = Column(Float)
    version = Column(Integer, default=1)
    created_by = Column(String, default="FACULTY")
    created_at = Column(DateTime, default=datetime.utcnow)
    reason = Column(String, nullable=True)

class StudentMetricRecord(Base):
    __tablename__ = "student_metric_records"
    
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("validation_runs.id"), index=True)
    student_roll = Column(String, index=True)
    use_case_name = Column(String, index=True)
    metric_key = Column(String, index=True)
    raw_value = Column(String, nullable=True)       # e.g. "99.42", "184", "0.35"
    normalized_value = Column(Float, nullable=True) # 0-100 score relative to baseline
    direction = Column(String, default="higher")
    weight = Column(Float, default=1.0)
    evidence_status = Column(String, default="NOT VERIFIED") # VERIFIED, NOT VERIFIED, REVIEW REQUIRED, SUSPICIOUS
    evidence_source = Column(String, nullable=True)
    confidence = Column(Float, default=0.0)
    cell_reference = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class StudentLeaderboardScore(Base):
    __tablename__ = "student_leaderboard_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("validation_runs.id"), unique=True, index=True)
    student_roll = Column(String, index=True)
    student_name = Column(String)
    department = Column(String, default="AIML")
    section = Column(String, default="A")
    use_case_id = Column(String, index=True)
    use_case_name = Column(String, index=True)
    task_type = Column(String, index=True)
    
    # 3 Core Deterministic Components (0 - 100)
    task_score = Column(Float, default=0.0)       # Weighted performance of verified metrics
    baseline_score = Column(Float, default=0.0)   # Direct baseline attainment score (60%)
    relative_score = Column(Float, default=0.0)   # Percentile within same use-case cohort (25%)
    validation_score = Column(Float, default=0.0) # Evidence and code reliability score (15%)
    overall_score = Column(Float, default=0.0)    # Final composite 0 - 100 score
    
    # Cohort Context & Reliability
    cohort_size = Column(Integer, default=1)
    cohort_status = Column(String, default="NORMAL") # NORMAL, LIMITED, LOW SAMPLE
    rank_in_cohort = Column(Integer, default=1)
    overall_rank = Column(Integer, default=1)
    
    # Validation flags
    validation_status = Column(String, default="VERIFIED") # VERIFIED, PARTIALLY VERIFIED, WARNING, REVIEW REQUIRED, NOT VERIFIED
    has_leakage = Column(Boolean, default=False)
    has_suspicious_metrics = Column(Boolean, default=False)
    raw_metrics_json = Column(Text, nullable=True)
    score_breakdown_json = Column(Text, nullable=True)
    
    # Auditability & Versioning
    formula_version = Column(String, default="v2.0-deterministic")
    scoring_version = Column(Integer, default=1)
    baseline_version = Column(Integer, default=1)
    configuration_version = Column(Integer, default=1)
    updated_at = Column(DateTime, default=datetime.utcnow)

class LeaderboardSnapshot(Base):
    __tablename__ = "leaderboard_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    snapshot_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    total_students = Column(Integer, default=0)
    scores_json = Column(Text)
    config_version = Column(Integer, default=1)
    created_by = Column(String, default="SYSTEM")

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

        # PostgreSQL migrations (adds missing columns and widens types in Supabase automatically)
        try:
            # Expand VARCHAR(50) columns in validation_evidence to TEXT to avoid StringDataRightTruncation
            conn.execute(text("ALTER TABLE validation_evidence ALTER COLUMN baseline_status TYPE TEXT"))
            conn.execute(text("ALTER TABLE validation_evidence ALTER COLUMN difference_from_baseline TYPE TEXT"))
            conn.execute(text("ALTER TABLE validation_evidence ALTER COLUMN baseline_value TYPE TEXT"))
            conn.execute(text("ALTER TABLE validation_evidence ALTER COLUMN extracted_value TYPE TEXT"))
            conn.execute(text("ALTER TABLE validation_evidence ALTER COLUMN verification_status TYPE TEXT"))
            conn.execute(text("ALTER TABLE validation_evidence ALTER COLUMN metric_name TYPE TEXT"))
            conn.commit()
        except Exception:
            pass

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

DEFAULT_USE_CASE_METRICS = [
    # 1. Traffic Sign Recognition
    {"use_case_id": "GTSRB", "use_case_name": "Traffic Sign Recognition", "task_type": "IMAGE_CLASSIFICATION", "dataset_name": "GTSRB", "metric_key": "accuracy", "metric_display_name": "Accuracy", "direction": "higher", "weight": 0.50, "baseline_target": 90.0, "unit": "%"},
    {"use_case_id": "GTSRB", "use_case_name": "Traffic Sign Recognition", "task_type": "IMAGE_CLASSIFICATION", "dataset_name": "GTSRB", "metric_key": "macro_f1", "metric_display_name": "Macro-F1", "direction": "higher", "weight": 0.35, "baseline_target": 88.0, "unit": "%"},
    {"use_case_id": "GTSRB", "use_case_name": "Traffic Sign Recognition", "task_type": "IMAGE_CLASSIFICATION", "dataset_name": "GTSRB", "metric_key": "training_time", "metric_display_name": "Training Time", "direction": "lower", "weight": 0.15, "baseline_target": 60.0, "unit": "s"},

    # 2. Crop Leaf Disease Classification
    {"use_case_id": "PLANTVILLAGE", "use_case_name": "Crop Leaf Disease Classification", "task_type": "IMAGE_CLASSIFICATION", "dataset_name": "PlantVillage", "metric_key": "accuracy", "metric_display_name": "Accuracy", "direction": "higher", "weight": 0.45, "baseline_target": 90.0, "unit": "%"},
    {"use_case_id": "PLANTVILLAGE", "use_case_name": "Crop Leaf Disease Classification", "task_type": "IMAGE_CLASSIFICATION", "dataset_name": "PlantVillage", "metric_key": "macro_f1", "metric_display_name": "Macro-F1", "direction": "higher", "weight": 0.40, "baseline_target": 88.0, "unit": "%"},
    {"use_case_id": "PLANTVILLAGE", "use_case_name": "Crop Leaf Disease Classification", "task_type": "IMAGE_CLASSIFICATION", "dataset_name": "PlantVillage", "metric_key": "confusion_matrix_quality", "metric_display_name": "Confusion Matrix Quality", "direction": "higher", "weight": 0.15, "baseline_target": 90.0, "unit": "%"},

    # 3. Face Mask Detection
    {"use_case_id": "FACE_MASK", "use_case_name": "Face Mask Detection", "task_type": "OBJECT_DETECTION", "dataset_name": "Face Mask Detection", "metric_key": "map50", "metric_display_name": "mAP@0.5", "direction": "higher", "weight": 0.50, "baseline_target": 88.0, "unit": "%"},
    {"use_case_id": "FACE_MASK", "use_case_name": "Face Mask Detection", "task_type": "OBJECT_DETECTION", "dataset_name": "Face Mask Detection", "metric_key": "precision", "metric_display_name": "Precision", "direction": "higher", "weight": 0.25, "baseline_target": 85.0, "unit": "%"},
    {"use_case_id": "FACE_MASK", "use_case_name": "Face Mask Detection", "task_type": "OBJECT_DETECTION", "dataset_name": "Face Mask Detection", "metric_key": "recall", "metric_display_name": "Recall", "direction": "higher", "weight": 0.25, "baseline_target": 85.0, "unit": "%"},

    # 4. Pet Image Segmentation
    {"use_case_id": "PET_SEGMENTATION", "use_case_name": "Pet Image Segmentation", "task_type": "IMAGE_SEGMENTATION", "dataset_name": "Oxford-IIIT Pet", "metric_key": "dice", "metric_display_name": "Dice Score", "direction": "higher", "weight": 0.45, "baseline_target": 85.0, "unit": "%"},
    {"use_case_id": "PET_SEGMENTATION", "use_case_name": "Pet Image Segmentation", "task_type": "IMAGE_SEGMENTATION", "dataset_name": "Oxford-IIIT Pet", "metric_key": "iou", "metric_display_name": "IoU", "direction": "higher", "weight": 0.35, "baseline_target": 80.0, "unit": "%"},
    {"use_case_id": "PET_SEGMENTATION", "use_case_name": "Pet Image Segmentation", "task_type": "IMAGE_SEGMENTATION", "dataset_name": "Oxford-IIIT Pet", "metric_key": "pixel_accuracy", "metric_display_name": "Pixel Accuracy", "direction": "higher", "weight": 0.20, "baseline_target": 90.0, "unit": "%"},

    # 5. Image Generation with GANs
    {"use_case_id": "GAN", "use_case_name": "Image Generation with GANs", "task_type": "IMAGE_GENERATION", "dataset_name": "Fashion-MNIST / CIFAR-10", "metric_key": "fid", "metric_display_name": "FID", "direction": "lower", "weight": 0.50, "baseline_target": 25.0, "unit": "score"},
    {"use_case_id": "GAN", "use_case_name": "Image Generation with GANs", "task_type": "IMAGE_GENERATION", "dataset_name": "Fashion-MNIST / CIFAR-10", "metric_key": "generator_loss_stability", "metric_display_name": "G-Loss Stability", "direction": "higher", "weight": 0.25, "baseline_target": 85.0, "unit": "%"},
    {"use_case_id": "GAN", "use_case_name": "Image Generation with GANs", "task_type": "IMAGE_GENERATION", "dataset_name": "Fashion-MNIST / CIFAR-10", "metric_key": "discriminator_loss_stability", "metric_display_name": "D-Loss Stability", "direction": "higher", "weight": 0.25, "baseline_target": 85.0, "unit": "%"},

    # 6. Image Captioning
    {"use_case_id": "FLICKR8K", "use_case_name": "Image Captioning", "task_type": "IMAGE_CAPTIONING", "dataset_name": "Flickr8k", "metric_key": "bleu1", "metric_display_name": "BLEU-1", "direction": "higher", "weight": 0.40, "baseline_target": 65.0, "unit": "score"},
    {"use_case_id": "FLICKR8K", "use_case_name": "Image Captioning", "task_type": "IMAGE_CAPTIONING", "dataset_name": "Flickr8k", "metric_key": "bleu4", "metric_display_name": "BLEU-4", "direction": "higher", "weight": 0.60, "baseline_target": 35.0, "unit": "score"},

    # 7. Pneumonia Detection from Chest X-Rays
    {"use_case_id": "PNEUMONIA", "use_case_name": "Pneumonia Detection from Chest X-Rays", "task_type": "BINARY_CLASSIFICATION", "dataset_name": "Mendeley Chest X-Ray", "metric_key": "recall", "metric_display_name": "Recall", "direction": "higher", "weight": 0.40, "baseline_target": 92.0, "unit": "%"},
    {"use_case_id": "PNEUMONIA", "use_case_name": "Pneumonia Detection from Chest X-Rays", "task_type": "BINARY_CLASSIFICATION", "dataset_name": "Mendeley Chest X-Ray", "metric_key": "auc", "metric_display_name": "AUC-ROC", "direction": "higher", "weight": 0.30, "baseline_target": 90.0, "unit": "%"},
    {"use_case_id": "PNEUMONIA", "use_case_name": "Pneumonia Detection from Chest X-Rays", "task_type": "BINARY_CLASSIFICATION", "dataset_name": "Mendeley Chest X-Ray", "metric_key": "f1", "metric_display_name": "F1-Score", "direction": "higher", "weight": 0.30, "baseline_target": 88.0, "unit": "%"}
]

def seed_use_case_metric_configs():
    db = SessionLocal()
    try:
        existing = {(m.use_case_name, m.metric_key): m for m in db.query(UseCaseMetricConfig).all()}
        for m in DEFAULT_USE_CASE_METRICS:
            key = (m["use_case_name"], m["metric_key"])
            if key not in existing:
                db.add(UseCaseMetricConfig(
                    use_case_id=m["use_case_id"],
                    use_case_name=m["use_case_name"],
                    task_type=m["task_type"],
                    dataset_name=m["dataset_name"],
                    metric_key=m["metric_key"],
                    metric_display_name=m["metric_display_name"],
                    direction=m["direction"],
                    weight=m["weight"],
                    baseline_target=m["baseline_target"],
                    unit=m["unit"]
                ))
        
        # Also seed default global scoring configuration if absent
        cfg = db.query(ScoringConfiguration).filter(ScoringConfiguration.is_active == True).first()
        if not cfg:
            db.add(ScoringConfiguration(
                version=1,
                baseline_weight=60.0,
                relative_weight=25.0,
                validation_weight=15.0,
                missing_metric_policy="RENORMALIZE",
                min_cohort_normal=15,
                min_cohort_limited=8,
                is_active=True,
                notes="Initial deterministic 7-use-case scoring policy (60/25/15)"
            ))
        db.commit()
    except Exception as e:
        print("Note on seeding metric configs:", e)
        db.rollback()
    finally:
        db.close()

seed_use_case_metric_configs()

