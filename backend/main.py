import json
import asyncio
from fastapi import FastAPI, UploadFile, File, Depends, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import SessionLocal, ValidationRun, ValidationEvidence, ValidationFinding, ScoringBreakdown, AuditLog
from evidence import analyze_notebook_evidence

app = FastAPI(title="ModelValidator AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/api/admin/clear-all-data")
@app.delete("/api/validations/clear-all")
def clear_all_validation_data(db: Session = Depends(get_db)):
    """Deletes all student validation records, evidence, findings, and logs."""
    db.query(ValidationEvidence).delete()
    db.query(ValidationFinding).delete()
    db.query(ScoringBreakdown).delete()
    db.query(AuditLog).delete()
    db.query(ValidationRun).delete()
    db.commit()
    return {"message": "All student testing and validation records have been completely cleared."}


@app.post("/upload")
async def upload_notebooks(
    background_tasks: BackgroundTasks, 
    files: list[UploadFile] = File(...), 
    name: str = Form(None),
    dept: str = Form(None),
    sec: str = Form(None),
    roll_no: str = Form(None),
    db: Session = Depends(get_db)
):
    batch_id = "BATCH_CURRENT"
    results = []
    
    for file in files:
        content = await file.read()
        final_name = name.strip() if name and name.strip() else file.filename.split(".")[0].replace("_", " ").title()
        final_dept = dept.strip() if dept and dept.strip() else "AIML"
        final_sec = sec.strip() if sec and sec.strip() else "A"
        final_roll = roll_no.strip() if roll_no and roll_no.strip() else "24AM001"
        
        # Create DB record with student metadata
        run = ValidationRun(
            student_name=final_name, 
            department=final_dept,
            section=final_sec,
            roll_no=final_roll,
            filename=file.filename, 
            batch_id=batch_id
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        
        # Audit Log
        db.add(AuditLog(run_id=run.id, action="Notebook Uploaded", details=f"Student: {final_name} | Roll: {final_roll} | Dept: {final_dept} | Sec: {final_sec}"))
        db.commit()
        
        # Run Evidence Analysis
        analyze_notebook_evidence(db, run.id, file.filename, content, current_baselines.dict())
        
        results.append({
            "id": run.id, 
            "filename": file.filename, 
            "student_name": final_name,
            "department": final_dept,
            "section": final_sec,
            "roll_no": final_roll
        })
            
    return {"uploaded": len(files), "results": results}

def recalculate_all_runs_against_baselines(db: Session, baselines: BaselineConfig):
    runs = db.query(ValidationRun).all()
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
        
        target_acc = baselines.accuracy
        target_f1 = baselines.macro_f1
        target_time = baselines.training_time
        
        # Base weight: Accuracy 40%, Macro F1 40%, Training Time 20%
        passed_acc = acc_val is not None and acc_val >= target_acc
        passed_f1 = f1_val is not None and f1_val >= target_f1
        passed_time = time_val is not None and (time_val <= target_time if baselines.time_comparison == "lower" else time_val >= target_time)

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
            if baselines.time_comparison == "lower":
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
                    ev.baseline_status = "Within target threshold" if (time_val <= target_time if baselines.time_comparison == 'lower' else time_val >= target_time) else "Exceeds target limit"
                    
    db.commit()

def format_run_data(r: ValidationRun, rank: int = 1, baselines: BaselineConfig = current_baselines):
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
                
    target_acc = baselines.accuracy
    target_f1 = baselines.macro_f1
    target_time = baselines.training_time
    
    passed_acc = acc_val is not None and acc_val >= target_acc
    passed_f1 = f1_val is not None and f1_val >= target_f1
    passed_time = time_val is not None and (time_val <= target_time if baselines.time_comparison == "lower" else time_val >= target_time)
    
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
        "time_comparison": baselines.time_comparison,
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
    runs = db.query(ValidationRun).all()
    # Rank by final deterministic score descending
    sorted_runs = sorted(runs, key=lambda x: x.final_score or 0, reverse=True)
    return [format_run_data(r, i + 1, current_baselines) for i, r in enumerate(sorted_runs)]

@app.get("/api/validations/{run_id}/evidence")
def get_validation_evidence(run_id: int, db: Session = Depends(get_db)):
    evidence = db.query(ValidationEvidence).filter(ValidationEvidence.run_id == run_id).all()
    return evidence

@app.get("/api/validations/{run_id}/findings")
def get_validation_findings(run_id: int, db: Session = Depends(get_db)):
    findings = db.query(ValidationFinding).filter(ValidationFinding.run_id == run_id).all()
    return findings

@app.get("/api/validations/{run_id}/scoring")
def get_validation_scoring(run_id: int, db: Session = Depends(get_db)):
    scoring = db.query(ScoringBreakdown).filter(ScoringBreakdown.run_id == run_id).all()
    run = db.query(ValidationRun).filter(ValidationRun.id == run_id).first()
    return {"final_score": run.final_score if run else 0.0, "breakdown": scoring}

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    runs = db.query(ValidationRun).all()
    total = len(runs)
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
            "accuracy": student_acc if student_acc is not None else 0.0,
            "is_verified": student_acc is not None,
            "meets_target": student_acc is not None and student_acc >= target_acc,
            "target": target_acc
        })
        
    avg_acc = round(sum(acc_list) / len(acc_list), 1) if acc_list else 0.0
    avg_f1 = round(sum(f1_list) / len(f1_list), 1) if f1_list else 0.0
    avg_time = round(sum(time_list) / len(time_list), 1) if time_list else 0.0
    
    success = sum(1 for r in runs if r.overall_status == "VERIFIED")
    
    # Baseline-correlated distribution (Dynamically changes when baselines change)
    dist = [
        {
            "name": f">= {target_acc}% (Target Met)",
            "students": meets_target_count,
            "fill": "#10B981"
        },
        {
            "name": f"< {target_acc}% (Below Target)",
            "students": below_target_count,
            "fill": "#F59E0B"
        },
        {
            "name": "Unverified / 0%",
            "students": unverified_count,
            "fill": "#6B7280"
        }
    ]
    
    # Score range tiers
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
        "baselines": current_baselines.dict()
    }

@app.get("/baselines")
def get_baselines():
    return current_baselines.dict()

@app.post("/baselines")
def update_baselines(config: BaselineConfig, db: Session = Depends(get_db)):
    global current_baselines
    current_baselines = config
    # Dynamically re-evaluate all stored submissions against new baseline targets
    recalculate_all_runs_against_baselines(db, current_baselines)
    return {
        "message": "Baselines updated and all student projects successfully re-evaluated against new settings.",
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
    uvicorn.run("main:app", host="0.0.0.0", port=port)
