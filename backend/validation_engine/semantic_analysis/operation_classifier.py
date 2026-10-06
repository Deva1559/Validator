"""
Semantic ML Operation Classifier.
Maps AST calls, assignments, and syntax structures into canonical ML concepts
without relying on strict keyword names or specific variable naming conventions.
"""

from typing import Dict, List, Any, Optional, Set, Tuple
from ..static_analysis.ast_analyzer import CellASTAnalysis, ASTCall, ASTAssignment

ML_OPERATIONS = [
    "DATA_LOADING",
    "DATA_CLEANING",
    "MISSING_VALUE_HANDLING",
    "FEATURE_SCALING",
    "ENCODING",
    "TRAIN_TEST_SPLIT",
    "MODEL_INITIALIZATION",
    "MODEL_TRAINING",
    "PREDICTION",
    "METRIC_COMPUTATION",
    "TRAINING_TIME"
]

class DetectedOperation:
    def __init__(
        self,
        op_type: str,
        cell_index: int,
        line_no: int,
        confidence: float,
        detection_method: str, # 'AST_CALL', 'AST_ASSIGNMENT', 'AST_LOOP', 'SEMANTIC_PATTERN'
        details: Dict[str, Any],
        raw_code: str
    ):
        self.op_type = op_type
        self.cell_index = cell_index
        self.line_no = line_no
        self.confidence = confidence
        self.detection_method = detection_method
        self.details = details
        self.raw_code = raw_code

    def to_dict(self) -> Dict[str, Any]:
        return {
            "op_type": self.op_type,
            "cell_index": self.cell_index,
            "line_no": self.line_no,
            "confidence": self.confidence,
            "detection_method": self.detection_method,
            "details": self.details,
            "raw_code": self.raw_code
        }

KNOWN_LOAD_FUNCS = {
    "read_csv", "read_excel", "read_parquet", "read_sql", "read_table", "read_json",
    "load_iris", "load_digits", "load_breast_cancer", "load_wine", "fetch_openml",
    "load_data", "ImageFolder", "image_dataset_from_directory"
}

KNOWN_CLEAN_CALLS = {
    "dropna", "fillna", "drop_duplicates", "interpolate", "replace",
    "isna", "isnull", "notnull", "SimpleImputer", "KNNImputer", "IterativeImputer"
}

KNOWN_SCALERS = {
    "StandardScaler", "MinMaxScaler", "RobustScaler", "Normalizer", "MaxAbsScaler"
}

KNOWN_ENCODERS = {
    "OneHotEncoder", "LabelEncoder", "OrdinalEncoder", "get_dummies"
}

KNOWN_SPLIT_FUNCS = {
    "train_test_split", "KFold", "StratifiedKFold", "ShuffleSplit",
    "StratifiedShuffleSplit", "TimeSeriesSplit", "random_split"
}

KNOWN_METRIC_FUNCS = {
    "accuracy_score", "f1_score", "precision_score", "recall_score",
    "classification_report", "confusion_matrix", "roc_auc_score",
    "mean_squared_error", "mean_absolute_error", "r2_score",
    "jaccard_score", "dice_score", "sentence_bleu", "corpus_bleu", "calculate_fid"
}

