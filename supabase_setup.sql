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
    assigned_use_case VARCHAR(255),
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
    student_quota INTEGER DEFAULT 19,
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
    metric_name VARCHAR(255),
    evidence_type VARCHAR(100),
    extracted_value TEXT,
    unit VARCHAR(50),
    source_cell INTEGER,
    detection_method VARCHAR(255),
    relevant_code TEXT,
    relevant_output TEXT,
    confidence_score DOUBLE PRECISION,
    verification_status VARCHAR(50),
    baseline_value VARCHAR(100),
    difference_from_baseline VARCHAR(100),
    baseline_status VARCHAR(255)
);

-- Ensure all columns exist if table was already created
ALTER TABLE public.validation_evidence ADD COLUMN IF NOT EXISTS evidence_type VARCHAR(100);
ALTER TABLE public.validation_evidence ADD COLUMN IF NOT EXISTS source_cell INTEGER;
ALTER TABLE public.validation_evidence ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
ALTER TABLE public.validation_evidence ADD COLUMN IF NOT EXISTS detection_method VARCHAR(255);
ALTER TABLE public.validation_evidence ADD COLUMN IF NOT EXISTS relevant_code TEXT;
ALTER TABLE public.validation_evidence ADD COLUMN IF NOT EXISTS relevant_output TEXT;

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

-- Ensure assigned_use_case column exists
ALTER TABLE public.student_users ADD COLUMN IF NOT EXISTS assigned_use_case VARCHAR(255);

-- 8. Seed Default Faculty Evaluator Accounts
INSERT INTO public.faculty_users (name, email, department, password, title)
VALUES 
    ('Dr. Karunakaran', 'karunakaran@aiml.edu', 'AIML', 'karunakaran@aiml', 'Faculty ML Evaluator / Department Head')
ON CONFLICT (email) DO NOTHING;

