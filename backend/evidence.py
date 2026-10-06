"""
ML Notebook Validation Entrypoint.
Delegates to the modular validation_engine (AST analysis, data-flow graph,
provenance tracking, and sandbox execution).
Maintains 100% backward compatibility for all callers.
"""

from sqlalchemy.orm import Session
from validation_engine.orchestrator import validate_and_persist_notebook

def analyze_notebook_evidence(
    db: Session, 
    run_id: int, 
    filename: str, 
    content: bytes, 
    baselines: dict,
    mode: str = "STATIC_PLUS_RUNTIME"
):
    """
    Analyzes notebook using Python AST, semantic ML concept classification,
    variable dependency tracking, and sandboxed runtime evidence collection.
    """
    return validate_and_persist_notebook(
        db=db,
        run_id=run_id,
        filename=filename,
        content=content,
        baselines=baselines,
        mode=mode
    )