def classify_cell_operations(ast_analysis: CellASTAnalysis, raw_source: str) -> List[DetectedOperation]:
    """Inspects AST calls, assignments, and loops in a cell to detect ML operations."""
    ops: List[DetectedOperation] = []

    # 1. Inspect function calls
    for call in ast_analysis.calls:
        fname = call.func_name
        caller = call.caller or ""

        # Data Loading
        if fname in KNOWN_LOAD_FUNCS or fname.startswith("read_") or fname.startswith("load_"):
            ops.append(DetectedOperation(
                op_type="DATA_LOADING",
                cell_index=ast_analysis.cell_index,
                line_no=call.line_no,
                confidence=99.0,
                detection_method="AST_CALL",
                details={"function": fname, "caller": caller, "args": call.args},
                raw_code=call.full_call_str
            ))

        # Data Cleaning & Missing Values
        if fname in KNOWN_CLEAN_CALLS or fname in ["dropna", "fillna", "drop_duplicates"]:
            ops.append(DetectedOperation(
                op_type="DATA_CLEANING",
                cell_index=ast_analysis.cell_index,
                line_no=call.line_no,
                confidence=95.0,
                detection_method="AST_CALL",
                details={"function": fname, "caller": caller},
                raw_code=call.full_call_str
            ))

        # Feature Scaling & Preprocessing
        if fname in KNOWN_SCALERS or fname in ["fit_transform", "transform"] and any(s.lower() in caller.lower() for s in ["scaler", "std", "norm", "minmax"]):
            ops.append(DetectedOperation(
                op_type="FEATURE_SCALING",
                cell_index=ast_analysis.cell_index,
                line_no=call.line_no,
                confidence=96.0,
                detection_method="AST_CALL",
                details={"function": fname, "caller": caller, "args": call.args},
                raw_code=call.full_call_str
            ))

        # Categorical Encoding
        if fname in KNOWN_ENCODERS or fname == "get_dummies":
            ops.append(DetectedOperation(
                op_type="ENCODING",
                cell_index=ast_analysis.cell_index,
                line_no=call.line_no,
                confidence=96.0,
                detection_method="AST_CALL",
                details={"function": fname, "caller": caller},
                raw_code=call.full_call_str
            ))

        # Train-Test Split (Standard sklearn or framework splitter)
        if fname in KNOWN_SPLIT_FUNCS:
            ops.append(DetectedOperation(
                op_type="TRAIN_TEST_SPLIT",
                cell_index=ast_analysis.cell_index,
                line_no=call.line_no,
                confidence=99.0,
                detection_method="AST_CALL",
                details={"function": fname, "kwargs": call.kwargs, "args": call.args},
                raw_code=call.full_call_str
            ))

        # Model Training (fit called on ANY model/classifier instance)
        if fname == "fit":
            ops.append(DetectedOperation(
                op_type="MODEL_TRAINING",
                cell_index=ast_analysis.cell_index,
                line_no=call.line_no,
                confidence=98.0,
                detection_method="AST_CALL",
                details={"method": "fit", "model_var": caller, "train_args": call.args},
                raw_code=f"{caller}.fit({', '.join(call.args)})"
            ))

        # Prediction (predict or predict_proba on ANY instance)
        if fname in ["predict", "predict_proba", "predict_classes"]:
            ops.append(DetectedOperation(
                op_type="PREDICTION",
                cell_index=ast_analysis.cell_index,
                line_no=call.line_no,
                confidence=98.0,
                detection_method="AST_CALL",
                details={"method": fname, "model_var": caller, "input_features": call.args},
                raw_code=f"{caller}.{fname}({', '.join(call.args)})"
            ))

        # Metrics & Evaluation
        if fname in KNOWN_METRIC_FUNCS:
            ops.append(DetectedOperation(
                op_type="METRIC_COMPUTATION",
                cell_index=ast_analysis.cell_index,
                line_no=call.line_no,
                confidence=99.0,
                detection_method="AST_CALL",
                details={"metric_func": fname, "args": call.args, "kwargs": call.kwargs},
                raw_code=f"{fname}({', '.join(call.args)})"
            ))

        # Training Time via time.time() or time.perf_counter()
        if fname in ["time", "perf_counter", "process_time"]:
            ops.append(DetectedOperation(
                op_type="TRAINING_TIME",
                cell_index=ast_analysis.cell_index,
                line_no=call.line_no,
                confidence=95.0,
                detection_method="AST_CALL",
                details={"timer_func": f"{caller}.{fname}"},
                raw_code=f"{caller}.{fname}()"
            ))

    # 2. Inspect manual slicing for TRAIN_TEST_SPLIT (e.g. X_train = X[:split], X_test = X[split:])
    slice_assignments = [
        a for a in ast_analysis.assignments 
        if "[" in a.value_str and ":" in a.value_str
    ]
    if len(slice_assignments) >= 2:
        # Detected manual train/test partition via slicing
        split_vars = [t for a in slice_assignments for t in a.targets]
        ops.append(DetectedOperation(
            op_type="TRAIN_TEST_SPLIT",
            cell_index=ast_analysis.cell_index,
            line_no=slice_assignments[0].line_no,
            confidence=92.0,
            detection_method="AST_ASSIGNMENT",
            details={"type": "MANUAL_SLICING", "partition_variables": split_vars},
            raw_code=f"{split_vars[0]} = {slice_assignments[0].value_str}"
        ))

    # 3. Inspect manual accuracy computation (e.g. np.mean(y_test == y_pred) or correct / len(y_test))
    for a in ast_analysis.assignments:
        target_name = (a.targets[0] if a.targets else "").lower()
        if "acc" in target_name or "score" in target_name:
            if "==" in a.value_str or "mean" in a.value_str or "sum" in a.value_str or "/" in a.value_str:
                ops.append(DetectedOperation(
                    op_type="METRIC_COMPUTATION",
                    cell_index=ast_analysis.cell_index,
                    line_no=a.line_no,
                    confidence=90.0,
                    detection_method="AST_ASSIGNMENT",
                    details={"type": "MANUAL_ACCURACY_MATH", "expression": a.value_str, "target": a.targets[0]},
                    raw_code=f"{a.targets[0]} = {a.value_str}"
                ))

    # 4. Inspect Deep Learning Manual Training Loop
    for loop in ast_analysis.loops:
        if any(c in loop.body_calls for c in ["backward", "step", "zero_grad", "train", "loss"]):
            ops.append(DetectedOperation(
                op_type="MODEL_TRAINING",
                cell_index=ast_analysis.cell_index,
                line_no=loop.line_no,
                confidence=96.0,
                detection_method="AST_LOOP",
                details={"type": "MANUAL_PYTORCH_TRAINING_LOOP", "body_calls": loop.body_calls},
                raw_code=f"for {loop.target_var} in {loop.iter_expr}: ..."
            ))

    return ops
