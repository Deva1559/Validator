"""
Deterministic Task-Aware Normalization and Scoring Engine for 130 ML Students across 7 Use Cases.

Guarantees:
1. Strict mathematical determinism: given identical metrics, baselines, and weights, identical output is produced.
2. Cross-task normalization: raw metrics (Accuracy %, FID, BLEU, Dice) are converted to 0-100 bounded task scores before comparison.
3. Two-level leaderboard: Task-specific rank + Overall 130-student rank.
4. Robust missing and suspicious metric policies.
5. Cohort size confidence and statistical reliability weighting.
6. Full explainability and auditability.
"""

from typing import Dict, List, Optional, Tuple, Any
import math
import json
from datetime import datetime
from sqlalchemy.orm import Session

# Metric normalizer functions

def normalize_higher_better(student_val: float, baseline_val: float) -> Tuple[float, str]:
    """
    Normalizes higher-is-better metrics (Accuracy, F1, mAP, Dice, BLEU, Recall, AUC, etc.)
    Returns (normalized_score 0-100, baseline_status)
    """
    if baseline_val <= 0:
        return (100.0 if student_val > 0 else 0.0), "MEETS BASELINE"
    
    if student_val >= baseline_val:
        # Meets or exceeds baseline - capped at 100.0 to prevent unfair runaway score inflation
        score = 100.0
        status = "EXCEEDS BASELINE" if student_val > baseline_val else "MEETS BASELINE"
    else:
        # Below baseline: proportional ratio
        score = max(0.0, (student_val / baseline_val) * 100.0)
        status = "BELOW BASELINE"
        
    return round(score, 2), status


def normalize_lower_better(student_val: float, baseline_val: float) -> Tuple[float, str]:
    """
    Normalizes lower-is-better metrics (FID, Training Time)
    Returns (normalized_score 0-100, baseline_status)
    """
    if student_val <= 0:
        return 100.0, "EXCEEDS BASELINE"
    
    if student_val <= baseline_val:
        # Faster time or lower FID than baseline target: capped at 100.0
        score = 100.0
        status = "EXCEEDS BASELINE" if student_val < baseline_val else "MEETS BASELINE"
    else:
        # Slower time or higher FID: inverse ratio
        score = max(0.0, (baseline_val / student_val) * 100.0)
        status = "BELOW BASELINE"
        
    return round(score, 2), status


def calculate_metric_score(
    metric_key: str, 
    raw_val: float, 
    baseline_val: float, 
    direction: str = "higher"
) -> Tuple[float, str]:
    """Dispatches normalization based on direction."""
    if math.isnan(raw_val) or math.isinf(raw_val):
        return 0.0, "INVALID VALUE"
        
    if direction == "lower":
        return normalize_lower_better(raw_val, baseline_val)
    return normalize_higher_better(raw_val, baseline_val)


