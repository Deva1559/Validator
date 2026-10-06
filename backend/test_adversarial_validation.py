"""
Comprehensive Automated Test Suite for Semantic, AST & Data-Flow Notebook Validation.
Covers all 13 required adversarial test scenarios from the Master Prompt.
"""

import unittest
import json
from validation_engine.orchestrator import run_notebook_validation

def make_notebook(code_cells: list[str]) -> str:
    """Helper to generate valid Jupyter notebook JSON from a list of code cell strings."""
    cells = []
    for idx, code in enumerate(code_cells):
        cells.append({
            "cell_type": "code",
            "execution_count": idx + 1,
            "id": f"cell_{idx}",
            "metadata": {},
            "outputs": [
                {
                    "output_type": "stream",
                    "name": "stdout",
                    "text": ["Model accuracy: 91.5%\nMacro F1: 89.2%\nTraining time: 42s\n"]
                }
            ],
            "source": [code]
        })
    return json.dumps({"cells": cells, "metadata": {}, "nbformat": 4, "nbformat_minor": 2})


class TestAdversarialValidator(unittest.TestCase):

    def setUp(self):
        self.baselines = {"accuracy": 90.0, "macro_f1": 88.0, "training_time": 60.0}

    # Test 1: Standard sklearn implementation
    def test_01_standard_sklearn(self):
        nb = make_notebook([
            "import pandas as pd\ndf = pd.read_csv('data.csv')",
            "from sklearn.model_selection import train_test_split\nX_train, X_test, y_train, y_test = train_test_split(df.drop('target', axis=1), df['target'], test_size=0.2)",
            "from sklearn.ensemble import RandomForestClassifier\nmodel = RandomForestClassifier()\nmodel.fit(X_train, y_train)",
            "from sklearn.metrics import accuracy_score, f1_score\npreds = model.predict(X_test)\nacc = accuracy_score(y_test, preds)\nf1 = f1_score(y_test, preds, average='macro')"
        ])
        dossier = run_notebook_validation(nb, self.baselines, mode="STATIC_ONLY")
        self.assertEqual(dossier.overall_status, "VERIFIED")
        self.assertFalse(dossier.requires_review)
        self.assertTrue(dossier.workflow_summary["ML-001: Dataset Ingestion"])
        self.assertTrue(dossier.workflow_summary["ML-007: Train-Test Split Partitioning"])
        self.assertTrue(dossier.workflow_summary["ML-010: Model Training Procedure & Leakage Check"])

    # Test 2: Different variable names
    def test_02_arbitrary_variable_names(self):
        nb = make_notebook([
            "import pandas as pd\nmy_dataset = pd.read_csv('data.csv')",
            "from sklearn.model_selection import train_test_split\nalpha_feats, beta_feats, gamma_lbls, delta_lbls = train_test_split(my_dataset[['c1', 'c2']], my_dataset['c3'])",
            "from sklearn.svm import SVC\ncustom_net = SVC()\ncustom_net.fit(alpha_feats, gamma_lbls)",
            "from sklearn.metrics import accuracy_score\npredictions_array = custom_net.predict(beta_feats)\ncomputed_score = accuracy_score(delta_lbls, predictions_array)"
        ])
        dossier = run_notebook_validation(nb, self.baselines, mode="STATIC_ONLY")
        # Variable names do NOT prevent model training or prediction verification
        self.assertTrue(dossier.workflow_summary["ML-010: Model Training Procedure & Leakage Check"])
        self.assertTrue(dossier.workflow_summary["ML-012: Evaluation & Metrics on Unseen Test Split"])

    # Test 3: Manual train/test split via slicing
    def test_03_manual_train_test_split(self):
        nb = make_notebook([
            "import pandas as pd\ndf = pd.read_csv('data.csv')",
            "split_point = int(len(df) * 0.8)\nX_train = df.iloc[:split_point, :-1]\nX_test = df.iloc[split_point:, :-1]",
            "from sklearn.linear_model import LogisticRegression\nclf = LogisticRegression()\nclf.fit(X_train, df.iloc[:split_point, -1])"
        ])
        dossier = run_notebook_validation(nb, self.baselines, mode="STATIC_ONLY")
        self.assertTrue(dossier.workflow_summary["ML-007: Train-Test Split Partitioning"])

    # Test 4: Custom preprocessing function
    def test_04_custom_preprocessing_function(self):
        nb = make_notebook([
            "import pandas as pd\ndf = pd.read_csv('data.csv')",
            "def custom_cleaner(data):\n    return data.dropna().drop_duplicates()\ncleaned_df = custom_cleaner(df)",
            "from sklearn.model_selection import train_test_split\nX_train, X_test = train_test_split(cleaned_df)"
        ])
        dossier = run_notebook_validation(nb, self.baselines, mode="STATIC_ONLY")
        self.assertTrue(dossier.workflow_summary["ML-002: Data Cleaning & Preprocessing"])

    # Test 5: Hardcoded accuracy (e.g. accuracy = 0.99 with no calculation)
    def test_05_hardcoded_accuracy_detected(self):
        nb = make_notebook([
            "import pandas as pd\ndf = pd.read_csv('data.csv')",
            "accuracy = 0.999\nprint(f'Accuracy: {accuracy}')"
        ])
        dossier = run_notebook_validation(nb, self.baselines, mode="STATIC_ONLY")
        # Hardcoded metric must NOT be accepted as verified
        self.assertTrue(dossier.requires_review)
        finding_titles = [f["title"] for f in dossier.findings]
        self.assertIn("Unverified Accuracy Metric", finding_titles)

    # Test 6: Training-data evaluation (predict on X_train instead of test set)
    def test_06_training_data_evaluation_warning(self):
        nb = make_notebook([
            "import pandas as pd\ndf = pd.read_csv('data.csv')",
            "from sklearn.model_selection import train_test_split\nX_train, X_test, y_train, y_test = train_test_split(df[['a', 'b']], df['y'])",
            "from sklearn.ensemble import RandomForestClassifier\nmodel = RandomForestClassifier()\nmodel.fit(X_train, y_train)",
            "from sklearn.metrics import accuracy_score\npreds = model.predict(X_train)\nacc = accuracy_score(y_train, preds)"
        ])
        dossier = run_notebook_validation(nb, self.baselines, mode="STATIC_ONLY")
        self.assertTrue(dossier.requires_review)
        finding_types = [f["type"] for f in dossier.findings]
        self.assertIn("EVALUATION WARNING", finding_types)

    # Test 7: Data leakage (scaler.fit_transform(X) before train_test_split)
    def test_07_data_leakage_detected(self):
        nb = make_notebook([
            "import pandas as pd\ndf = pd.read_csv('data.csv')",
            "from sklearn.preprocessing import StandardScaler\nscaler = StandardScaler()\nX_scaled = scaler.fit_transform(df.drop('target', axis=1))",
            "from sklearn.model_selection import train_test_split\nX_train, X_test, y_train, y_test = train_test_split(X_scaled, df['target'])",
            "from sklearn.tree import DecisionTreeClassifier\nmodel = DecisionTreeClassifier()\nmodel.fit(X_train, y_train)"
        ])
        dossier = run_notebook_validation(nb, self.baselines, mode="STATIC_ONLY")
        self.assertTrue(dossier.requires_review)
        finding_types = [f["type"] for f in dossier.findings]
        self.assertIn("DATA LEAKAGE WARNING", finding_types)

    # Test 8: Missing Macro F1
    def test_08_missing_macro_f1_marked_unverified(self):
        nb = make_notebook([
            "import pandas as pd\ndf = pd.read_csv('data.csv')",
            "from sklearn.model_selection import train_test_split\nX_train, X_test, y_train, y_test = train_test_split(df[['a']], df['y'])",
            "from sklearn.linear_model import LogisticRegression\nm = LogisticRegression()\nm.fit(X_train, y_train)",
            "from sklearn.metrics import accuracy_score\nacc = accuracy_score(y_test, m.predict(X_test))"
        ])
        dossier = run_notebook_validation(nb, self.baselines, mode="STATIC_ONLY")
        self.assertIsNone(dossier.extracted_metrics.get("macro_f1"))
        f1_evidence = next((e for e in dossier.evidence_items if e.concept == "Macro F1"), None)
        self.assertIsNotNone(f1_evidence)
        self.assertEqual(f1_evidence.status, "NOT VERIFIED")

    # Test 9: Missing training time fallback
    def test_09_missing_training_time_fallback(self):
        nb = make_notebook([
            "import pandas as pd\ndf = pd.read_csv('data.csv')"
        ])
        dossier = run_notebook_validation(nb, self.baselines, mode="STATIC_ONLY")
        # System provides safe default runtime tracker
        self.assertIsNotNone(dossier.extracted_metrics.get("training_time"))

    # Test 10: Multiple accuracy values candidate preservation
    def test_10_multiple_accuracy_candidates(self):
        nb = make_notebook([
            "from sklearn.metrics import accuracy_score\nacc1 = accuracy_score(y1, p1)",
            "acc2 = accuracy_score(y2, p2)"
        ])
        dossier = run_notebook_validation(nb, self.baselines, mode="STATIC_ONLY")
        # Verified accuracy exists
        self.assertIsNotNone(dossier.extracted_metrics.get("accuracy"))

    # Test 11: Notebook execution / parse error
    def test_11_corrupt_notebook_error_handling(self):
        corrupt_nb = "{ this is not valid json : [[["
        with self.assertRaises(Exception):
            run_notebook_validation(corrupt_nb, self.baselines, mode="STATIC_ONLY")

    # Test 12: Completely different valid syntax (PyTorch training loop)
    def test_12_pytorch_training_loop_syntax(self):
        nb = make_notebook([
            "import torch\nimport torch.nn as nn\nmodel = nn.Linear(10, 2)\noptimizer = torch.optim.SGD(model.parameters(), lr=0.01)",
            "for epoch in range(10):\n    optimizer.zero_grad()\n    loss = model(inputs)\n    loss.backward()\n    optimizer.step()"
        ])
        dossier = run_notebook_validation(nb, self.baselines, mode="STATIC_ONLY")
        # PyTorch backward & step loop recognized as MODEL_TRAINING
        self.assertTrue(dossier.workflow_summary["ML-010: Model Training Procedure & Leakage Check"])

    # Test 13: Cross-validation splitter detection
    def test_13_cross_validation_splitter(self):
        nb = make_notebook([
            "from sklearn.model_selection import KFold\nkf = KFold(n_splits=5)\nfor train_idx, test_idx in kf.split(X):\n    pass"
        ])
        dossier = run_notebook_validation(nb, self.baselines, mode="STATIC_ONLY")
        self.assertTrue(dossier.workflow_summary["ML-007: Train-Test Split Partitioning"])


if __name__ == "__main__":
    unittest.main()
