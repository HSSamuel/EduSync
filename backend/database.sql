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