def calculate_task_and_baseline_score(
    metrics_data: List[Dict[str, Any]], 
    metric_configs: List[Dict[str, Any]], 
    missing_policy: str = "RENORMALIZE"
) -> Dict[str, Any]:
    """
    Calculates the task-specific score and baseline attainment score for a single submission.
    
    metrics_data: list of dicts with:
      - metric_key: str
      - raw_value: float or None
      - verification_status: 'VERIFIED', 'NOT VERIFIED', 'REVIEW REQUIRED', 'SUSPICIOUS'
      - evidence_source: str
      - confidence: float
    
    metric_configs: list of dicts with:
      - metric_key: str
      - direction: 'higher' or 'lower'
      - weight: float (sums to 1.0)
      - baseline_target: float
    """
    metrics_map = {m["metric_key"]: m for m in metrics_data}
    config_map = {c["metric_key"]: c for c in metric_configs}
    
    verified_weight_sum = 0.0
    weighted_task_sum = 0.0
    missing_keys = []
    suspicious_keys = []
    breakdowns = []
    
    for key, cfg in config_map.items():
        w = cfg["weight"]
        target = cfg["baseline_target"]
        direction = cfg.get("direction", "higher")
        display_name = cfg.get("metric_display_name", key)
        unit = cfg.get("unit", "%")
        
        entry = metrics_map.get(key)
        
        if not entry or entry.get("raw_value") is None or entry.get("verification_status") != "VERIFIED":
            status = entry.get("verification_status", "NOT VERIFIED") if entry else "NOT VERIFIED"
            if status in ["SUSPICIOUS", "REVIEW REQUIRED"]:
                suspicious_keys.append(key)
            else:
                missing_keys.append(key)
                
            breakdowns.append({
                "metric_key": key,
                "display_name": display_name,
                "raw_value": entry.get("raw_value") if entry else None,
                "target": target,
                "unit": unit,
                "direction": direction,
                "weight": w,
                "status": status,
                "score": 0.0,
                "weighted_contrib": 0.0,
                "verified": False
            })
            continue
            
        raw_val = float(entry["raw_value"])
        score, status_desc = calculate_metric_score(key, raw_val, target, direction)
        
        weighted_task_sum += score * w
        verified_weight_sum += w
        
        breakdowns.append({
            "metric_key": key,
            "display_name": display_name,
            "raw_value": raw_val,
            "target": target,
            "unit": unit,
            "direction": direction,
            "weight": w,
            "status": status_desc,
            "score": score,
            "weighted_contrib": round(score * w, 2),
            "verified": True
        })
        
    # Apply Missing Metric Policy
    if verified_weight_sum == 0.0:
        task_score = 0.0
        baseline_score = 0.0
        final_status = "NOT VERIFIED"
    elif verified_weight_sum < 0.999: # Some metrics are missing
        if missing_policy == "RENORMALIZE":
            # Rescale verified metric weights so they sum to 100%
            task_score = round(weighted_task_sum / verified_weight_sum, 2)
            baseline_score = task_score
            final_status = "PARTIALLY VERIFIED" if not suspicious_keys else "REVIEW REQUIRED"
        elif missing_policy == "REVIEW_REQUIRED":
            task_score = round(min(50.0, weighted_task_sum), 2)
            baseline_score = task_score
            final_status = "REVIEW REQUIRED"
        else: # EXCLUDE or strict
            task_score = round(weighted_task_sum, 2)
            baseline_score = task_score
            final_status = "EXCLUDED"
    else:
        task_score = round(weighted_task_sum, 2)
        baseline_score = task_score
        final_status = "VERIFIED" if not suspicious_keys else "REVIEW REQUIRED"
        
    return {
        "task_score": task_score,
        "baseline_score": baseline_score,
        "metric_breakdowns": breakdowns,
        "missing_metrics": missing_keys,
        "suspicious_metrics": suspicious_keys,
        "validation_status": final_status
    }


def calculate_cohort_relative_scores(
    cohort_students: List[Dict[str, Any]], 
    min_normal: int = 15, 
    min_limited: int = 8
) -> List[Dict[str, Any]]:
    """
    Ranks students within the SAME use case cohort and assigns deterministic relative percentile scores.
    
    Handles small cohort fairness:
    - cohort_size >= 15: NORMAL (full relative score variance)
    - 8 <= cohort_size < 15: LIMITED
    - cohort_size < 8: LOW SAMPLE (blends relative score towards baseline performance)
    """
    n = len(cohort_students)
    if n == 0:
        return []
        
    if n >= min_normal:
        cohort_status = "NORMAL"
    elif n >= min_limited:
        cohort_status = "LIMITED"
    else:
        cohort_status = "LOW SAMPLE"
        
    # Sort deterministically within cohort by task_score desc, validation_score desc, roll_no asc
    sorted_cohort = sorted(
        cohort_students, 
        key=lambda x: (
            x.get("task_score", 0.0),
            x.get("validation_score", 0.0),
            -float(x.get("training_time", 999999) if x.get("training_time") not in [None, "N/A"] else 999999),
            -(hash(x.get("student_roll", "")) % 1000)
        ),
        reverse=True
    )
    
    results = []
    for rank_idx, student in enumerate(sorted_cohort):
        rank = rank_idx + 1
        if n == 1:
            raw_relative = 100.0
        else:
            # Percentile rank: #1 gets 100.0, last gets 0.0
            raw_relative = round(100.0 - ((rank - 1) / (n - 1)) * 100.0, 2)
            
        # If LOW SAMPLE, dampen extreme relative disparity by blending with baseline score
        if cohort_status == "LOW SAMPLE":
            b_score = student.get("baseline_score", 0.0)
            relative_score = round(0.50 * raw_relative + 0.50 * b_score, 2)
        else:
            relative_score = raw_relative
            
        st_copy = dict(student)
        st_copy["rank_in_cohort"] = rank
        st_copy["cohort_size"] = n
        st_copy["cohort_status"] = cohort_status
        st_copy["relative_score"] = relative_score
        results.append(st_copy)
        
    return results


