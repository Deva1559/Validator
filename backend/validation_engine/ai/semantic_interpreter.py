"""
AI Semantic Interpreter and Explanation Generator.
Provides explainable summaries and resolves ambiguous patterns
while strictly referencing proven notebook AST evidence (never fabricating conclusions).
"""

from typing import Dict, List, Any, Optional
from ..evidence.evidence_collector import ValidationDossier

def generate_ai_explanation(dossier: ValidationDossier, student_name: str, use_case: str) -> str:
    """Generates an objective, evidence-grounded AI audit explanation."""
    lines = []
    lines.append(f"AI Audit Summary for {student_name} ({use_case}):")
    
    # Workflow status
    wf_detected = sum(1 for v in dossier.workflow_summary.values() if v)
    wf_total = len(dossier.workflow_summary)
    lines.append(f"- ML Pipeline Compliance: {wf_detected}/{wf_total} key operations verified via AST analysis.")
    
    # Leakage & Integrity status
    leakage_findings = [f for f in dossier.findings if "LEAKAGE" in f["type"] or "EVALUATION" in f["type"]]
    if leakage_findings:
        for f in leakage_findings:
            lines.append(f"- [Audit Warning] {f['title']}: {f['description']}")
    else:
        lines.append("- Data Hygiene & Partitioning: Verified clean train-test separation with zero detected leakage.")

    # Metric evaluation
    metric_strs = []
    for ev in dossier.evidence_items:
        if ev.evidence_type == "METRIC":
            if ev.status == "VERIFIED" and ev.extracted_value:
                metric_strs.append(f"{ev.concept}={ev.extracted_value}")
            else:
                metric_strs.append(f"{ev.concept}=UNVERIFIED")
                
    if metric_strs:
        lines.append(f"- Verified Metrics: {', '.join(metric_strs)}.")
    else:
        lines.append("- Verified Metrics: No metric statements verified.")
    
    if dossier.requires_review:
        lines.append("- Verdict: REVIEW REQUIRED. Potential integrity anomaly or unverified metric statement detected.")
    else:
        lines.append("- Verdict: VERIFIED. Code structure and execution evidence conform to rigorous academic ML standards.")
        
    return "\n".join(lines)
