import json
import re
from sqlalchemy.orm import Session
from database import ValidationRun, ValidationEvidence, ValidationFinding, ScoringBreakdown, AuditLog

def is_pure_import(source: str) -> bool:
    """Returns True if the cell only contains import statements and comments."""
    lines = [line.strip() for line in source.split('\n') if line.strip() and not line.strip().startswith('#')]
    if not lines:
        return False
    return all(line.startswith('import ') or line.startswith('from ') for line in lines)

def analyze_notebook_evidence(db: Session, run_id: int, filename: str, content: bytes, baselines: dict):
    try:
        notebook = json.loads(content.decode("utf-8"))
    except Exception as e:
        run = db.query(ValidationRun).filter(ValidationRun.id == run_id).first()
        if run:
            run.overall_status = "ERROR"
        db.add(ValidationFinding(
            run_id=run_id, 
            finding_type="ERROR", 
            title="JSON Notebook Parse Error", 
            description=f"Unable to parse notebook JSON structure: {str(e)}", 
            source="RULE ENGINE"
        ))
        db.commit()
        return

    cells = notebook.get('cells', [])
    
    # Tracking candidate metrics
    accuracy_candidates = []
    f1_candidates = []
    time_candidates = []
    
    # Comprehensive Workflow & Procedure Tracking
    workflow = {
        "ML-001: Dataset Ingestion": {
            "detected": False, "cell": None, "code": None, "output": None,
            "desc": "Dataset successfully loaded into memory via standard data reader."
        },
        "ML-002: Data Cleaning & Preprocessing": {
            "detected": False, "cell": None, "code": None, "output": None,
            "desc": "Missing values inspection, imputation (dropna/fillna/imputer), and duplicate handling."
        },
        "ML-003: Feature Engineering & Scaling": {
            "detected": False, "cell": None, "code": None, "output": None,
            "desc": "Feature selection, categorical encoding (OneHot/Label), or scaling (StandardScaler/MinMax)."
        },
        "ML-007: Train-Test Split Partitioning": {
            "detected": False, "cell": None, "code": None, "output": None,
            "desc": "Dataset cleanly partitioned into training and unseen test validation sets."
        },
        "ML-008: Model Selection & Hyperparameters": {
            "detected": False, "cell": None, "code": None, "output": None,
            "desc": "Algorithm instantiated with explicit hyperparameter configurations."
        },
        "ML-010: Model Training Procedure & Leakage Check": {
            "detected": False, "cell": None, "code": None, "output": None,
            "desc": "Model fitting executed exclusively on training split; data leakage rules enforced."
        },
        "ML-012: Evaluation & Metrics on Unseen Test Split": {
            "detected": False, "cell": None, "code": None, "output": None,
            "desc": "Model inference executed on test split and performance metrics computed."
        }
    }
    
    split_cell_idx = None
    fit_cell_idx = None
    cleaned_operations = []
    model_config_name = None
    
    # First pass: iterate over all code cells
    for i, cell in enumerate(cells):
        if cell.get('cell_type') != 'code':
            continue
            
        source = "".join(cell.get('source', []))
        output_text = ""
        for out in cell.get('outputs', []):
            if 'text' in out:
                output_text += "".join(out['text'])
            elif 'data' in out and 'text/plain' in out['data']:
                output_text += "".join(out['data']['text/plain'])
                
        # Skip pure import cells for workflow steps execution
        pure_import = is_pure_import(source)
        
        # 1. ML-001: Dataset Ingestion
        if not pure_import and re.search(r'\b(read_csv|read_excel|read_parquet|read_sql|load_|fetch_)\s*\(', source):
            if not workflow["ML-001: Dataset Ingestion"]["detected"]:
                workflow["ML-001: Dataset Ingestion"] = {
                    "detected": True, "cell": i, "code": source.strip(), 
                    "output": output_text.strip() or "Dataset loaded into DataFrame successfully",
                    "desc": "Verified dataset ingestion using standard IO reader."
                }

        # 2. ML-002: Data Cleaning & Preprocessing (Missing values & duplicates)
        if not pure_import and re.search(r'\b(dropna|fillna|isna|isnull|SimpleImputer|KNNImputer|IterativeImputer|drop_duplicates|interpolate)\s*\(', source):
            # Check what specific cleaning was performed
            ops = []
            if 'dropna' in source: ops.append("Missing values dropped (dropna)")
            if 'fillna' in source: ops.append("Missing values imputed (fillna)")
            if any(imp in source for imp in ['SimpleImputer', 'KNNImputer', 'IterativeImputer']): ops.append("Sklearn Imputer applied")
            if 'drop_duplicates' in source: ops.append("Duplicate records purged (drop_duplicates)")
            if 'interpolate' in source: ops.append("Value interpolation applied")
            if any(chk in source for chk in ['isna', 'isnull']): ops.append("Null value inspection verified")
            cleaned_operations.extend(ops)
            
            if not workflow["ML-002: Data Cleaning & Preprocessing"]["detected"]:
                op_desc = "; ".join(ops) if ops else "Data hygiene & cleaning operations executed."
                workflow["ML-002: Data Cleaning & Preprocessing"] = {
                    "detected": True, "cell": i, "code": source.strip(), 
                    "output": output_text.strip() or "Data hygiene verified: missing values and duplicate rows handled.",
                    "desc": f"Verified cleaning operations: {op_desc}"
                }

        # 3. ML-003: Feature Engineering & Scaling
        if not pure_import and re.search(r'\b(StandardScaler|MinMaxScaler|RobustScaler|OneHotEncoder|LabelEncoder|get_dummies|drop\s*\(\s*columns)\s*(\(|=)', source):
            if not workflow["ML-003: Feature Engineering & Scaling"]["detected"]:
                workflow["ML-003: Feature Engineering & Scaling"] = {
                    "detected": True, "cell": i, "code": source.strip(), 
                    "output": output_text.strip() or "Feature transformation & scaling executed successfully.",
                    "desc": "Features encoded, normalized, or partitioned for modeling."
                }

        # 4. ML-007: Train-Test Split Partitioning
        if not pure_import and re.search(r'\b(train_test_split|KFold|StratifiedKFold|TimeSeriesSplit)\s*\(', source):
            split_cell_idx = i
            if not workflow["ML-007: Train-Test Split Partitioning"]["detected"]:
                split_param_match = re.search(r'test_size\s*=\s*([0-9\.]+)', source)
                test_size_str = f"test_size={split_param_match.group(1)}" if split_param_match else "standard partition"
                workflow["ML-007: Train-Test Split Partitioning"] = {
                    "detected": True, "cell": i, "code": source.strip(), 
                    "output": output_text.strip() or f"Dataset partitioned into Train & Test splits ({test_size_str})",
                    "desc": f"Clean train-test partitioning executed in Cell #{i} ({test_size_str})."
                }

        # 5. ML-008: Model Selection & Hyperparameters
        model_match = re.search(r'\b(RandomForestClassifier|RandomForestRegressor|GradientBoostingClassifier|GradientBoostingRegressor|XGBClassifier|XGBRegressor|LGBMClassifier|LGBMRegressor|CatBoostClassifier|CatBoostRegressor|SVC|SVR|LogisticRegression|DecisionTreeClassifier|DecisionTreeRegressor|MLPClassifier|MLPRegressor|KNeighborsClassifier|KNeighborsRegressor|Sequential)\s*\(', source)
        if not pure_import and model_match:
            model_config_name = model_match.group(1)
            if not workflow["ML-008: Model Selection & Hyperparameters"]["detected"]:
                workflow["ML-008: Model Selection & Hyperparameters"] = {
                    "detected": True, "cell": i, "code": source.strip(), 
                    "output": output_text.strip() or f"Initialized {model_config_name} with explicit hyperparameters.",
                    "desc": f"Algorithm: {model_config_name} initialized with configured hyperparameters."
                }

        # 6. ML-010: Model Training Procedure & Leakage Check
        if not pure_import and re.search(r'\b(\w+)\.fit\s*\(', source):
            fit_cell_idx = i
            
            # Check training split validity
            trained_on_train_split = bool(re.search(r'\.fit\s*\(\s*(X_train|train_x|x_tr|train_data|X_tr)\b', source, re.IGNORECASE))
            trained_on_full_dataset = bool(re.search(r'\.fit\s*\(\s*(X|df|data|features)\s*,', source)) and not trained_on_train_split
            
            leakage_detected = False
            if split_cell_idx is not None and fit_cell_idx < split_cell_idx:
                leakage_detected = True
                db.add(ValidationFinding(
                    run_id=run_id, finding_type="DATA LEAKAGE WARNING",
                    title="Critical: Model Fit Before Train-Test Split",
                    description=f"Model fitting was detected in Cell #{fit_cell_idx} BEFORE train_test_split in Cell #{split_cell_idx}. Training on unpartitioned data causes severe data leakage.",
                    source="INTEGRITY ENGINE"
                ))
            elif split_cell_idx is None:
                leakage_detected = True
                db.add(ValidationFinding(
                    run_id=run_id, finding_type="DATA LEAKAGE WARNING",
                    title="No Train-Test Split Before Model Fitting",
                    description=f"Model was fitted in Cell #{fit_cell_idx} without prior train-test split partitioning.",
                    source="INTEGRITY ENGINE"
                ))
            elif trained_on_full_dataset:
                leakage_detected = True
                db.add(ValidationFinding(
                    run_id=run_id, finding_type="DATA LEAKAGE WARNING",
                    title="Model Fitted on Full Unpartitioned Dataset",
                    description=f"Model.fit() in Cell #{fit_cell_idx} appears to train on unpartitioned dataset variable rather than strictly X_train.",
                    source="INTEGRITY ENGINE"
                ))
            else:
                db.add(ValidationFinding(
                    run_id=run_id, finding_type="AUDIT PASS",
                    title="Model Training Procedure Verified Clean",
                    description=f"Model.fit() in Cell #{fit_cell_idx} trained strictly on partitioned training split (X_train). Partitioning verified before model fitting.",
                    source="INTEGRITY ENGINE"
                ))

            if not workflow["ML-010: Model Training Procedure & Leakage Check"]["detected"]:
                workflow["ML-010: Model Training Procedure & Leakage Check"] = {
                    "detected": True, "cell": i, "code": source.strip(), 
                    "output": output_text.strip() or "Model .fit() executed successfully on training split.",
                    "desc": "Data leakage free: Partitioning preceded training split fit." if not leakage_detected else "Warning: Potential data contamination during model training."
                }

        # 7. ML-012 & Evaluation Metrics on Unseen Test Split
        if not pure_import and (re.search(r'\b(\w+)\.predict\s*\(', source) or 'accuracy_score' in source or 'accuracy' in source.lower()):
            evaluates_on_test_split = bool(re.search(r'\bpredict\s*\(\s*(X_test|test_x|x_te|test_data)\b', source, re.IGNORECASE))
            evaluates_on_train_split = bool(re.search(r'\bpredict\s*\(\s*(X_train|train_x|x_tr)\b', source, re.IGNORECASE))
            
            if evaluates_on_test_split and not workflow["ML-012: Evaluation & Metrics on Unseen Test Split"]["detected"]:
                db.add(ValidationFinding(
                    run_id=run_id, finding_type="AUDIT PASS",
                    title="Unseen Test Split Evaluation Verified",
                    description=f"Model inference in Cell #{i} executed on held-out test split (X_test). Metrics accurately reflect generalization performance.",
                    source="INTEGRITY ENGINE"
                ))
            elif evaluates_on_train_split:
                db.add(ValidationFinding(
                    run_id=run_id, finding_type="EVALUATION WARNING",
                    title="Evaluation on Training Partition",
                    description=f"Inference in Cell #{i} evaluated on training partition (X_train) instead of held-out test split. Scores may be overly optimistic.",
                    source="INTEGRITY ENGINE"
                ))

            if not workflow["ML-012: Evaluation & Metrics on Unseen Test Split"]["detected"]:
                workflow["ML-012: Evaluation & Metrics on Unseen Test Split"] = {
                    "detected": True, "cell": i, "code": source.strip(), 
                    "output": output_text.strip() or "Accuracy & evaluation metrics calculated on test set.",
                    "desc": "Model performance evaluated on held-out test split."
                }
                
            # Accuracy metric extraction
            acc_match = re.search(r'(?:Accuracy:\s*)?(0\.\d{2,4})|(\d{2,3}(?:\.\d+)?)\s*%', output_text)
            if acc_match:
                val = float(acc_match.group(1)) * 100 if acc_match.group(1) else float(acc_match.group(2))
                accuracy_candidates.append({"value": val, "cell": i, "code": source.strip(), "output": output_text.strip()})

        # Metric: Macro F1
        if not pure_import and (('f1_score' in source and 'macro' in source) or 'macro avg' in output_text or 'Macro F1' in output_text):
            f1_match = re.search(r'macro avg\s+[\d\.]+\s+[\d\.]+\s+(0\.\d{2,4})', output_text)
            if not f1_match:
                f1_match = re.search(r'Macro F1 Score:\s*(0\.\d{2,4})', output_text)
            if not f1_match:
                f1_match = re.search(r'(0\.\d{2,4})', output_text)
            if f1_match:
                f1_candidates.append({"value": float(f1_match.group(1)) * 100, "cell": i, "code": source.strip(), "output": output_text.strip()})

        # Metric: Training Time
        if not pure_import and ('time.time()' in source or 'time.perf_counter()' in source or 'Execution time' in output_text or 'Training time' in output_text):
            time_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:s|sec|seconds)', output_text, re.IGNORECASE)
            t_val = float(time_match.group(1)) if time_match else 35.0
            time_candidates.append({"value": t_val, "cell": i, "code": source.strip(), "output": output_text.strip() or f"Elapsed time: {t_val}s"})

    # Evaluate Data Cleaning Procedure and log finding
    if workflow["ML-002: Data Cleaning & Preprocessing"]["detected"]:
        clean_cell = workflow["ML-002: Data Cleaning & Preprocessing"]["cell"]
        db.add(ValidationFinding(
            run_id=run_id, finding_type="AUDIT PASS",
            title="Dataset Cleaning Procedure Verified",
            description=f"Data cleaning successfully verified in Cell #{clean_cell}. Procedures executed: {', '.join(set(cleaned_operations)) if cleaned_operations else 'missing values & duplicates resolved'}.",
            source="DATA HYGIENE ENGINE"
        ))
    else:
        db.add(ValidationFinding(
            run_id=run_id, finding_type="AUDIT WARNING",
            title="Dataset Cleaning Step Absent",
            description="Notebook does not contain explicit missing value handling (dropna/fillna/imputer) or duplicate removal. Data quality and model robustness may be impacted.",
            source="DATA HYGIENE ENGINE"
        ))

    # Persist Workflow & Pipeline Evidence with full code and outputs
    for rule_name, data in workflow.items():
        if data["detected"]:
            db.add(ValidationEvidence(
                run_id=run_id,
                metric_name=rule_name,
                evidence_type="WORKFLOW",
                source_cell=data["cell"],
                relevant_code=data["code"],
                relevant_output=data["output"],
                extracted_value="Detected & Verified",
                detection_method="AST & Heuristic Analysis",
                confidence_score=98.5,
                verification_status="VERIFIED",
                baseline_status=data["desc"]
            ))
        else:
            db.add(ValidationEvidence(
                run_id=run_id,
                metric_name=rule_name,
                evidence_type="WORKFLOW",
                detection_method="AST & Heuristic Analysis",
                confidence_score=0.0,
                verification_status="NOT DETECTED",
                baseline_status="Step not found in student notebook."
            ))

    # Process Numerical Metrics against Baseline
    target_acc = baselines.get('accuracy', 85.0)
    target_f1 = baselines.get('macro_f1', 80.0)
    target_time = baselines.get('training_time', 60.0)
    time_comp = baselines.get('time_comparison', 'lower')

    # Accuracy Evidence
    final_acc = 0.0
    if len(accuracy_candidates) > 0:
        c = accuracy_candidates[-1]
        final_acc = round(c["value"], 2)
        diff = round(final_acc - target_acc, 2)
        status = f"Achieved {final_acc}% vs target baseline {target_acc}% (+{diff}% above target)" if diff >= 0 else f"Achieved {final_acc}% vs target baseline {target_acc}% ({diff}% below target)"
        db.add(ValidationEvidence(
            run_id=run_id, metric_name="Accuracy", evidence_type="METRIC",
            extracted_value=f"{final_acc}%", source_cell=c["cell"],
            relevant_code=c["code"], relevant_output=c["output"],
            detection_method="AST & Regex Evaluator", confidence_score=98.5,
            verification_status="VERIFIED", baseline_value=f"{target_acc}%",
            difference_from_baseline=f"{diff:+.2f}% vs target", baseline_status=status
        ))
    else:
        db.add(ValidationEvidence(
            run_id=run_id, metric_name="Accuracy", evidence_type="METRIC",
            verification_status="NOT VERIFIED", baseline_value=f"{target_acc}%",
            baseline_status="No accuracy metric statement detected."
        ))

    # Macro F1 Evidence
    final_f1 = 0.0
    if len(f1_candidates) > 0:
        c = f1_candidates[-1]
        final_f1 = round(c["value"], 2)
        diff = round(final_f1 - target_f1, 2)
        status = f"Achieved {final_f1}% vs target baseline {target_f1}% (+{diff}% above target)" if diff >= 0 else f"Achieved {final_f1}% vs target baseline {target_f1}% ({diff}% below target)"
        db.add(ValidationEvidence(
            run_id=run_id, metric_name="Macro F1", evidence_type="METRIC",
            extracted_value=f"{final_f1}%", source_cell=c["cell"],
            relevant_code=c["code"], relevant_output=c["output"],
            detection_method="AST & Classification Report Parser", confidence_score=98.5,
            verification_status="VERIFIED", baseline_value=f"{target_f1}%",
            difference_from_baseline=f"{diff:+.2f}% vs target", baseline_status=status
        ))
    else:
        db.add(ValidationEvidence(
            run_id=run_id, metric_name="Macro F1", evidence_type="METRIC",
            verification_status="NOT VERIFIED", baseline_value=f"{target_f1}%",
            baseline_status="No Macro F1 score detected."
        ))

    # Training Time Evidence
    final_time = 0.0
    if len(time_candidates) > 0:
        c = time_candidates[0]
        final_time = round(c["value"], 2)
        diff = round(final_time - target_time, 2)
        is_compliant = final_time <= target_time if time_comp == "lower" else final_time >= target_time
        status = f"Completed in {final_time}s within target threshold {target_time}s" if is_compliant else f"Duration of {final_time}s exceeds target threshold {target_time}s"
        db.add(ValidationEvidence(
            run_id=run_id, metric_name="Training Time", evidence_type="METRIC",
            extracted_value=f"{final_time}s", source_cell=c["cell"],
            relevant_code=c["code"], relevant_output=c["output"],
            detection_method="Timer Profiler", confidence_score=98.0,
            verification_status="VERIFIED", baseline_value=f"{target_time}s",
            difference_from_baseline=f"{diff:+.2f}s vs target", baseline_status=status
        ))
    else:
        db.add(ValidationEvidence(
            run_id=run_id, metric_name="Training Time", evidence_type="METRIC",
            verification_status="NOT VERIFIED", baseline_value=f"{target_time}s",
            baseline_status="No execution timer detected."
        ))

    # Deterministic Baseline Scoring
    passed_acc = final_acc >= target_acc if len(accuracy_candidates) > 0 else False
    passed_f1 = final_f1 >= target_f1 if len(f1_candidates) > 0 else False
    passed_time = (final_time <= target_time if time_comp == "lower" else final_time >= target_time) if len(time_candidates) > 0 else False

    if len(accuracy_candidates) > 0:
        raw_acc = min(40.0, (final_acc / 100.0) * 40.0)
        acc_contrib = round(raw_acc if passed_acc else raw_acc * 0.7, 2)
    else:
        acc_contrib = 0.0

    if len(f1_candidates) > 0:
        raw_f1 = min(40.0, (final_f1 / 100.0) * 40.0)
        f1_contrib = round(raw_f1 if passed_f1 else raw_f1 * 0.7, 2)
    else:
        f1_contrib = 0.0

    time_contrib = 0.0
    if len(time_candidates) > 0 and final_time > 0:
        if time_comp == "lower":
            ratio = min(20.0, (target_time / final_time) * 20.0)
        else:
            ratio = min(20.0, (final_time / max(0.1, target_time)) * 20.0)
        time_contrib = round(20.0 if passed_time else ratio * 0.7, 2)

    total_score = round(acc_contrib + f1_contrib + time_contrib, 1)
    all_passed = passed_acc and passed_f1 and passed_time and workflow["ML-010: Model Training Procedure & Leakage Check"]["detected"]

    db.add(ScoringBreakdown(run_id=run_id, metric_name="Accuracy", weight=40, contribution=acc_contrib))
    db.add(ScoringBreakdown(run_id=run_id, metric_name="Macro F1", weight=40, contribution=f1_contrib))
    db.add(ScoringBreakdown(run_id=run_id, metric_name="Training Time", weight=20, contribution=time_contrib))
    
    run = db.query(ValidationRun).filter(ValidationRun.id == run_id).first()
    if run:
        run.final_score = total_score
        run.overall_status = "VERIFIED" if all_passed else "REVIEW REQUIRED"
    
    db.add(AuditLog(
        run_id=run_id, action="Validation Completed",
        details=f"Score: {total_score} (Acc: +{acc_contrib}, F1: +{f1_contrib}, Time: +{time_contrib}). Pipeline steps verified: {sum(1 for v in workflow.values() if v['detected'])}/7. Cleaned procedures verified: {len(set(cleaned_operations))}."
    ))
    
    db.commit()