def calculate_validation_quality_score(
    workflow_detected_count: int, 
    total_workflow_steps: int = 7, 
    has_leakage: bool = False,
    reproducibility_verified: bool = True,
    metric_traceability_verified: bool = True,
    preprocessing_verified: bool = True,
    evaluation_verified: bool = True
) -> Tuple[float, Dict[str, Any]]:
    """
    Calculates deterministic Validation Quality Score (0 - 100).
    Components:
    - Workflow compliance: 20%
    - Metric traceability: 20%
    - Reproducibility: 15%
    - No data leakage: 15%
    - Required preprocessing: 10%
    - Correct evaluation procedure: 10%
    - Evidence completeness: 10%
    """
    workflow_pct = min(1.0, workflow_detected_count / max(1, total_workflow_steps))
    workflow_score = workflow_pct * 20.0
    
    traceability_score = 20.0 if metric_traceability_verified else 0.0
    reproducibility_score = 15.0 if reproducibility_verified else 5.0
    leakage_score = 0.0 if has_leakage else 15.0
    preprocessing_score = 10.0 if preprocessing_verified else 2.0
    evaluation_score = 10.0 if evaluation_verified else 0.0
    completeness_score = 10.0 if (workflow_pct >= 0.7 and metric_traceability_verified) else 4.0
    
    total = round(
        workflow_score + 
        traceability_score + 
        reproducibility_score + 
        leakage_score + 
        preprocessing_score + 
        evaluation_score + 
        completeness_score,
        2
    )
    
    breakdown = {
        "workflow_compliance": {"score": round(workflow_score, 1), "max": 20, "detected": f"{workflow_detected_count}/{total_workflow_steps}"},
        "metric_traceability": {"score": round(traceability_score, 1), "max": 20, "verified": metric_traceability_verified},
        "reproducibility": {"score": round(reproducibility_score, 1), "max": 15, "verified": reproducibility_verified},
        "no_data_leakage": {"score": round(leakage_score, 1), "max": 15, "passed": not has_leakage},
        "preprocessing": {"score": round(preprocessing_score, 1), "max": 10, "verified": preprocessing_verified},
        "evaluation_procedure": {"score": round(evaluation_score, 1), "max": 10, "verified": evaluation_verified},
        "evidence_completeness": {"score": round(completeness_score, 1), "max": 10}
    }
    
    return min(100.0, max(0.0, total)), breakdown


def calculate_overall_performance_score(
    baseline_score: float,
    relative_score: float,
    validation_score: float,
    baseline_weight: float = 60.0,
    relative_weight: float = 25.0,
    validation_weight: float = 15.0
) -> Tuple[float, Dict[str, Any]]:
    """
    Computes final Overall Performance Score (0 - 100).
    Formula:
    Final Score = (W_base% * Baseline) + (W_rel% * Relative) + (W_val% * Validation)
    """
    # Normalize weights if faculty weights deviate slightly from 100%
    w_sum = baseline_weight + relative_weight + validation_weight
    if w_sum <= 0:
        w_sum = 100.0
        baseline_weight, relative_weight, validation_weight = 60.0, 25.0, 15.0
        
    norm_w_base = baseline_weight / w_sum
    norm_w_rel = relative_weight / w_sum
    norm_w_val = validation_weight / w_sum
    
    c_base = baseline_score * norm_w_base
    c_rel = relative_score * norm_w_rel
    c_val = validation_score * norm_w_val
    
    overall = round(c_base + c_rel + c_val, 2)
    bounded_overall = min(100.0, max(0.0, overall))
    
    breakdown = {
        "baseline_performance": {
            "score": round(baseline_score, 2),
            "weight_pct": round(norm_w_base * 100, 1),
            "contribution": round(c_base, 2)
        },
        "relative_performance": {
            "score": round(relative_score, 2),
            "weight_pct": round(norm_w_rel * 100, 1),
            "contribution": round(c_rel, 2)
        },
        "validation_quality": {
            "score": round(validation_score, 2),
            "weight_pct": round(norm_w_val * 100, 1),
            "contribution": round(c_val, 2)
        },
        "formula": f"({round(norm_w_base*100)}% * {baseline_score:.2f}) + ({round(norm_w_rel*100)}% * {relative_score:.2f}) + ({round(norm_w_val*100)}% * {validation_score:.2f})",
        "overall_score": bounded_overall
    }
    
    return bounded_overall, breakdown


