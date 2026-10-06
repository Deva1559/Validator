# Model Validator AI 🛡️

An advanced, explainable AI model validation and audit platform designed for educators and institutions to evaluate student machine learning assignments deterministically against custom baseline criteria.

---

## 🌟 Key Features

* **Deterministic Baseline Evaluation**: Automatically tests models against custom thresholds for **Accuracy (40%)**, **Macro F1 (40%)**, and **Training Time (20%)**.
* **Dataset Cleaning & Hygiene Audit**: Verifies missing value handling (`dropna`, `fillna`, `SimpleImputer`), duplicate row removal, and exploratory data checks.
* **Model Training Procedure & Leakage Protection**: Enforces train-test split precedence (`train_test_split < fit`), verifies fitting strictly on `X_train`, and prevents training-data evaluation leakage.
* **Cell-Level Traceable Evidence**: Traces every metric and pipeline stage directly back to notebook source cells, providing exact code snippets and execution outputs.
* **White 3D Modern Aesthetic**: Polished UI with glassmorphic cards, specular lighting, extruded buttons, and responsive drawer audits.
* **Academic Dossier Export**: One-click download of comprehensive audit dossiers in JSON format.

---

## 🏗️ Architecture

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion, Lucide Icons, Recharts.
* **Backend**: FastAPI, SQLAlchemy ORM, Uvicorn, Pydantic, Pandas, NumPy, Scikit-learn.
* **Database**: SQLite (`validation_evidence.db`) with 5 relational tables (`validation_runs`, `validation_evidence`, `scoring_breakdowns`, `validation_findings`, `audit_logs`).

---

## 🚀 Getting Started

### Prerequisites
* Python 3.10+
* Node.js 18+ and npm

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
# Windows:
python -m venv .venv
.\.venv\Scripts\activate
# Mac / Linux:
# python -m venv .venv
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend API server
python main.py
```
Backend runs at: **`http://localhost:8000`**  
Interactive API Documentation: **`http://localhost:8000/docs`**

---

### 2. Frontend Setup

Open a new terminal:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
Frontend runs at: **`http://localhost:5173`**

---

## 📂 Sample Student Notebooks
Included in the repository for immediate testing:
* `student_alice_random_forest.ipynb` - Telecom customer churn prediction using Random Forest (Acc > 91%, Macro F1 > 88%).
* `student_bob_gradient_boosting.ipynb` - Cancer diagnostic classification using Gradient Boosting (Acc > 88%, Macro F1 > 87%).

Upload them via the **Upload Projects** tab or observe their pre-seeded audit reports on the **Reports** and **Leaderboard** pages.