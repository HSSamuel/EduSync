-- ==========================================
-- 🧹 CLEANUP EXISTING TABLES (To prevent "already exists" errors)
-- ==========================================
DROP TABLE IF EXISTS 
    audit_logs, cbt_results, quizzes, invoices, events, 
    school_documents, attendance, timetables, student_activities, 
    extracurriculars, results, modules, subjects, 
    students, users, schools CASCADE;


-- ==========================================
-- 🏢 1. SCHOOLS (TENANTS) TABLE - MUST BE CREATED FIRST
-- ==========================================
CREATE TABLE schools (
    school_id SERIAL PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    invite_code VARCHAR(50) UNIQUE NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a "Default" School so your initial data doesn't break
INSERT INTO schools (school_name, contact_email, invite_code) 
VALUES ('EduSync Alpha Academy', 'admin@edusync.com', 'ALPHA-0001');


-- ==========================================
-- 👥 2. CORE USERS TABLE
-- ==========================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    auth_provider VARCHAR(50) DEFAULT 'local', -- 'local' or 'google'
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 🎓 3. ACADEMIC TABLES
-- ==========================================
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    parent_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    class_grade VARCHAR(50) NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    teacher_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE
);

CREATE TABLE modules (
    module_id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE results (
    result_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_term VARCHAR(50) NOT NULL,
    test_score DECIMAL(5,2) DEFAULT 0.00,
    exam_score DECIMAL(5,2) DEFAULT 0.00,
    total_score DECIMAL(5,2) GENERATED ALWAYS AS (test_score + exam_score) STORED
);


-- ==========================================
-- 📅 4. ATTENDANCE & SCHEDULES
-- ==========================================
CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Present', 'Absent', 'Late', 'Excused'))
);

CREATE TABLE timetables (
    timetable_id SERIAL PRIMARY KEY,
    class_grade VARCHAR(50) NOT NULL,
    schedule JSONB NOT NULL,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    updated_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_class_per_school UNIQUE (class_grade, school_id)
);

CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_type VARCHAR(50) DEFAULT 'Event',
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    created_by INT REFERENCES users(user_id) ON DELETE SET NULL
);


-- ==========================================
-- 💻 5. CBT (COMPUTER BASED TESTING)
-- ==========================================
CREATE TABLE quizzes (
    quiz_id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    questions JSONB NOT NULL, 
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


-- ==========================================
-- 💰 6. FINANCE & ADMINISTRATION
-- ==========================================
CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE school_documents (
    doc_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    uploaded_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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


-- ==========================================
-- 🎾 7. EXTRACURRICULAR ACTIVITIES
-- ==========================================
CREATE TABLE extracurriculars (
    activity_id SERIAL PRIMARY KEY,
    activity_name VARCHAR(100) NOT NULL,
    description TEXT,
    coordinator_id INT REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE student_activities (
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    activity_id INT REFERENCES extracurriculars(activity_id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'Member',
    PRIMARY KEY (student_id, activity_id)
);


-- ==========================================
-- 🚀 8. DATABASE PERFORMANCE INDEXES
-- ==========================================
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_results_student_id ON results(student_id);
CREATE INDEX idx_results_school_id ON results(school_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_invoices_student_id ON invoices(student_id);
CREATE INDEX idx_modules_subject_id ON modules(subject_id);