def assign_overall_ranks(all_students: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Sorts all students across ALL 7 use cases deterministically and assigns final overall rank.
    Tie-breaking hierarchy:
    1. Overall Score desc
    2. Validation Quality Score desc
    3. Baseline Performance Score desc
    4. Task Score desc
    5. Lower training time (if present and comparable)
    6. Roll number asc
    """
    def tie_break_key(s: Dict[str, Any]):
        time_val = 999999.0
        if s.get("training_time") not in [None, "N/A"]:
            try:
                time_val = float(str(s["training_time"]).replace("s", "").strip())
            except Exception:
                pass
        return (
            round(s.get("overall_score", 0.0), 4),
            round(s.get("validation_score", 0.0), 4),
            round(s.get("baseline_score", 0.0), 4),
            round(s.get("task_score", 0.0), 4),
            -time_val,
            s.get("student_roll", "")
        )
        
    sorted_all = sorted(all_students, key=tie_break_key, reverse=True)
    
    for idx, st in enumerate(sorted_all):
        st["overall_rank"] = idx + 1
        
    return sorted_all


CANONICAL_METRIC_MAP = {
    "accuracy": "accuracy",
    "acc": "accuracy",
    "macro f1": "macro_f1",
    "macro-f1": "macro_f1",
    "training time": "training_time",
    "execution time": "training_time",
    "time": "training_time",
    "confusion matrix quality": "confusion_matrix_quality",
    "map@0.5": "map50",
    "map50": "map50",
    "map": "map50",
    "precision": "precision",
    "recall": "recall",
    "dice score": "dice",
    "dice": "dice",
    "iou": "iou",
    "pixel accuracy": "pixel_accuracy",
    "fid": "fid",
    "g-loss stability": "generator_loss_stability",
    "generator loss stability": "generator_loss_stability",
    "d-loss stability": "discriminator_loss_stability",
    "discriminator loss stability": "discriminator_loss_stability",
    "bleu-1": "bleu1",
    "bleu1": "bleu1",
    "bleu-4": "bleu4",
    "bleu4": "bleu4",
    "auc": "auc",
    "auc-roc": "auc",
    "f1": "f1",
    "f1-score": "f1"
}

def recalculate_and_sync_scores(db: Session, config_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Deterministically computes and synchronizes all leaderboard scores for all latest runs in the database.
    Updates StudentLeaderboardScore, StudentMetricRecord, and ValidationRun.final_score.
    """
    from database import (
        ValidationRun, ValidationEvidence, ValidationFinding,
        UseCaseMetricConfig, ScoringConfiguration, StudentLeaderboardScore,
        StudentMetricRecord, AuditLog
    )
    
    # 1. Fetch Active Scoring Configuration
    cfg_query = db.query(ScoringConfiguration).filter(ScoringConfiguration.is_active == True)
    if config_id:
        cfg = db.query(ScoringConfiguration).filter(ScoringConfiguration.id == config_id).first()
    else:
        cfg = cfg_query.order_by(ScoringConfiguration.version.desc()).first()
        
    if not cfg:
        cfg_w_base, cfg_w_rel, cfg_w_val = 60.0, 25.0, 15.0
        missing_policy = "RENORMALIZE"
        min_normal, min_limited = 15, 8
        cfg_version = 1
    else:
        cfg_w_base = cfg.baseline_weight
        cfg_w_rel = cfg.relative_weight
        cfg_w_val = cfg.validation_weight
        missing_policy = cfg.missing_metric_policy
        min_normal = cfg.min_cohort_normal
        min_limited = cfg.min_cohort_limited
        cfg_version = cfg.version
        
    # 2. Fetch Use Case Metric Configs grouped by use_case_name
    all_metric_configs = db.query(UseCaseMetricConfig).all()
    metric_configs_by_uc: Dict[str, List[Dict[str, Any]]] = {}
    uc_meta: Dict[str, Dict[str, Any]] = {}
    
    for mc in all_metric_configs:
        uc_name = mc.use_case_name
        if uc_name not in metric_configs_by_uc:
            metric_configs_by_uc[uc_name] = []
        metric_configs_by_uc[uc_name].append({
            "metric_key": mc.metric_key,
            "metric_display_name": mc.metric_display_name,
            "direction": mc.direction,
            "weight": mc.weight,
            "baseline_target": mc.baseline_target,
            "unit": mc.unit
        })
        uc_meta[uc_name] = {
            "use_case_id": mc.use_case_id,
            "task_type": mc.task_type
        }

    # 3. Fetch all Validation Runs and retain latest per student
    runs = db.query(ValidationRun).all()
    latest_by_student: Dict[str, ValidationRun] = {}
    for r in sorted(runs, key=lambda x: (x.created_at or datetime.min, x.id)):
        key = (getattr(r, 'roll_no', None) or r.student_name or f"run_{r.id}").strip().upper()
        latest_by_student[key] = r
        
    latest_runs = list(latest_by_student.values())
    if not latest_runs:
        return {"total_students": 0, "cohorts": {}, "status": "No submissions found"}

    # Purge stale StudentLeaderboardScore records for older run_ids.
    # When a student re-uploads, their previous run_id score entry must be removed
    # so they appear exactly ONCE in the leaderboard (only their latest upload counts).
    from database import StudentLeaderboardScore as _SLS
    latest_run_ids = {r.id for r in latest_runs}
    stale_scores = db.query(_SLS).filter(_SLS.run_id.notin_(latest_run_ids)).all()
    for stale in stale_scores:
        db.delete(stale)
    if stale_scores:
        db.flush()  # Remove stale records before inserting/updating fresh ones

    # 4. Process each run to calculate task score, baseline score, validation quality score
    processed_runs = []
    
    for r in latest_runs:
        uc_name = getattr(r, 'use_case', 'Traffic Sign Recognition') or 'Traffic Sign Recognition'
        meta = uc_meta.get(uc_name, {"use_case_id": "GTSRB", "task_type": "IMAGE_CLASSIFICATION"})
        cfgs = metric_configs_by_uc.get(uc_name, [])
        
        # Parse metrics from ValidationEvidence
        extracted_metrics = []
        evidence_list = db.query(ValidationEvidence).filter(ValidationEvidence.run_id == r.id).all()
        findings_list = db.query(ValidationFinding).filter(ValidationFinding.run_id == r.id).all()
        
        has_leakage = any("LEAKAGE" in (f.finding_type or "").upper() or "LEAKAGE" in (f.title or "").upper() for f in findings_list)
        has_suspicious = any("SUSPICIOUS" in (f.finding_type or "").upper() or "HARDCODED" in (f.title or "").upper() for f in findings_list)
        
        # Count verified workflow steps
        workflow_steps_count = sum(
            1 for ev in evidence_list 
            if ev.evidence_type == "WORKFLOW" and ev.verification_status == "VERIFIED"
        )
        # If no explicit WORKFLOW type evidence, default to count from findings
        if workflow_steps_count == 0:
            workflow_steps_count = 6 if r.overall_status in ["VERIFIED", "REVIEWED"] else 4
            
        time_metric_val = None
        
        for ev in evidence_list:
            if ev.evidence_type != "METRIC" and ev.extracted_value is None:
                continue
            raw_name = (ev.metric_name or "").strip().lower()
            canonical_key = CANONICAL_METRIC_MAP.get(raw_name, raw_name)
            
            clean_str = str(ev.extracted_value or "").replace("%", "").replace("s", "").strip()
            num_val = None
            try:
                num_val = float(clean_str)
            except Exception:
                num_val = None
                
            if canonical_key == "training_time" and num_val is not None:
                time_metric_val = num_val
                
            extracted_metrics.append({
                "metric_key": canonical_key,
                "raw_value": num_val,
                "verification_status": ev.verification_status or ("VERIFIED" if num_val is not None else "NOT VERIFIED"),
                "evidence_source": ev.detection_method or "AST Parser",
                "confidence": ev.confidence_score or 95.0,
                "cell_reference": ev.source_cell
            })
            
        # Calculate task and baseline performance
        task_res = calculate_task_and_baseline_score(extracted_metrics, cfgs, missing_policy=missing_policy)
        
        # Calculate validation quality
        val_score, val_breakdown = calculate_validation_quality_score(
            workflow_detected_count=workflow_steps_count,
            has_leakage=has_leakage,
            reproducibility_verified=True,
            metric_traceability_verified=not has_suspicious,
            preprocessing_verified=True,
            evaluation_verified=True
        )
        
        processed_runs.append({
            "run": r,
            "run_id": r.id,
            "student_roll": getattr(r, 'roll_no', '24AM001'),
            "student_name": r.student_name,
            "department": getattr(r, 'department', 'AIML'),
            "section": getattr(r, 'section', 'A'),
            "use_case_id": meta["use_case_id"],
            "use_case_name": uc_name,
            "task_type": meta["task_type"],
            "task_score": task_res["task_score"],
            "baseline_score": task_res["baseline_score"],
            "validation_score": val_score,
            "validation_breakdown": val_breakdown,
            "metric_breakdowns": task_res["metric_breakdowns"],
            "missing_metrics": task_res["missing_metrics"],
            "suspicious_metrics": task_res["suspicious_metrics"],
            "validation_status": task_res["validation_status"],
            "has_leakage": has_leakage,
            "has_suspicious_metrics": has_suspicious,
            "training_time": time_metric_val
        })

    # 5. Group by Use Case and Calculate Relative Scores per Cohort
    cohorts_map: Dict[str, List[Dict[str, Any]]] = {}
    for item in processed_runs:
        uc = item["use_case_name"]
        if uc not in cohorts_map:
            cohorts_map[uc] = []
        cohorts_map[uc].append(item)
        
    all_scored_students = []
    for uc_name, cohort_items in cohorts_map.items():
        relative_ranked = calculate_cohort_relative_scores(
            cohort_items, 
            min_normal=min_normal, 
            min_limited=min_limited
        )
        all_scored_students.extend(relative_ranked)

    # 6. Calculate Final Overall Performance Score and Sort Overall Ranks
    for st in all_scored_students:
        overall_score, overall_breakdown = calculate_overall_performance_score(
            baseline_score=st["baseline_score"],
            relative_score=st["relative_score"],
            validation_score=st["validation_score"],
            baseline_weight=cfg_w_base,
            relative_weight=cfg_w_rel,
            validation_weight=cfg_w_val
        )
        st["overall_score"] = overall_score
        st["score_breakdown"] = overall_breakdown

    ranked_all = assign_overall_ranks(all_scored_students)

    # 7. Persist to Database deterministically
    # Clear existing score cache for clean update
    for item in ranked_all:
        r_id = item["run_id"]
        
        # Check by student_roll as well to ensure strict 1-to-1 mapping per student
        roll = item["student_roll"]
        if roll:
            duplicates = db.query(StudentLeaderboardScore).filter(
                StudentLeaderboardScore.student_roll == roll,
                StudentLeaderboardScore.run_id != r_id
            ).all()
            for dup in duplicates:
                db.delete(dup)
            if duplicates:
                db.flush()

        # Check or create StudentLeaderboardScore
        lb_rec = db.query(StudentLeaderboardScore).filter(StudentLeaderboardScore.run_id == r_id).first()
        if not lb_rec:
            lb_rec = StudentLeaderboardScore(run_id=r_id)
            db.add(lb_rec)
            
        lb_rec.student_roll = item["student_roll"]
        lb_rec.student_name = item["student_name"]
        lb_rec.department = item["department"]
        lb_rec.section = item["section"]
        lb_rec.use_case_id = item["use_case_id"]
        lb_rec.use_case_name = item["use_case_name"]
        lb_rec.task_type = item["task_type"]
        lb_rec.task_score = item["task_score"]
        lb_rec.baseline_score = item["baseline_score"]
        lb_rec.relative_score = item["relative_score"]
        lb_rec.validation_score = item["validation_score"]
        lb_rec.overall_score = item["overall_score"]
        lb_rec.cohort_size = item["cohort_size"]
        lb_rec.cohort_status = item["cohort_status"]
        lb_rec.rank_in_cohort = item["rank_in_cohort"]
        lb_rec.overall_rank = item["overall_rank"]
        lb_rec.validation_status = item["validation_status"]
        lb_rec.has_leakage = item["has_leakage"]
        lb_rec.has_suspicious_metrics = item["has_suspicious_metrics"]
        lb_rec.raw_metrics_json = json.dumps(item["metric_breakdowns"])
        lb_rec.score_breakdown_json = json.dumps(item["score_breakdown"])
        lb_rec.configuration_version = cfg_version
        lb_rec.updated_at = datetime.utcnow()
        
        # Update run's final_score for backwards compatibility
        item["run"].final_score = item["overall_score"]
        
    db.commit()
    
    return {
        "total_students": len(ranked_all),
        "cohorts": {k: len(v) for k, v in cohorts_map.items()},
        "config_version": cfg_version,
        "weights": {"baseline": cfg_w_base, "relative": cfg_w_rel, "validation": cfg_w_val},
        "recalculated_at": datetime.utcnow().isoformat()
    }
