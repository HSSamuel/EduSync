-- CREATE THE USERS TABLE
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. STUDENTS TABLE (Links a user to their specific class)
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    class_grade VARCHAR(50) NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE
);

-- 2. SUBJECTS TABLE (e.g., Mathematics, English)
CREATE TABLE subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    teacher_id INT REFERENCES users(user_id) ON DELETE SET NULL
);

-- 3. MODULES TABLE (For uploading syllabuses and PDFs)
CREATE TABLE modules (
    module_id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. RESULTS TABLE (The grading system)
CREATE TABLE results (
    result_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    academic_term VARCHAR(50) NOT NULL,
    test_score DECIMAL(5,2) DEFAULT 0.00,
    exam_score DECIMAL(5,2) DEFAULT 0.00,
    total_score DECIMAL(5,2) GENERATED ALWAYS AS (test_score + exam_score) STORED
);

-- 5. EXTRACURRICULAR ACTIVITIES (The new scope!)
CREATE TABLE extracurriculars (
    activity_id SERIAL PRIMARY KEY,
    activity_name VARCHAR(100) NOT NULL,
    description TEXT,
    coordinator_id INT REFERENCES users(user_id) ON DELETE SET NULL
);

-- 6. STUDENT ACTIVITIES LINK (Tracks which student is in which club)
CREATE TABLE student_activities (
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    activity_id INT REFERENCES extracurriculars(activity_id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'Member',
    PRIMARY KEY (student_id, activity_id)
);

-- 7. ATTENDANCE TABLE (Daily academic scope)
CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Present', 'Absent', 'Late', 'Excused'))
);

CREATE TABLE school_documents (
    doc_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE students 
ADD COLUMN parent_id INT REFERENCES users(user_id) ON DELETE SET NULL;

CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_type VARCHAR(50) DEFAULT 'Event', -- e.g., 'Exam', 'Holiday', 'Event'
    created_by INT REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- Can be 'Pending' or 'Paid'
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quizzes (
    quiz_id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    questions JSONB NOT NULL, -- This will hold all our questions & answers!
    created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cbt_results (
    result_id SERIAL PRIMARY KEY,
    quiz_id INT REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    target_table VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Create the Schools (Tenants) Table
CREATE TABLE schools (
    school_id SERIAL PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert a "Default" School so your existing data doesn't break
INSERT INTO schools (school_name, contact_email) VALUES ('EduSync Alpha Academy', 'admin@edusync.com');

-- 3. Add school_id to core tables and set the default to School 1
ALTER TABLE users ADD COLUMN school_id INT REFERENCES schools(school_id) ON DELETE CASCADE DEFAULT 1;
ALTER TABLE subjects ADD COLUMN school_id INT REFERENCES schools(school_id) ON DELETE CASCADE DEFAULT 1;
ALTER TABLE school_documents ADD COLUMN school_id INT REFERENCES schools(school_id) ON DELETE CASCADE DEFAULT 1;
ALTER TABLE events ADD COLUMN school_id INT REFERENCES schools(school_id) ON DELETE CASCADE DEFAULT 1;
ALTER TABLE quizzes ADD COLUMN school_id INT REFERENCES schools(school_id) ON DELETE CASCADE DEFAULT 1;

-- (Optional) Remove the DEFAULT constraint now that existing rows are updated safely
ALTER TABLE users ALTER COLUMN school_id DROP DEFAULT;
ALTER TABLE subjects ALTER COLUMN school_id DROP DEFAULT;
ALTER TABLE school_documents ALTER COLUMN school_id DROP DEFAULT;
ALTER TABLE events ALTER COLUMN school_id DROP DEFAULT;
ALTER TABLE quizzes ALTER COLUMN school_id DROP DEFAULT;

ALTER TABLE modules ADD COLUMN school_id INT REFERENCES schools(school_id) ON DELETE CASCADE DEFAULT 1;
ALTER TABLE results ADD COLUMN school_id INT REFERENCES schools(school_id) ON DELETE CASCADE DEFAULT 1;
ALTER TABLE invoices ADD COLUMN school_id INT REFERENCES schools(school_id) ON DELETE CASCADE DEFAULT 1;
ALTER TABLE attendance ADD COLUMN school_id INT REFERENCES schools(school_id) ON DELETE CASCADE DEFAULT 1;

-- If you created a timetables table previously, run these as well:
ALTER TABLE timetables ADD COLUMN school_id INT REFERENCES schools(school_id) ON DELETE CASCADE DEFAULT 1;
ALTER TABLE timetables DROP CONSTRAINT IF EXISTS timetables_class_grade_key;
ALTER TABLE timetables ADD CONSTRAINT unique_class_per_school UNIQUE (class_grade, school_id);