import os
import json
from datetime import datetime, timedelta
from database import (
    SessionLocal, ValidationRun, ValidationEvidence, ValidationFinding, 
    AuditLog, StudentUser
)
from scoring_engine import recalculate_and_sync_scores
try:
    from backend.main import USE_CASE_DASHBOARD_METRICS, build_metric_evidence_for_run
except ImportError:
    from main import USE_CASE_DASHBOARD_METRICS, build_metric_evidence_for_run

def seed_student_submissions(force_refresh: bool = False):
    db = SessionLocal()
    try:
        # Check if runs already exist
        existing_runs = db.query(ValidationRun).count()
        if existing_runs > 0 and not force_refresh:
            print(f"Database already contains {existing_runs} validation runs. Preserving existing data.")
            return

        if existing_runs > 0 and force_refresh:
            print(f"Database contains {existing_runs} runs. Force refreshing with 12 students (15 uploads)...")
            db.query(ValidationEvidence).delete()
            db.query(ValidationFinding).delete()
            db.query(AuditLog).delete()
            db.query(ValidationRun).delete()
            db.commit()
        else:
            print("Database has 0 runs. Seeding 12 sample students with 15 uploads...")

        submissions_manifest = [
            # 1. G S ABINIVAS (2 uploads: v1 historical, v2 latest)
            {
                "roll_no": "722824148001",
                "name": "G S ABINIVAS",
                "use_case": "Traffic Sign Recognition",
                "filename": "g_s_abinivas_traffic_sign_v1.ipynb",
                "score": 78.5,
                "days_ago": 3,
                "is_historical": True
            },
            {
                "roll_no": "722824148001",
                "name": "G S ABINIVAS",
                "use_case": "Traffic Sign Recognition",
                "filename": "g_s_abinivas_traffic_sign_v2_final.ipynb",
                "score": 91.2,
                "days_ago": 1,
                "is_historical": False
            },
            # 2. V C ADITH (1 upload)
            {
                "roll_no": "722824148002",
                "name": "V C ADITH",
                "use_case": "Crop Leaf Disease Classification",
                "filename": "vc_adith_plant_village_cnn.ipynb",
                "score": 93.4,
                "days_ago": 2,
                "is_historical": False
            },
            # 3. M K AJAY SHASHTIVEL (2 uploads: v1 historical, v2 latest)
            {
                "roll_no": "722824148003",
                "name": "M K AJAY SHASHTIVEL",
                "use_case": "Face Mask Detection",
                "filename": "ajay_shashtivel_face_mask_v1.ipynb",
                "score": 82.0,
                "days_ago": 4,
                "is_historical": True
            },
            {
                "roll_no": "722824148003",
                "name": "M K AJAY SHASHTIVEL",
                "use_case": "Face Mask Detection",
                "filename": "ajay_shashtivel_face_mask_v2_optimized.ipynb",
                "score": 89.8,
                "days_ago": 1,
                "is_historical": False
            },
            # 4. AKASH B (1 upload)
            {
                "roll_no": "722824148004",
                "name": "AKASH B",
                "use_case": "Pet Image Segmentation",
                "filename": "akash_b_unet_oxford_pets.ipynb",
                "score": 88.5,
                "days_ago": 2,
                "is_historical": False
            },
            # 5. AKHILESH M P (1 upload)
            {
                "roll_no": "722824148005",
                "name": "AKHILESH M P",
                "use_case": "Image Generation with GANs",
                "filename": "akhilesh_dcgan_synthesis.ipynb",
                "score": 85.0,
                "days_ago": 2,
                "is_historical": False
            },
            # 6. AKSHATHA J (1 upload)
            {
                "roll_no": "722824148006",
                "name": "AKSHATHA J",
                "use_case": "Image Captioning",
                "filename": "akshatha_j_flickr8k_attention.ipynb",
                "score": 90.5,
                "days_ago": 2,
                "is_historical": False
            },
            # 7. AMIRTHAVARSHINI S (2 uploads: v1 historical, v2 latest)
            {
                "roll_no": "722824148007",
                "name": "AMIRTHAVARSHINI S",
                "use_case": "Pneumonia Detection from Chest X-Rays",
                "filename": "amirthavarshini_pneumonia_v1_baseline.ipynb",
                "score": 84.5,
                "days_ago": 4,
                "is_historical": True
            },
            {
                "roll_no": "722824148007",
                "name": "AMIRTHAVARSHINI S",
                "use_case": "Pneumonia Detection from Chest X-Rays",
                "filename": "amirthavarshini_pneumonia_v2_resnext.ipynb",
                "score": 95.8,
                "days_ago": 1,
                "is_historical": False
            },
            # 8. ANISH R (1 upload)
            {
                "roll_no": "722824148008",
                "name": "ANISH R",
                "use_case": "Traffic Sign Recognition",
                "filename": "anish_r_gtsrb_efficientnet.ipynb",
                "score": 92.0,
                "days_ago": 1,
                "is_historical": False
            },
            # 9. ARAVINDHAN R (1 upload)
            {
                "roll_no": "722824148009",
                "name": "ARAVINDHAN R",
                "use_case": "Crop Leaf Disease Classification",
                "filename": "aravindhan_crop_disease_vit.ipynb",
                "score": 87.5,
                "days_ago": 2,
                "is_historical": False
            },
            # 10. ARCHANA S (1 upload)
            {
                "roll_no": "722824148010",
                "name": "ARCHANA S",
                "use_case": "Face Mask Detection",
                "filename": "archana_yolov8_face_mask.ipynb",
                "score": 91.0,
                "days_ago": 1,
                "is_historical": False
            },
            # 11. ASWIN S (1 upload)
            {
                "roll_no": "722824148011",
                "name": "ASWIN S",
                "use_case": "Pet Image Segmentation",
                "filename": "aswin_deeplabv3_pet_segmentation.ipynb",
                "score": 86.4,
                "days_ago": 2,
                "is_historical": False
            },
            # 12. ATCHAYA K (1 upload)
            {
                "roll_no": "722824148012",
                "name": "ATCHAYA K",
                "use_case": "Image Generation with GANs",
                "filename": "atchaya_wgan_gp_synthesis.ipynb",
                "score": 84.8,
                "days_ago": 1,
                "is_historical": False
            }
        ]

        now = datetime.utcnow()
        created_runs = []

        for sub in submissions_manifest:
            created_time = now - timedelta(days=sub["days_ago"], hours=2)
            run = ValidationRun(
                student_name=sub["name"],
                department="AIML",
                section="A",
                roll_no=sub["roll_no"],
                use_case=sub["use_case"],
                filename=sub["filename"],
                batch_id="COHORT_2026_BATCH_1",
                created_at=created_time,
                final_score=sub["score"],
                overall_status="VERIFIED"
            )
            db.add(run)
            db.flush()
            created_runs.append(run)

            # 1. Standard 6-Step Workflow Evidence
            default_wf = [
                ("ML-001: Dataset Ingestion", 2, "df = pd.read_csv('dataset.csv')", "Dataset loaded into memory. Shape: (12400, 24)", "Dataset loaded into memory via IO reader."),
                ("ML-002: Data Cleaning & Preprocessing", 3, "df.dropna(inplace=True)\ndf.drop_duplicates(inplace=True)", "0 missing values, 0 duplicates remaining.", "Missing values and duplicate row hygiene verified clean."),
                ("ML-003: Feature Engineering & Scaling", 4, "scaler = StandardScaler()\nX_scaled = scaler.fit_transform(X)", "Features normalized with zero leakage.", "Feature transformation and scaling applied exclusively after partition."),
                ("ML-007: Train-Test Split Partitioning", 6, "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)", "Partition: 80% train, 20% test.", "Dataset partitioned into separate training and testing subsets."),
                ("ML-010: Model Training Procedure & Leakage Check", 9, "model.fit(X_train, y_train)", "Model convergence achieved.", "Model fitting executed exclusively on training split."),
                ("ML-012: Evaluation & Metrics on Unseen Test Split", 12, "preds = model.predict(X_test)", "Evaluation executed on unseen test split.", "Evaluation metrics computed from unseen test predictions.")
            ]
            for step_title, cell_no, code_snip, out_snip, detail in default_wf:
                db.add(ValidationEvidence(
                    run_id=run.id,
                    metric_name=step_title,
                    evidence_type="WORKFLOW",
                    extracted_value="Detected & Verified",
                    baseline_value="Required Step",
                    difference_from_baseline="Compliant",
                    baseline_status=detail,
                    verification_status="VERIFIED",
                    confidence_score=97.0,
                    detection_method="AST, DATA_FLOW_ENGINE",
                    source_cell=cell_no,
                    relevant_code=code_snip,
                    relevant_output=out_snip
                ))

            # 2. Particular Dashboard Metrics Evidence
            metric_evs = build_metric_evidence_for_run(run, sub["use_case"], db)
            for m in metric_evs:
                db.add(ValidationEvidence(
                    run_id=run.id,
                    metric_name=m["metric_name"],
                    evidence_type="METRIC",
                    extracted_value=m["extracted_value"],
                    baseline_value=m["baseline_value"],
                    difference_from_baseline=m["difference_from_baseline"],
                    baseline_status=m["baseline_status"],
                    verification_status=m["verification_status"],
                    confidence_score=m["confidence_score"],
                    detection_method=m["detection_method"],
                    source_cell=m["source_cell"],
                    relevant_code=m["relevant_code"],
                    relevant_output=m["relevant_output"]
                ))

            # 3. Validation Findings
            db.add(ValidationFinding(
                run_id=run.id,
                finding_type="AUDIT PASS",
                title="Clean Partitioning & Zero Leakage Verified",
                description="Training split strictly isolated before parameter fitting. No training contamination detected.",
                source="DATA_FLOW_ENGINE"
            ))
            db.add(ValidationFinding(
                run_id=run.id,
                finding_type="INTEGRITY PASS",
                title="Deterministic Test Set Evaluation",
                description="Evaluation inference strictly executed against unseen test partition without leakage.",
                source="EVALUATION_INTEGRITY_ENGINE"
            ))

            # 4. Audit Log
            db.add(AuditLog(
                run_id=run.id,
                user=sub["name"],
                action="Notebook Uploaded & Verified",
                details=f"Roll: {sub['roll_no']} | Track: {sub['use_case']} | Final Score: {sub['score']}",
                timestamp=created_time
            ))

        db.commit()
        print(f"Successfully created {len(created_runs)} validation runs across 12 students!")

        # 5. Deterministic Leaderboard Sync & Recalculation
        sync_result = recalculate_and_sync_scores(db)
        print("Recalculation and Leaderboard Sync Result:", sync_result)

    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        print("Failed to seed submissions:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed_student_submissions(force_refresh=True)
