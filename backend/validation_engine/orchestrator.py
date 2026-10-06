"""
Validation Engine Orchestrator.
Coordinates Notebook Parsing, Static AST Analysis, Semantic Operation Classification,
Data-Flow Graph Construction, Sandbox Execution, Evidence Synthesis, and Database Persistence.
"""

from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from .parser.notebook_parser import parse_notebook, ParsedNotebook
from .static_analysis.ast_analyzer import analyze_cell_ast, CellASTAnalysis
from .semantic_analysis.operation_classifier import classify_cell_operations, DetectedOperation
from .dataflow.variable_graph import build_dataflow_graph
from .semantic_analysis.metric_detector import extract_metric_candidates
from .runtime.sandbox import RuntimeSandbox, CellExecutionResult
from .evidence.evidence_collector import synthesize_validation_evidence, ValidationDossier
from .ai.semantic_interpreter import generate_ai_explanation

def run_notebook_validation(
    content: bytes | str,
    target_baselines: Dict[str, Any],
    mode: str = "STATIC_PLUS_RUNTIME",
    student_name: str = "Student",
    use_case: str = "Traffic Sign Recognition"
) -> ValidationDossier:
    """
    Executes the complete semantic, AST, data-flow, and evidence validation pipeline.
    Does not require a database connection (pure functional evaluation).
    """
    # 1. Parse Notebook into structured cells
    notebook = parse_notebook(content)
    code_cells = notebook.code_cells

    # 2. Static AST Analysis per cell
    cells_ast: List[CellASTAnalysis] = []
    all_operations: List[DetectedOperation] = []

    for cell in code_cells:
        ast_res = analyze_cell_ast(cell.clean_code, cell.cell_index)
        cells_ast.append(ast_res)
        
        # Classify semantic ML operations
        ops = classify_cell_operations(ast_res, cell.source)
        all_operations.extend(ops)

    # 3. Build Cross-Cell Data-Flow Graph and evaluate leakage
    dataflow_graph, pipeline = build_dataflow_graph(cells_ast)

    # 4. Extract Metric Candidates with Provenance (Computed vs Hardcoded vs Printed)
    metric_candidates = extract_metric_candidates(notebook.cells, cells_ast)

    # 5. Sandboxed Runtime Execution (with timeout and error isolation)
    sandbox = RuntimeSandbox(mode=mode, timeout_per_cell=5.0)
    runtime_results: List[CellExecutionResult] = []
    
    if mode == "STATIC_PLUS_RUNTIME":
        for cell in code_cells:
            # Execute top-level non-infinite cells safely
            res = sandbox.execute_cell(cell.clean_code, cell.cell_index)
            runtime_results.append(res)
            # If a fatal error occurs, gracefully continue without failing the validator
            if not res.success and "timeout" in (res.error or "").lower():
                break

    # 6. Synthesize Unified Validation Dossier
    dossier = synthesize_validation_evidence(
        operations=all_operations,
        dataflow_pipeline=pipeline,
        metric_candidates=metric_candidates,
        runtime_results=runtime_results,
        target_baselines=target_baselines
    )

    return dossier


def validate_and_persist_notebook(
    db: Session,
    run_id: int,
    filename: str,
    content: bytes,
    baselines: Dict[str, Any],
    mode: str = "STATIC_PLUS_RUNTIME"
):
    """
    Integrates directly with database models:
    Replaces keyword-based analyze_notebook_evidence while maintaining 100% backward compatibility.
    """
    from database import ValidationRun, ValidationEvidence, ValidationFinding, ScoringBreakdown, AuditLog

    run = db.query(ValidationRun).filter(ValidationRun.id == run_id).first()
    student_name = run.student_name if run else "Student"
    use_case = getattr(run, "use_case", "Traffic Sign Recognition") if run else "Traffic Sign Recognition"

    try:
        # Run the complete semantic AST engine
        dossier = run_notebook_validation(
            content=content,
            target_baselines=baselines,
            mode=mode,
            student_name=student_name,
            use_case=use_case
        )
    except Exception as e:
        # Graceful error handling if notebook JSON is fundamentally corrupt
        if run:
            run.overall_status = "ERROR"
        db.add(ValidationFinding(
            run_id=run_id,
            finding_type="ERROR",
            title="Notebook Structural Error",
            description=f"Unable to parse notebook structure: {str(e)}",
            source="PARSER_ENGINE"
        ))
        db.commit()
        return

    # Clear any previous evidence records for this run to avoid duplicates
    db.query(ValidationEvidence).filter(ValidationEvidence.run_id == run_id).delete()
    db.query(ValidationFinding).filter(ValidationFinding.run_id == run_id).delete()

    # Persist Evidence Items
    for item in dossier.evidence_items:
        primary_cell = item.cells[0] if item.cells else None
        db.add(ValidationEvidence(
            run_id=run_id,
            metric_name=item.concept,
            evidence_type=item.evidence_type,
            extracted_value=item.extracted_value,
            source_cell=primary_cell,
            detection_method=", ".join(item.detection_methods),
            relevant_code=item.code_snippet,
            relevant_output=item.output_snippet,
            confidence_score=item.confidence,
            verification_status=item.status,
            baseline_status=item.details
        ))

    # Persist Findings
    for find in dossier.findings:
        db.add(ValidationFinding(
            run_id=run_id,
            finding_type=find["type"],
            title=find["title"],
            description=find["description"],
            source=find["source"]
        ))

    # Compute deterministic scores
    acc_val = dossier.extracted_metrics.get("accuracy")
    f1_val = dossier.extracted_metrics.get("macro_f1")
    time_val = dossier.extracted_metrics.get("training_time", 40.0)

    target_acc = baselines.get("accuracy", 90.0)
    target_f1 = baselines.get("macro_f1", 88.0)
    target_time = baselines.get("training_time", 60.0)

    # 40% Accuracy, 40% Macro F1, 20% Training Time
    acc_score = min(40.0, (acc_val / max(0.01, target_acc)) * 40.0) if acc_val is not None else 0.0
    f1_score = min(40.0, (f1_val / max(0.01, target_f1)) * 40.0) if f1_val is not None else 0.0
    time_score = 20.0 if (time_val is not None and time_val <= target_time) else 14.0

    total_score = round(acc_score + f1_score + time_score, 1)

    db.query(ScoringBreakdown).filter(ScoringBreakdown.run_id == run_id).delete()
    db.add(ScoringBreakdown(run_id=run_id, metric_name="Accuracy", weight=40, contribution=acc_score))
    db.add(ScoringBreakdown(run_id=run_id, metric_name="Macro F1", weight=40, contribution=f1_score))
    db.add(ScoringBreakdown(run_id=run_id, metric_name="Training Time", weight=20, contribution=time_score))

    # Update Run
    if run:
        run.final_score = total_score
        run.overall_status = "REVIEW REQUIRED" if dossier.requires_review else "VERIFIED"

    # Generate transparent AI explanation
    ai_summary = generate_ai_explanation(dossier, student_name, use_case)
    db.add(AuditLog(
        run_id=run_id,
        user="AST_EVIDENCE_ENGINE",
        action="Semantic Validation Completed",
        details=f"Score: {total_score}/100. Status: {run.overall_status}. {ai_summary}"
    ))

    db.commit()
