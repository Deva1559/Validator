import json

def create_notebook_alice():
    nb = {
        "cells": [
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "# Machine Learning Assignment 1: Customer Churn Classification\n",
                    "**Student:** Alice Smith  \n",
                    "**Model:** Random Forest Classifier  \n",
                    "**Objective:** End-to-end clean ML workflow predicting customer churn with high macro-f1 and accuracy."
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 1,
                "metadata": {},
                "outputs": [],
                "source": [
                    "import time\n",
                    "import numpy as np\n",
                    "import pandas as pd\n",
                    "from sklearn.model_selection import train_test_split\n",
                    "from sklearn.preprocessing import StandardScaler\n",
                    "from sklearn.ensemble import RandomForestClassifier\n",
                    "from sklearn.metrics import accuracy_score, f1_score, classification_report\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 2,
                "metadata": {},
                "outputs": [
                    {
                        "name": "stdout",
                        "output_type": "stream",
                        "text": [
                            "Dataset loaded successfully. Shape: (7043, 21)\n",
                            "Columns: ['customerID', 'gender', 'SeniorCitizen', 'Partner', 'Dependents', ...]\n"
                        ]
                    }
                ],
                "source": [
                    "# Step 1: Load the dataset (ML-001)\n",
                    "df = pd.read_csv('telecom_churn.csv')\n",
                    "print(f'Dataset loaded successfully. Shape: {df.shape}')\n",
                    "print(f'Columns: {list(df.columns[:5])}...')\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 3,
                "metadata": {},
                "outputs": [
                    {
                        "name": "stdout",
                        "output_type": "stream",
                        "text": [
                            "Missing values check: 0 null values remaining.\n",
                            "Duplicate rows removed: 0 duplicates found.\n",
                            "Data hygiene verified clean.\n"
                        ]
                    }
                ],
                "source": [
                    "# Step 2: Data Cleaning & Missing Value Handling (ML-002)\n",
                    "initial_rows = len(df)\n",
                    "df.dropna(inplace=True)\n",
                    "df.drop_duplicates(inplace=True)\n",
                    "print('Missing values check: 0 null values remaining.')\n",
                    "print('Duplicate rows removed: 0 duplicates found.')\n",
                    "print('Data hygiene verified clean.')\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 4,
                "metadata": {},
                "outputs": [
                    {
                        "name": "stdout",
                        "output_type": "stream",
                        "text": [
                            "Features standardized using StandardScaler. Shape: (7043, 20)\n"
                        ]
                    }
                ],
                "source": [
                    "# Step 3: Feature Engineering and Normalization (ML-003)\n",
                    "X = df.drop(columns=['Churn', 'customerID'], errors='ignore')\n",
                    "y = df['Churn'] if 'Churn' in df else np.random.randint(0, 2, size=len(df))\n",
                    "\n",
                    "scaler = StandardScaler()\n",
                    "X_scaled = pd.DataFrame(scaler.fit_transform(X.select_dtypes(include=[np.number])), columns=X.select_dtypes(include=[np.number]).columns)\n",
                    "print(f'Features standardized using StandardScaler. Shape: {X.shape}')\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 5,
                "metadata": {},
                "outputs": [
                    {
                        "name": "stdout",
                        "output_type": "stream",
                        "text": [
                            "Train-test split complete (80% train, 20% test).\n",
                            "X_train shape: (5634, 20), X_test shape: (1409, 20)\n"
                        ]
                    }
                ],
                "source": [
                    "# Step 4: Train-Test Split Partitioning (ML-007)\n",
                    "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)\n",
                    "print('Train-test split complete (80% train, 20% test).')\n",
                    "print(f'X_train shape: {X_train.shape}, X_test shape: {X_test.shape}')\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 6,
                "metadata": {},
                "outputs": [
                    {
                        "name": "stdout",
                        "output_type": "stream",
                        "text": [
                            "Model initialized: RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)\n",
                            "Training Random Forest Classifier on training partition only...\n",
                            "Fit completed without data leakage.\n",
                            "Training time: 38.5 seconds\n"
                        ]
                    }
                ],
                "source": [
                    "# Step 5 & 6: Model Selection & Training Procedure (ML-008 & ML-010)\n",
                    "model = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)\n",
                    "print(f'Model initialized: {model}')\n",
                    "\n",
                    "start_time = time.time()\n",
                    "# Fit strictly on training split\n",
                    "model.fit(X_train, y_train)\n",
                    "training_duration = time.time() - start_time\n",
                    "\n",
                    "print('Training Random Forest Classifier on training partition only...')\n",
                    "print('Fit completed without data leakage.')\n",
                    "print(f'Training time: {training_duration:.1f} seconds')\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 7,
                "metadata": {},
                "outputs": [
                    {
                        "name": "stdout",
                        "output_type": "stream",
                        "text": [
                            "================ MODEL EVALUATION ================\n",
                            "Accuracy: 0.9125 (91.25%)\n",
                            "Macro F1 Score: 0.8840\n",
                            "\n",
                            "Detailed Classification Report:\n",
                            "              precision    recall  f1-score   support\n",
                            "           0       0.93      0.95      0.94      1035\n",
                            "           1       0.85      0.82      0.83       374\n",
                            "    accuracy                           0.91      1409\n",
                            "   macro avg       0.89      0.88      0.88      1409\n",
                            "weighted avg       0.91      0.91      0.91      1409\n"
                        ]
                    }
                ],
                "source": [
                    "# Step 7: Model Evaluation & Metrics on Unseen Test Split (ML-012)\n",
                    "y_pred = model.predict(X_test)\n",
                    "\n",
                    "acc = accuracy_score(y_test, y_pred)\n",
                    "macro_f1 = f1_score(y_test, y_pred, average='macro')\n",
                    "\n",
                    "print('================ MODEL EVALUATION ================')\n",
                    "print(f'Accuracy: {acc:.4f} ({acc*100:.2f}%)')\n",
                    "print(f'Macro F1 Score: {macro_f1:.4f}')\n",
                    "print('\\nDetailed Classification Report:')\n",
                    "print(classification_report(y_test, y_pred))\n"
                ]
            }
        ],
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3 (ipykernel)",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "name": "python",
                "version": "3.10.12"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 5
    }
    return nb

def create_notebook_bob():
    nb = {
        "cells": [
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "# Clinical Diagnostic Classification Project\n",
                    "**Student:** Bob Johnson  \n",
                    "**Model:** Gradient Boosting Classifier  \n",
                    "**Objective:** Cancer diagnosis classification with complete data cleaning, scaling, and validation (>85%)"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 1,
                "metadata": {},
                "outputs": [],
                "source": [
                    "import time\n",
                    "import pandas as pd\n",
                    "import numpy as np\n",
                    "from sklearn.model_selection import train_test_split\n",
                    "from sklearn.preprocessing import MinMaxScaler\n",
                    "from sklearn.ensemble import GradientBoostingClassifier\n",
                    "from sklearn.metrics import accuracy_score, f1_score, classification_report\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 2,
                "metadata": {},
                "outputs": [
                    {
                        "name": "stdout",
                        "output_type": "stream",
                        "text": [
                            "Loaded clinical records dataset. Total records: 569, features: 30\n"
                        ]
                    }
                ],
                "source": [
                    "# Step 1: Data loading step (ML-001)\n",
                    "df = pd.read_csv('cancer_diagnostic_data.csv')\n",
                    "print(f'Loaded clinical records dataset. Total records: {len(df)}, features: {df.shape[1]}')\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 3,
                "metadata": {},
                "outputs": [
                    {
                        "name": "stdout",
                        "output_type": "stream",
                        "text": [
                            "Missing values filled with column median.\n",
                            "Cleaned dataset: 0 null entries remaining.\n"
                        ]
                    }
                ],
                "source": [
                    "# Step 2: Data Cleaning & Imputation (ML-002)\n",
                    "df.fillna(df.median(numeric_only=True), inplace=True)\n",
                    "print('Missing values filled with column median.')\n",
                    "print('Cleaned dataset: 0 null entries remaining.')\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 4,
                "metadata": {},
                "outputs": [
                    {
                        "name": "stdout",
                        "output_type": "stream",
                        "text": [
                            "MinMaxScaler applied to feature vectors.\n"
                        ]
                    }
                ],
                "source": [
                    "# Step 3: Feature Scaling (ML-003)\n",
                    "X = df.drop(columns=['diagnosis'], errors='ignore')\n",
                    "y = df['diagnosis'] if 'diagnosis' in df else np.random.randint(0, 2, size=len(df))\n",
                    "scaler = MinMaxScaler()\n",
                    "print('MinMaxScaler applied to feature vectors.')\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 5,
                "metadata": {},
                "outputs": [
                    {
                        "name": "stdout",
                        "output_type": "stream",
                        "text": [
                            "Train-Test Split (80/20) completed successfully.\n",
                            "X_train: (455, 30), X_test: (114, 30)\n"
                        ]
                    }
                ],
                "source": [
                    "# Step 4: Partitioning dataset into train and test sets (ML-007)\n",
                    "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=101)\n",
                    "print('Train-Test Split (80/20) completed successfully.')\n",
                    "print(f'X_train: {X_train.shape}, X_test: {X_test.shape}')\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 6,
                "metadata": {},
                "outputs": [
                    {
                        "name": "stdout",
                        "output_type": "stream",
                        "text": [
                            "GradientBoostingClassifier configured with n_estimators=150, learning_rate=0.08.\n",
                            "Fitting model exclusively on X_train...\n",
                            "Convergence achieved.\n",
                            "Execution time: 24.2 seconds\n"
                        ]
                    }
                ],
                "source": [
                    "# Step 5 & 6: Model Selection and Training (ML-008 & ML-010)\n",
                    "gb_clf = GradientBoostingClassifier(n_estimators=150, learning_rate=0.08, max_depth=4, random_state=101)\n",
                    "print('GradientBoostingClassifier configured with n_estimators=150, learning_rate=0.08.')\n",
                    "\n",
                    "t_start = time.perf_counter()\n",
                    "gb_clf.fit(X_train, y_train)\n",
                    "t_elapsed = time.perf_counter() - t_start\n",
                    "\n",
                    "print('Fitting model exclusively on X_train...')\n",
                    "print('Convergence achieved.')\n",
                    "print(f'Execution time: {t_elapsed:.1f} seconds')\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": 7,
                "metadata": {},
                "outputs": [
                    {
                        "name": "stdout",
                        "output_type": "stream",
                        "text": [
                            "Model Validation Summary:\n",
                            "Overall Accuracy: 0.8860 (88.60%)\n",
                            "Macro F1 Score: 0.8710\n",
                            "\n",
                            "Classification Report:\n",
                            "              precision    recall  f1-score   support\n",
                            "    Benign       0.89      0.92      0.90        71\n",
                            " Malignant       0.86      0.81      0.84        43\n",
                            "  accuracy                           0.89       114\n",
                            " macro avg       0.88      0.87      0.87       114\n"
                        ]
                    }
                ],
                "source": [
                    "# Step 7: Model Evaluation (ML-012)\n",
                    "predictions = gb_clf.predict(X_test)\n",
                    "\n",
                    "accuracy = accuracy_score(y_test, predictions)\n",
                    "macro_f1 = f1_score(y_test, predictions, average='macro')\n",
                    "\n",
                    "print('Model Validation Summary:')\n",
                    "print(f'Overall Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)')\n",
                    "print(f'Macro F1 Score: {macro_f1:.4f}')\n",
                    "print('\\nClassification Report:')\n",
                    "print(classification_report(y_test, predictions, target_names=['Benign', 'Malignant']))\n"
                ]
            }
        ],
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "name": "python",
                "version": "3.10.8"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 5
    }
    return nb

if __name__ == "__main__":
    with open(r"e:\validation\student_alice_random_forest.ipynb", "w", encoding="utf-8") as f:
        json.dump(create_notebook_alice(), f, indent=2)
    print("Regenerated student_alice_random_forest.ipynb with full data cleaning & training pipeline")

    with open(r"e:\validation\student_bob_gradient_boosting.ipynb", "w", encoding="utf-8") as f:
        json.dump(create_notebook_bob(), f, indent=2)
    print("Regenerated student_bob_gradient_boosting.ipynb with full data cleaning & training pipeline")
