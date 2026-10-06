"""
Comprehensive Unit Tests for the Deterministic Task-Aware ML Scoring Engine.
Validates all 7 Use Cases, Mathematical Determinism, Normalization Rules, Edge Cases & Fairness.
"""

import unittest
import math
from scoring_engine import (
    normalize_higher_better,
    normalize_lower_better,
    calculate_metric_score,
    calculate_task_and_baseline_score,
    calculate_cohort_relative_scores,
    calculate_validation_quality_score,
    calculate_overall_performance_score,
    assign_overall_ranks
)


class TestScoringEngine(unittest.TestCase):

    # 1. Classification (Traffic Signs & Plant Disease)
    def test_traffic_sign_normalization(self):
        """Traffic signs: Accuracy (50%), Macro-F1 (35%), Training Time (15%)."""
        configs = [
            {"metric_key": "accuracy", "weight": 0.50, "baseline_target": 90.0, "direction": "higher"},
            {"metric_key": "macro_f1", "weight": 0.35, "baseline_target": 88.0, "direction": "higher"},
            {"metric_key": "training_time", "weight": 0.15, "baseline_target": 60.0, "direction": "lower"}
        ]
        metrics = [
            {"metric_key": "accuracy", "raw_value": 94.5, "verification_status": "VERIFIED"},
            {"metric_key": "macro_f1", "raw_value": 91.2, "verification_status": "VERIFIED"},
            {"metric_key": "training_time", "raw_value": 45.0, "verification_status": "VERIFIED"}  # faster than 60s
        ]
        res = calculate_task_and_baseline_score(metrics, configs)
        # All meet or exceed baseline -> 100 on each metric -> task score = 100.0
        self.assertEqual(res["task_score"], 100.0)
        self.assertEqual(res["validation_status"], "VERIFIED")

    def test_traffic_sign_below_baseline(self):
        configs = [
            {"metric_key": "accuracy", "weight": 0.50, "baseline_target": 90.0, "direction": "higher"},
            {"metric_key": "macro_f1", "weight": 0.50, "baseline_target": 90.0, "direction": "higher"}
        ]
        metrics = [
            {"metric_key": "accuracy", "raw_value": 81.0, "verification_status": "VERIFIED"}, # 81/90 * 100 = 90.0
            {"metric_key": "macro_f1", "raw_value": 72.0, "verification_status": "VERIFIED"}  # 72/90 * 100 = 80.0
        ]
        res = calculate_task_and_baseline_score(metrics, configs)
        # 0.5 * 90.0 + 0.5 * 80.0 = 85.0
        self.assertEqual(res["task_score"], 85.0)

    # 2. Object Detection (Face Mask) - NO Accuracy/F1
    def test_face_mask_detection_metrics(self):
        """Face Mask: mAP@0.5 (50%), Precision (25%), Recall (25%)."""
        configs = [
            {"metric_key": "map50", "weight": 0.50, "baseline_target": 88.0, "direction": "higher"},
            {"metric_key": "precision", "weight": 0.25, "baseline_target": 85.0, "direction": "higher"},
            {"metric_key": "recall", "weight": 0.25, "baseline_target": 85.0, "direction": "higher"}
        ]
        metrics = [
            {"metric_key": "map50", "raw_value": 88.0, "verification_status": "VERIFIED"}, # 100.0
            {"metric_key": "precision", "raw_value": 85.0, "verification_status": "VERIFIED"}, # 100.0
            {"metric_key": "recall", "raw_value": 76.5, "verification_status": "VERIFIED"} # 76.5 / 85 * 100 = 90.0
        ]
        res = calculate_task_and_baseline_score(metrics, configs)
        expected = 0.50 * 100.0 + 0.25 * 100.0 + 0.25 * 90.0 # 50 + 25 + 22.5 = 97.5
        self.assertAlmostEqual(res["task_score"], expected, places=1)

    # 3. Image Segmentation (Pet Image Segmentation) - Dice, IoU, Pixel Accuracy
    def test_pet_segmentation_metrics(self):
        configs = [
            {"metric_key": "dice", "weight": 0.45, "baseline_target": 85.0, "direction": "higher"},
            {"metric_key": "iou", "weight": 0.35, "baseline_target": 80.0, "direction": "higher"},
            {"metric_key": "pixel_accuracy", "weight": 0.20, "baseline_target": 90.0, "direction": "higher"}
        ]
        metrics = [
            {"metric_key": "dice", "raw_value": 89.25, "verification_status": "VERIFIED"},
            {"metric_key": "iou", "raw_value": 82.0, "verification_status": "VERIFIED"},
            {"metric_key": "pixel_accuracy", "raw_value": 92.5, "verification_status": "VERIFIED"}
        ]
        res = calculate_task_and_baseline_score(metrics, configs)
        self.assertEqual(res["task_score"], 100.0)

    # 4. GAN Special Handling - FID lower is better, Loss Curves stability
    def test_gan_fid_lower_is_better(self):
        configs = [
            {"metric_key": "fid", "weight": 0.50, "baseline_target": 25.0, "direction": "lower"},
            {"metric_key": "generator_loss_stability", "weight": 0.25, "baseline_target": 85.0, "direction": "higher"},
            {"metric_key": "discriminator_loss_stability", "weight": 0.25, "baseline_target": 85.0, "direction": "higher"}
        ]
        # Student with FID = 15.0 (better than 25.0 baseline)
        metrics_better = [
            {"metric_key": "fid", "raw_value": 15.0, "verification_status": "VERIFIED"},
            {"metric_key": "generator_loss_stability", "raw_value": 85.0, "verification_status": "VERIFIED"},
            {"metric_key": "discriminator_loss_stability", "raw_value": 85.0, "verification_status": "VERIFIED"}
        ]
        res_better = calculate_task_and_baseline_score(metrics_better, configs)
        self.assertEqual(res_better["task_score"], 100.0)

        # Student with FID = 50.0 (worse than 25.0 baseline: 25/50 * 100 = 50.0 on FID)
        metrics_worse = [
            {"metric_key": "fid", "raw_value": 50.0, "verification_status": "VERIFIED"},
            {"metric_key": "generator_loss_stability", "raw_value": 85.0, "verification_status": "VERIFIED"},
            {"metric_key": "discriminator_loss_stability", "raw_value": 85.0, "verification_status": "VERIFIED"}
        ]
        res_worse = calculate_task_and_baseline_score(metrics_worse, configs)
        # FID contrib = 50.0 * 0.5 = 25.0; G-loss = 25.0; D-loss = 25.0 -> Total = 75.0
        self.assertEqual(res_worse["task_score"], 75.0)

    # 5. Image Captioning - BLEU-1, BLEU-4
    def test_image_captioning_metrics(self):
        configs = [
            {"metric_key": "bleu1", "weight": 0.40, "baseline_target": 65.0, "direction": "higher"},
            {"metric_key": "bleu4", "weight": 0.60, "baseline_target": 35.0, "direction": "higher"}
        ]
        metrics = [
            {"metric_key": "bleu1", "raw_value": 68.5, "verification_status": "VERIFIED"},
            {"metric_key": "bleu4", "raw_value": 31.5, "verification_status": "VERIFIED"} # 31.5/35 * 100 = 90.0
        ]
        res = calculate_task_and_baseline_score(metrics, configs)
        expected = 0.40 * 100.0 + 0.60 * 90.0 # 40 + 54 = 94.0
        self.assertAlmostEqual(res["task_score"], expected, places=1)

    # 6. Pneumonia Detection (Clinical Binary Classification) - Recall, AUC, F1
    def test_pneumonia_detection_metrics(self):
        configs = [
            {"metric_key": "recall", "weight": 0.40, "baseline_target": 92.0, "direction": "higher"},
            {"metric_key": "auc", "weight": 0.30, "baseline_target": 90.0, "direction": "higher"},
            {"metric_key": "f1", "weight": 0.30, "baseline_target": 88.0, "direction": "higher"}
        ]
        metrics = [
            {"metric_key": "recall", "raw_value": 94.0, "verification_status": "VERIFIED"},
            {"metric_key": "auc", "raw_value": 91.5, "verification_status": "VERIFIED"},
            {"metric_key": "f1", "raw_value": 88.0, "verification_status": "VERIFIED"}
        ]
        res = calculate_task_and_baseline_score(metrics, configs)
        self.assertEqual(res["task_score"], 100.0)

    # 7. Strict Mathematical Determinism
    def test_mathematical_determinism(self):
        """Given identical inputs, the system MUST return exactly the same score every time."""
        configs = [
            {"metric_key": "accuracy", "weight": 0.60, "baseline_target": 90.0, "direction": "higher"},
            {"metric_key": "macro_f1", "weight": 0.40, "baseline_target": 85.0, "direction": "higher"}
        ]
        metrics = [
            {"metric_key": "accuracy", "raw_value": 88.2, "verification_status": "VERIFIED"},
            {"metric_key": "macro_f1", "raw_value": 82.5, "verification_status": "VERIFIED"}
        ]
        score_run1 = calculate_task_and_baseline_score(metrics, configs)
        score_run2 = calculate_task_and_baseline_score(metrics, configs)
        self.assertEqual(score_run1["task_score"], score_run2["task_score"])
        self.assertEqual(score_run1["baseline_score"], score_run2["baseline_score"])

    # 8. Missing Metric Handling
    def test_missing_metric_renormalization(self):
        """Missing metric must NOT be treated as 0; weights should be re-normalized proportionally."""
        configs = [
            {"metric_key": "accuracy", "weight": 0.50, "baseline_target": 90.0, "direction": "higher"},
            {"metric_key": "macro_f1", "weight": 0.50, "baseline_target": 90.0, "direction": "higher"}
        ]
        # Student missing macro_f1
        metrics = [
            {"metric_key": "accuracy", "raw_value": 90.0, "verification_status": "VERIFIED"},
            {"metric_key": "macro_f1", "raw_value": None, "verification_status": "NOT VERIFIED"}
        ]
        res = calculate_task_and_baseline_score(metrics, configs, missing_policy="RENORMALIZE")
        # Accuracy is 100% of verified weight (0.50 / 0.50) -> task score is 100.0
        self.assertEqual(res["task_score"], 100.0)
        self.assertEqual(res["validation_status"], "PARTIALLY VERIFIED")
        self.assertIn("macro_f1", res["missing_metrics"])

    # 9. Suspicious Metric Handling
    def test_suspicious_metric_flagged(self):
        """Suspicious/hardcoded metric must be flagged REVIEW REQUIRED and not earn trusted baseline points."""
        configs = [
            {"metric_key": "accuracy", "weight": 0.50, "baseline_target": 90.0, "direction": "higher"},
            {"metric_key": "macro_f1", "weight": 0.50, "baseline_target": 90.0, "direction": "higher"}
        ]
        metrics = [
            {"metric_key": "accuracy", "raw_value": 99.99, "verification_status": "SUSPICIOUS"},
            {"metric_key": "macro_f1", "raw_value": 85.0, "verification_status": "VERIFIED"}
        ]
        res = calculate_task_and_baseline_score(metrics, configs, missing_policy="RENORMALIZE")
        self.assertEqual(res["validation_status"], "REVIEW REQUIRED")
        self.assertIn("accuracy", res["suspicious_metrics"])

    # 10. Small Cohort Handling & Reliability
    def test_small_cohort_reliability_badge(self):
        """Cohorts < 8 must be marked LOW SAMPLE and blend relative score with baseline performance."""
        # 5 students in a tiny GAN cohort
        students = [
            {"student_roll": f"GAN_{i}", "task_score": 90.0 - i*5, "baseline_score": 90.0 - i*5, "validation_score": 95.0}
            for i in range(5)
        ]
        ranked = calculate_cohort_relative_scores(students, min_normal=15, min_limited=8)
        self.assertEqual(ranked[0]["cohort_status"], "LOW SAMPLE")
        # In LOW SAMPLE, top student's relative score is blended: 0.50 * 100.0 + 0.50 * 90.0 = 95.0
        self.assertEqual(ranked[0]["relative_score"], 95.0)

    def test_normal_cohort_reliability(self):
        """Cohorts >= 15 must be marked NORMAL with pure percentile distribution."""
        students = [
            {"student_roll": f"GTSRB_{i}", "task_score": 100.0 - i*2, "baseline_score": 95.0, "validation_score": 95.0}
            for i in range(20)
        ]
        ranked = calculate_cohort_relative_scores(students, min_normal=15, min_limited=8)
        self.assertEqual(ranked[0]["cohort_status"], "NORMAL")
        self.assertEqual(ranked[0]["relative_score"], 100.0)
        self.assertEqual(ranked[-1]["relative_score"], 0.0)

    # 11. Final Overall Score 60/25/15 Formula
    def test_overall_composite_formula(self):
        """Final Score = 60% Baseline + 25% Relative + 15% Validation."""
        baseline_score = 98.4
        relative_score = 96.0
        validation_score = 100.0
        overall, breakdown = calculate_overall_performance_score(
            baseline_score, relative_score, validation_score,
            baseline_weight=60.0, relative_weight=25.0, validation_weight=15.0
        )
        # 0.60 * 98.4 = 59.04
        # 0.25 * 96.0 = 24.00
        # 0.15 * 100.0 = 15.00
        # Total = 98.04
        self.assertEqual(overall, 98.04)

    # 12. Tie Breaking Determinism
    def test_tie_breaking_order(self):
        students = [
            {"student_roll": "ST_A", "overall_score": 95.0, "validation_score": 90.0, "baseline_score": 95.0, "task_score": 95.0},
            {"student_roll": "ST_B", "overall_score": 95.0, "validation_score": 95.0, "baseline_score": 95.0, "task_score": 95.0}
        ]
        ranked = assign_overall_ranks(students)
        # ST_B has higher validation score (95 vs 90) -> must be ranked #1
        self.assertEqual(ranked[0]["student_roll"], "ST_B")
        self.assertEqual(ranked[0]["overall_rank"], 1)
        self.assertEqual(ranked[1]["student_roll"], "ST_A")
        self.assertEqual(ranked[1]["overall_rank"], 2)


if __name__ == "__main__":
    unittest.main()
