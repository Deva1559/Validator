-- ==============================================================================
-- SUPABASE SCHEMA SETUP FOR VALIDATOR PLATFORM
-- Run this script in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Student Users Table
CREATE TABLE IF NOT EXISTS public.student_users (
    id SERIAL PRIMARY KEY,
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) DEFAULT 'AIML',
    section VARCHAR(10) DEFAULT 'A',
    pin VARCHAR(50) DEFAULT '1234',
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_users_roll_no ON public.student_users(roll_no);

-- 2. Faculty Users Table
CREATE TABLE IF NOT EXISTS public.faculty_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100) DEFAULT 'AIML',
    password VARCHAR(255) NOT NULL,
    title VARCHAR(255) DEFAULT 'Faculty ML Evaluator',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faculty_users_email ON public.faculty_users(email);

-- 3. Use Case Configurations Table (7 Tracks x 15 Students)
CREATE TABLE IF NOT EXISTS public.use_case_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    accuracy DOUBLE PRECISION DEFAULT 85.0,
    macro_f1 DOUBLE PRECISION DEFAULT 80.0,
    training_time DOUBLE PRECISION DEFAULT 60.0,
    time_comparison VARCHAR(50) DEFAULT 'lower',
    student_quota INTEGER DEFAULT 15,
    description TEXT
);

-- 4. Validation Runs Table
CREATE TABLE IF NOT EXISTS public.validation_runs (
    id SERIAL PRIMARY KEY,
    student_name VARCHAR(255),
    department VARCHAR(100) DEFAULT 'AIML',
    section VARCHAR(10) DEFAULT 'A',
    roll_no VARCHAR(50) DEFAULT '24AM001',
    use_case VARCHAR(255) DEFAULT 'Traffic Sign Recognition',
    filename VARCHAR(500),
    batch_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    final_score DOUBLE PRECISION,
    overall_status VARCHAR(50) DEFAULT 'PENDING'
);

CREATE INDEX IF NOT EXISTS idx_validation_runs_student_name ON public.validation_runs(student_name);
CREATE INDEX IF NOT EXISTS idx_validation_runs_roll_no ON public.validation_runs(roll_no);
CREATE INDEX IF NOT EXISTS idx_validation_runs_use_case ON public.validation_runs(use_case);
CREATE INDEX IF NOT EXISTS idx_validation_runs_batch_id ON public.validation_runs(batch_id);

-- 5. Validation Evidence Table
CREATE TABLE IF NOT EXISTS public.validation_evidence (
    id SERIAL PRIMARY KEY,
    run_id INTEGER REFERENCES public.validation_runs(id) ON DELETE CASCADE,
    step_name VARCHAR(255),
    metric_name VARCHAR(255),
    extracted_value TEXT,
    cell_index INTEGER,
    confidence_score DOUBLE PRECISION,
    verification_status VARCHAR(50),
    baseline_value VARCHAR(100),
    difference_from_baseline VARCHAR(100),
    baseline_status VARCHAR(50)
);

-- 6. Validation Findings Table
CREATE TABLE IF NOT EXISTS public.validation_findings (
    id SERIAL PRIMARY KEY,
    run_id INTEGER REFERENCES public.validation_runs(id) ON DELETE CASCADE,
    finding_type VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    source VARCHAR(100)
);

-- 7. Scoring Breakdowns Table
CREATE TABLE IF NOT EXISTS public.scoring_breakdowns (
    id SERIAL PRIMARY KEY,
    run_id INTEGER REFERENCES public.validation_runs(id) ON DELETE CASCADE,
    metric_name VARCHAR(255),
    weight DOUBLE PRECISION,
    contribution DOUBLE PRECISION
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    run_id INTEGER REFERENCES public.validation_runs(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "user" VARCHAR(255) DEFAULT 'SYSTEM',
    action VARCHAR(255),
    details TEXT
);

-- ==============================================================================
-- POPULATE SEED DATA
-- ==============================================================================

-- Seed the 7 Default ML Use Cases (15 Students Quota Each)
INSERT INTO public.use_case_configs (name, accuracy, macro_f1, training_time, time_comparison, student_quota, description)
VALUES
    ('Traffic Sign Recognition', 88.0, 85.0, 45.0, 'lower', 15, 'Autonomous vision classification of road signs and regulatory symbols.'),
    ('Crop Leaf Disease Classification', 86.0, 82.0, 60.0, 'lower', 15, 'Agricultural AI diagnostic pipeline for early foliar pathology identification.'),
    ('Face Mask Detection', 90.0, 88.0, 30.0, 'lower', 15, 'Real-time facial occlusion audit for public health compliance verification.'),
    ('Pet Image Segmentation', 82.0, 78.0, 90.0, 'lower', 15, 'Pixel-level semantic contour mask extraction for animal morphology.'),
    ('Image Generation with GANs', 80.0, 75.0, 120.0, 'lower', 15, 'Generative adversarial distribution synthesis with fidelity metrics.'),
    ('Image Captioning', 82.0, 78.0, 100.0, 'lower', 15, 'Multimodal vision-language synthesis bridging visual features with natural language.'),
    ('Pneumonia Detection from Chest X-Rays', 92.0, 90.0, 50.0, 'lower', 15, 'High-stakes clinical radiographic screening with stringent false-negative penalties.')
ON CONFLICT (name) DO UPDATE SET
    accuracy = EXCLUDED.accuracy,
    macro_f1 = EXCLUDED.macro_f1,
    training_time = EXCLUDED.training_time,
    student_quota = EXCLUDED.student_quota,
    description = EXCLUDED.description;

-- Insert Student Users created during local testing
INSERT INTO public.student_users (roll_no, name, department, section, pin, email)
VALUES
    ('24AM010', 'Priya Sharma', 'AIML', 'A', 'secret123', '24am010@aiml.edu'),
    ('24AM001', 'Devaranjan J', 'AIML', 'A', '1559', 'devaranjan027@gmail.com')
ON CONFLICT (roll_no) DO UPDATE SET
    name = EXCLUDED.name,
    department = EXCLUDED.department,
    section = EXCLUDED.section,
    pin = EXCLUDED.pin,
    email = EXCLUDED.email;

-- Insert Faculty Users created during local testing
INSERT INTO public.faculty_users (name, email, department, password, title)
VALUES
    ('Devaranjan', 'faculty@gmail.com', 'AIML', '12345678', 'Faculty ML Evaluator')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    department = EXCLUDED.department,
    password = EXCLUDED.password,
    title = EXCLUDED.title;