-- 8. Seed All 130 Students with Chained Use Case Tracks (1 to 7)
INSERT INTO public.student_users (roll_no, name, department, section, pin, email, assigned_use_case)
VALUES
    ('722824148001', 'G S ABINIVAS', 'AIML', 'A', '722824148001', '722824148001@institution.edu', 'Traffic Sign Recognition'),
    ('722824148002', 'V C ADITH', 'AIML', 'A', '722824148002', '722824148002@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148003', 'M K AJAY SHASHTIVEL', 'AIML', 'A', '722824148003', '722824148003@institution.edu', 'Face Mask Detection'),
    ('722824148004', 'AKASH B', 'AIML', 'A', '722824148004', '722824148004@institution.edu', 'Pet Image Segmentation'),
    ('722824148005', 'AKHILESH M P', 'AIML', 'A', '722824148005', '722824148005@institution.edu', 'Image Generation with GANs'),
    ('722824148006', 'AKSHATHA J', 'AIML', 'A', '722824148006', '722824148006@institution.edu', 'Image Captioning'),
    ('722824148007', 'AMIRTHAVARSHINI S', 'AIML', 'A', '722824148007', '722824148007@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148008', 'ARULSELVI P', 'AIML', 'A', '722824148008', '722824148008@institution.edu', 'Traffic Sign Recognition'),
    ('722824148009', 'ASHWITA S', 'AIML', 'A', '722824148009', '722824148009@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148010', 'BALAGUGAN S', 'AIML', 'A', '722824148010', '722824148010@institution.edu', 'Face Mask Detection'),
    ('722824148011', 'BARATHPRIYAN R', 'AIML', 'A', '722824148011', '722824148011@institution.edu', 'Pet Image Segmentation'),
    ('722824148012', 'DEEPA SAHANA G', 'AIML', 'A', '722824148012', '722824148012@institution.edu', 'Image Generation with GANs'),
    ('722824148013', 'DEEPAK P', 'AIML', 'A', '722824148013', '722824148013@institution.edu', 'Image Captioning'),
    ('722824148014', 'DEEPAK R', 'AIML', 'A', '722824148014', '722824148014@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148015', 'DEEPIKA D', 'AIML', 'A', '722824148015', '722824148015@institution.edu', 'Traffic Sign Recognition'),
    ('722824148016', 'DEVIPRIYA K', 'AIML', 'A', '722824148016', '722824148016@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148017', 'DHAARANI M', 'AIML', 'A', '722824148017', '722824148017@institution.edu', 'Face Mask Detection'),
    ('722824148018', 'DHAKSHATHA S', 'AIML', 'A', '722824148018', '722824148018@institution.edu', 'Pet Image Segmentation'),
    ('722824148019', 'DHARANISH R P', 'AIML', 'A', '722824148019', '722824148019@institution.edu', 'Image Generation with GANs'),
    ('722824148020', 'DHARSAN S', 'AIML', 'A', '722824148020', '722824148020@institution.edu', 'Image Captioning'),
    ('722824148021', 'DHARUNKUMAR S', 'AIML', 'A', '722824148021', '722824148021@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148022', 'DIVYANANDH A S', 'AIML', 'A', '722824148022', '722824148022@institution.edu', 'Traffic Sign Recognition'),
    ('722824148023', 'EETHAMUKKALA RAMADAS PAVAN', 'AIML', 'A', '722824148023', '722824148023@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148024', 'ENOCH JASON J', 'AIML', 'A', '722824148024', '722824148024@institution.edu', 'Face Mask Detection'),
    ('722824148025', 'S FAZMINA', 'AIML', 'A', '722824148025', '722824148025@institution.edu', 'Pet Image Segmentation'),
    ('722824148026', 'GOKUL M', 'AIML', 'A', '722824148026', '722824148026@institution.edu', 'Image Generation with GANs'),
    ('722824148027', 'GOKULANAND M', 'AIML', 'A', '722824148027', '722824148027@institution.edu', 'Image Captioning'),
    ('722824148028', 'GOKULAVASAN B', 'AIML', 'A', '722824148028', '722824148028@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148029', 'HARIHARAN A', 'AIML', 'A', '722824148029', '722824148029@institution.edu', 'Traffic Sign Recognition'),
    ('722824148030', 'HARIHARAN R', 'AIML', 'A', '722824148030', '722824148030@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148031', 'HARIHARAN V S', 'AIML', 'A', '722824148031', '722824148031@institution.edu', 'Face Mask Detection'),
    ('722824148032', 'HARINI D', 'AIML', 'A', '722824148032', '722824148032@institution.edu', 'Pet Image Segmentation'),
    ('722824148033', 'HARISH K', 'AIML', 'A', '722824148033', '722824148033@institution.edu', 'Image Generation with GANs'),
    ('722824148034', 'INDHUJA V', 'AIML', 'A', '722824148034', '722824148034@institution.edu', 'Image Captioning'),
    ('722824148035', 'JANANI M', 'AIML', 'A', '722824148035', '722824148035@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148036', 'G JANANISHREE', 'AIML', 'A', '722824148036', '722824148036@institution.edu', 'Traffic Sign Recognition'),
    ('722824148037', 'JANAVI MIRUNDHA S A', 'AIML', 'A', '722824148037', '722824148037@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148038', 'JAYASHREE M', 'AIML', 'A', '722824148038', '722824148038@institution.edu', 'Face Mask Detection'),
    ('722824148039', 'JOTHINI V', 'AIML', 'A', '722824148039', '722824148039@institution.edu', 'Pet Image Segmentation'),
    ('722824148040', 'JOVIA A J', 'AIML', 'A', '722824148040', '722824148040@institution.edu', 'Image Generation with GANs'),
    ('722824148041', 'KAMALASHRINITHI P', 'AIML', 'A', '722824148041', '722824148041@institution.edu', 'Image Captioning'),
    ('722824148042', 'KANIMOZHI R', 'AIML', 'A', '722824148042', '722824148042@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148043', 'KANISHKAR B', 'AIML', 'A', '722824148043', '722824148043@institution.edu', 'Traffic Sign Recognition'),
    ('722824148044', 'KARTHICK RAJA T M', 'AIML', 'A', '722824148044', '722824148044@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148045', 'KARTHIKBALAJI S V', 'AIML', 'A', '722824148045', '722824148045@institution.edu', 'Face Mask Detection'),
    ('722824148046', 'KAVINDRA E M', 'AIML', 'A', '722824148046', '722824148046@institution.edu', 'Pet Image Segmentation'),
    ('722824148047', 'KEERTHIKUMAR K', 'AIML', 'A', '722824148047', '722824148047@institution.edu', 'Image Generation with GANs'),
    ('722824148048', 'KIRIT P S', 'AIML', 'A', '722824148048', '722824148048@institution.edu', 'Image Captioning'),
    ('722824148049', 'KISHORE V R', 'AIML', 'A', '722824148049', '722824148049@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148050', 'KUBOJA DANIEL MABUBA', 'AIML', 'A', '722824148050', '722824148050@institution.edu', 'Traffic Sign Recognition'),
    ('722824148051', 'LAKSHAN KUMAR P L', 'AIML', 'A', '722824148051', '722824148051@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148052', 'LALITKISHORE R V', 'AIML', 'A', '722824148052', '722824148052@institution.edu', 'Face Mask Detection'),
    ('722824148053', 'LIDIYA SHAINY A', 'AIML', 'A', '722824148053', '722824148053@institution.edu', 'Pet Image Segmentation'),
    ('722824148054', 'LINA G', 'AIML', 'A', '722824148054', '722824148054@institution.edu', 'Image Generation with GANs'),
    ('722824148055', 'LOGIN S', 'AIML', 'A', '722824148055', '722824148055@institution.edu', 'Image Captioning'),
    ('722824148056', 'MAHA KESHAV P', 'AIML', 'A', '722824148056', '722824148056@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148057', 'MANJUNATH S M', 'AIML', 'A', '722824148057', '722824148057@institution.edu', 'Traffic Sign Recognition'),
    ('722824148058', 'MANOJKUMAR R', 'AIML', 'A', '722824148058', '722824148058@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148059', 'MATHIVATHANI M', 'AIML', 'A', '722824148059', '722824148059@institution.edu', 'Face Mask Detection'),
    ('722824148060', 'MITHILAN K', 'AIML', 'A', '722824148060', '722824148060@institution.edu', 'Pet Image Segmentation'),
    ('722824148061', 'MOHAMED FAHIM JAMAL M', 'AIML', 'A', '722824148061', '722824148061@institution.edu', 'Image Generation with GANs'),
    ('722824148062', 'MONHIT RAJU L', 'AIML', 'A', '722824148062', '722824148062@institution.edu', 'Image Captioning'),
    ('722824148063', 'NADISH R', 'AIML', 'A', '722824148063', '722824148063@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148064', 'NILAVAN A', 'AIML', 'A', '722824148064', '722824148064@institution.edu', 'Traffic Sign Recognition'),
    ('722824148303', 'RAGUL S', 'AIML', 'A', '722824148303', '722824148303@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148065', 'NITHIN JOSHUA J', 'AIML', 'B', '722824148065', '722824148065@institution.edu', 'Face Mask Detection'),
    ('722824148066', 'NITIN A K', 'AIML', 'B', '722824148066', '722824148066@institution.edu', 'Pet Image Segmentation'),
    ('722824148067', 'NIVASH M', 'AIML', 'B', '722824148067', '722824148067@institution.edu', 'Image Generation with GANs'),
    ('722824148068', 'NIVETHIKA M', 'AIML', 'B', '722824148068', '722824148068@institution.edu', 'Image Captioning'),
    ('722824148069', 'POOJALAKSHMI PRATHAA D', 'AIML', 'B', '722824148069', '722824148069@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148070', 'PRANAV SHANKAR D', 'AIML', 'B', '722824148070', '722824148070@institution.edu', 'Traffic Sign Recognition'),
    ('722824148071', 'PRAVEEN RAJU K', 'AIML', 'B', '722824148071', '722824148071@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148072', 'PRIYAVARSHINI V', 'AIML', 'B', '722824148072', '722824148072@institution.edu', 'Face Mask Detection'),
    ('722824148073', 'PROMOTH THANGARAJ', 'AIML', 'B', '722824148073', '722824148073@institution.edu', 'Pet Image Segmentation'),
    ('722824148074', 'RAJA R', 'AIML', 'B', '722824148074', '722824148074@institution.edu', 'Image Generation with GANs'),
    ('722824148075', 'RAJAPRIYAN R', 'AIML', 'B', '722824148075', '722824148075@institution.edu', 'Image Captioning'),
    ('722824148076', 'REEGAN FERDINAND K', 'AIML', 'B', '722824148076', '722824148076@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148077', 'RITHANYA S', 'AIML', 'B', '722824148077', '722824148077@institution.edu', 'Traffic Sign Recognition'),
    ('722824148078', 'RITHISH BARATH S R', 'AIML', 'B', '722824148078', '722824148078@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148079', 'ROHITH K', 'AIML', 'B', '722824148079', '722824148079@institution.edu', 'Face Mask Detection'),
    ('722824148080', 'RUPASHREE V M', 'AIML', 'B', '722824148080', '722824148080@institution.edu', 'Pet Image Segmentation'),
    ('722824148081', 'SABARINATHAN M B', 'AIML', 'B', '722824148081', '722824148081@institution.edu', 'Image Generation with GANs'),
    ('722824148082', 'SAHANAA K', 'AIML', 'B', '722824148082', '722824148082@institution.edu', 'Image Captioning'),
    ('722824148083', 'SAKTHI LAKSHMI L V', 'AIML', 'B', '722824148083', '722824148083@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148084', 'SAMPHINEHAS S', 'AIML', 'B', '722824148084', '722824148084@institution.edu', 'Traffic Sign Recognition'),
    ('722824148085', 'SANGHAMITHRA P', 'AIML', 'B', '722824148085', '722824148085@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148086', 'SANJAY S', 'AIML', 'B', '722824148086', '722824148086@institution.edu', 'Face Mask Detection'),
    ('722824148087', 'SANJIT M', 'AIML', 'B', '722824148087', '722824148087@institution.edu', 'Pet Image Segmentation'),
    ('722824148088', 'SANJITH SENTHIL KUMAR', 'AIML', 'B', '722824148088', '722824148088@institution.edu', 'Image Generation with GANs'),
    ('722824148089', 'SANTHU MOHAMMED M', 'AIML', 'B', '722824148089', '722824148089@institution.edu', 'Image Captioning'),
    ('722824148090', 'SARVESH D', 'AIML', 'B', '722824148090', '722824148090@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148091', 'SHABHARIVAASUN K R', 'AIML', 'B', '722824148091', '722824148091@institution.edu', 'Traffic Sign Recognition'),
    ('722824148092', 'SHAMITHA S', 'AIML', 'B', '722824148092', '722824148092@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148093', 'SHANMUGA PRIYA S', 'AIML', 'B', '722824148093', '722824148093@institution.edu', 'Face Mask Detection'),
    ('722824148094', 'SHRI ASHWANTH A', 'AIML', 'B', '722824148094', '722824148094@institution.edu', 'Pet Image Segmentation'),
    ('722824148095', 'SHUBHAHARINI S', 'AIML', 'B', '722824148095', '722824148095@institution.edu', 'Image Generation with GANs'),
    ('722824148096', 'SHUDHARSHAN P', 'AIML', 'B', '722824148096', '722824148096@institution.edu', 'Image Captioning'),
    ('722824148097', 'SHUNMUGARAJ R', 'AIML', 'B', '722824148097', '722824148097@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148098', 'SINDHUJA S S', 'AIML', 'B', '722824148098', '722824148098@institution.edu', 'Traffic Sign Recognition'),
    ('722824148099', 'SOWMIGHA K A', 'AIML', 'B', '722824148099', '722824148099@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148100', 'SRI RAM S', 'AIML', 'B', '722824148100', '722824148100@institution.edu', 'Face Mask Detection'),
    ('722824148101', 'SRI SANTHOSH K', 'AIML', 'B', '722824148101', '722824148101@institution.edu', 'Pet Image Segmentation'),
    ('722824148102', 'SRINISANTH R J', 'AIML', 'B', '722824148102', '722824148102@institution.edu', 'Image Generation with GANs'),
    ('722824148103', 'SRINIVASAN R', 'AIML', 'B', '722824148103', '722824148103@institution.edu', 'Image Captioning'),
    ('722824148104', 'SRUTHI R', 'AIML', 'B', '722824148104', '722824148104@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148105', 'SURYA PRABHA P', 'AIML', 'B', '722824148105', '722824148105@institution.edu', 'Traffic Sign Recognition'),
    ('722824148106', 'SURYA R', 'AIML', 'B', '722824148106', '722824148106@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148107', 'SWETHA P', 'AIML', 'B', '722824148107', '722824148107@institution.edu', 'Face Mask Detection'),
    ('722824148108', 'TEJASVIN U', 'AIML', 'B', '722824148108', '722824148108@institution.edu', 'Pet Image Segmentation'),
    ('722824148109', 'THANVIKA B', 'AIML', 'B', '722824148109', '722824148109@institution.edu', 'Image Generation with GANs'),
    ('722824148110', 'THICKISH S', 'AIML', 'B', '722824148110', '722824148110@institution.edu', 'Image Captioning'),
    ('722824148111', 'VANDHANA G M', 'AIML', 'B', '722824148111', '722824148111@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148112', 'VARUN PRASATH M', 'AIML', 'B', '722824148112', '722824148112@institution.edu', 'Traffic Sign Recognition'),
    ('722824148113', 'VENKATESH B', 'AIML', 'B', '722824148113', '722824148113@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148114', 'VINISHRAGHAV K E', 'AIML', 'B', '722824148114', '722824148114@institution.edu', 'Face Mask Detection'),
    ('722824148115', 'VINITH KUMAR D', 'AIML', 'B', '722824148115', '722824148115@institution.edu', 'Pet Image Segmentation'),
    ('722824148116', 'VISHAL M K', 'AIML', 'B', '722824148116', '722824148116@institution.edu', 'Image Generation with GANs'),
    ('722824148117', 'VISHNU R M', 'AIML', 'B', '722824148117', '722824148117@institution.edu', 'Image Captioning'),
    ('722824148118', 'VISHNUPRIYAN P R', 'AIML', 'B', '722824148118', '722824148118@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148119', 'VISHVA KUMAR B', 'AIML', 'B', '722824148119', '722824148119@institution.edu', 'Traffic Sign Recognition'),
    ('722824148120', 'VISWAJOTHI R', 'AIML', 'B', '722824148120', '722824148120@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148121', 'VIVEK K K', 'AIML', 'B', '722824148121', '722824148121@institution.edu', 'Face Mask Detection'),
    ('722824148122', 'YADESH D', 'AIML', 'B', '722824148122', '722824148122@institution.edu', 'Pet Image Segmentation'),
    ('722824148123', 'YOGESHWARAN K', 'AIML', 'B', '722824148123', '722824148123@institution.edu', 'Image Generation with GANs'),
    ('722824148124', 'YOGITA R', 'AIML', 'B', '722824148124', '722824148124@institution.edu', 'Image Captioning'),
    ('722824148125', 'ZIDANE ASHIK', 'AIML', 'B', '722824148125', '722824148125@institution.edu', 'Pneumonia Detection from Chest X-Rays'),
    ('722824148301', 'HARISUDHARSHAN N', 'AIML', 'B', '722824148301', '722824148301@institution.edu', 'Traffic Sign Recognition'),
    ('722824148302', 'MOHAMED NUKMAAN NIHAL S', 'AIML', 'B', '722824148302', '722824148302@institution.edu', 'Crop Leaf Disease Classification'),
    ('722824148304', 'ROHITH M', 'AIML', 'B', '722824148304', '722824148304@institution.edu', 'Face Mask Detection'),
    ('722824148305', 'SRILEKA B', 'AIML', 'B', '722824148305', '722824148305@institution.edu', 'Pet Image Segmentation')
ON CONFLICT (roll_no) DO UPDATE SET
    name = EXCLUDED.name,
    section = EXCLUDED.section,
    pin = EXCLUDED.pin,
    assigned_use_case = EXCLUDED.assigned_use_case,
    email = EXCLUDED.email;
