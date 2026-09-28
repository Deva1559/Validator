import os
from database import SessionLocal, ValidationRun, ValidationEvidence, ValidationFinding, ScoringBreakdown, AuditLog
from evidence import analyze_notebook_evidence

db = SessionLocal()

files = [
    ("Alice Smith", r"e:\validation\student_alice_random_forest.ipynb", "student_alice_random_forest.ipynb"),
    ("Bob Johnson", r"e:\validation\student_bob_gradient_boosting.ipynb", "student_bob_gradient_boosting.ipynb")
]

baselines = {
    "accuracy": 85.0,
    "macro_f1": 80.0,
    "training_time": 60.0,
    "time_comparison": "lower"
}

for name, path, fname in files:
    run = db.query(ValidationRun).filter(ValidationRun.student_name == name).first()
    if not run:
        run = ValidationRun(student_name=name, filename=fname, batch_id="BATCH-001")
        db.add(run)
        db.commit()
        db.refresh(run)
    else:
        # Clear previous evidence, findings, breakdown
        db.query(ValidationEvidence).filter(ValidationEvidence.run_id == run.id).delete()
        db.query(ValidationFinding).filter(ValidationFinding.run_id == run.id).delete()
        db.query(ScoringBreakdown).filter(ScoringBreakdown.run_id == run.id).delete()
        db.commit()

    with open(path, "rb") as f:
        content = f.read()

    analyze_notebook_evidence(db, run.id, fname, content, baselines)
    print(f"Re-analyzed {name}: score = {run.final_score}, status = {run.overall_status}")

# Let's inspect findings and evidence for Alice
alice_run = db.query(ValidationRun).filter(ValidationRun.student_name == "Alice Smith").first()
print("\nAlice Evidence:")
for ev in alice_run.evidence:
    print(f"[{ev.evidence_type}] {ev.metric_name} | Cell: #{ev.source_cell} | Status: {ev.verification_status} | Value: {ev.extracted_value}")

print("\nAlice Findings:")
for fd in alice_run.findings:
    print(f"[{fd.finding_type}] {fd.title} | {fd.description}")
