-- ==========================================
-- EduSync database bootstrap (safe for repeat runs)
-- This script avoids destructive DROP TABLE statements.
-- Seed data is optional and uses ON CONFLICT DO NOTHING.
-- ==========================================

CREATE TABLE IF NOT EXISTS schools (
    school_id SERIAL PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    invite_code VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schools (school_name, contact_email, invite_code)
VALUES ('EduSync Alpha Academy', 'admin@edusync.com', 'ALPHA-0001')
ON CONFLICT (invite_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Teacher', 'Student', 'Parent')),
    auth_provider VARCHAR(50) DEFAULT 'local',
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS user_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    token_version INT NOT NULL DEFAULT 1,
    user_agent TEXT,
    ip_address TEXT,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    student_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    parent_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    class_grade VARCHAR(50) NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    teacher_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS modules (
    module_id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_public_id TEXT,
    file_resource_type VARCHAR(50),
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS results (
    result_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_term VARCHAR(50) NOT NULL,
    test_score DECIMAL(5,2) DEFAULT 0.00,
    exam_score DECIMAL(5,2) DEFAULT 0.00,
    total_score DECIMAL(5,2) GENERATED ALWAYS AS (test_score + exam_score) STORED,
    CONSTRAINT unique_result_per_term UNIQUE (student_id, subject_id, academic_term, school_id)
);

CREATE TABLE IF NOT EXISTS attendance (
    attendance_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
    CONSTRAINT unique_attendance_per_day UNIQUE (student_id, date, school_id)
);

CREATE TABLE IF NOT EXISTS timetables (
    timetable_id SERIAL PRIMARY KEY,
    class_grade VARCHAR(50) NOT NULL,
    schedule JSONB NOT NULL,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    updated_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_class_per_school UNIQUE (class_grade, school_id)
);

CREATE TABLE IF NOT EXISTS events (
    event_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_type VARCHAR(50) DEFAULT 'Event',
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    created_by INT REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    questions JSONB NOT NULL,
    created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cbt_results (
    result_id SERIAL PRIMARY KEY,
    quiz_id INT REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_quiz_submission_per_student UNIQUE (quiz_id, student_id, school_id)
);

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Overdue', 'Cancelled')),
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS school_documents (
    doc_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_public_id TEXT,
    file_resource_type VARCHAR(50),
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    uploaded_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    target_table VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    message_id SERIAL PRIMARY KEY,
    room VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_role VARCHAR(50) NOT NULL,
    sender_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS extracurriculars (
    activity_id SERIAL PRIMARY KEY,
    activity_name VARCHAR(100) NOT NULL,
    description TEXT,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    coordinator_id INT REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS student_activities (
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    activity_id INT REFERENCES extracurriculars(activity_id) ON DELETE CASCADE,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'Member',
    PRIMARY KEY (student_id, activity_id)
);

ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS sender_user_id INT REFERENCES users(user_id) ON DELETE SET NULL;

ALTER TABLE modules
    ADD COLUMN IF NOT EXISTS file_public_id TEXT,
    ADD COLUMN IF NOT EXISTS file_resource_type VARCHAR(50);

ALTER TABLE school_documents
    ADD COLUMN IF NOT EXISTS file_public_id TEXT,
    ADD COLUMN IF NOT EXISTS file_resource_type VARCHAR(50);

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_timetables_modtime ON timetables;
CREATE TRIGGER update_timetables_modtime
BEFORE UPDATE ON timetables
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_school_id ON results(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_modules_subject_id ON modules(subject_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_school ON messages(room, school_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);



ALTER TABLE students
    ADD COLUMN IF NOT EXISTS school_id INT REFERENCES schools(school_id) ON DELETE CASCADE;

UPDATE students s
SET school_id = u.school_id
FROM users u
WHERE s.user_id = u.user_id
  AND (s.school_id IS NULL OR s.school_id <> u.school_id);

ALTER TABLE cbt_results
    ADD COLUMN IF NOT EXISTS school_id INT REFERENCES schools(school_id) ON DELETE CASCADE;

UPDATE cbt_results cr
SET school_id = q.school_id
FROM quizzes q
WHERE cr.quiz_id = q.quiz_id
  AND (cr.school_id IS NULL OR cr.school_id <> q.school_id);

ALTER TABLE extracurriculars
    ADD COLUMN IF NOT EXISTS school_id INT REFERENCES schools(school_id) ON DELETE CASCADE;

ALTER TABLE student_activities
    ADD COLUMN IF NOT EXISTS school_id INT REFERENCES schools(school_id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_school_unique ON users(user_id, school_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_student_school_unique ON students(student_id, school_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_student_user_school'
    ) THEN
        ALTER TABLE students
            ADD CONSTRAINT unique_student_user_school UNIQUE (user_id, school_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_subject_teacher_school'
    ) THEN
        ALTER TABLE subjects
            ADD CONSTRAINT unique_subject_teacher_school UNIQUE (subject_id, school_id, teacher_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_quiz_school'
    ) THEN
        ALTER TABLE quizzes
            ADD CONSTRAINT unique_quiz_school UNIQUE (quiz_id, school_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_cbt_result_scope'
    ) THEN
        ALTER TABLE cbt_results
            ADD CONSTRAINT unique_cbt_result_scope UNIQUE (result_id, school_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_activity_school'
    ) THEN
        ALTER TABLE extracurriculars
            ADD CONSTRAINT unique_activity_school UNIQUE (activity_id, school_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_students_user_same_school'
    ) THEN
        ALTER TABLE students
            ADD CONSTRAINT fk_students_user_same_school
            FOREIGN KEY (user_id, school_id) REFERENCES users(user_id, school_id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_students_parent_same_school'
    ) THEN
        ALTER TABLE students
            ADD CONSTRAINT fk_students_parent_same_school
            FOREIGN KEY (parent_id, school_id) REFERENCES users(user_id, school_id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_subjects_teacher_same_school'
    ) THEN
        ALTER TABLE subjects
            ADD CONSTRAINT fk_subjects_teacher_same_school
            FOREIGN KEY (teacher_id, school_id) REFERENCES users(user_id, school_id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_cbt_quiz_same_school'
    ) THEN
        ALTER TABLE cbt_results
            ADD CONSTRAINT fk_cbt_quiz_same_school
            FOREIGN KEY (quiz_id, school_id) REFERENCES quizzes(quiz_id, school_id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_student_activities_activity_same_school'
    ) THEN
        ALTER TABLE student_activities
            ADD CONSTRAINT fk_student_activities_activity_same_school
            FOREIGN KEY (activity_id, school_id) REFERENCES extracurriculars(activity_id, school_id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_student_activities_student_same_school'
    ) THEN
        ALTER TABLE student_activities
            ADD CONSTRAINT fk_student_activities_student_same_school
            FOREIGN KEY (student_id, school_id) REFERENCES students(student_id, school_id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION enforce_school_scoped_role_integrity()
RETURNS TRIGGER AS $$
DECLARE
    linked_role users.role%TYPE;
    linked_school_id users.school_id%TYPE;
BEGIN
    IF TG_TABLE_NAME = 'students' THEN
        IF NEW.user_id IS NOT NULL THEN
            SELECT role, school_id INTO linked_role, linked_school_id FROM users WHERE user_id = NEW.user_id;
            IF linked_role IS DISTINCT FROM 'Student' THEN
                RAISE EXCEPTION 'students.user_id must reference a Student user';
            END IF;
            IF NEW.school_id IS DISTINCT FROM linked_school_id THEN
                RAISE EXCEPTION 'students.user_id must belong to the same school';
            END IF;
        END IF;

        IF NEW.parent_id IS NOT NULL THEN
            SELECT role, school_id INTO linked_role, linked_school_id FROM users WHERE user_id = NEW.parent_id;
            IF linked_role IS DISTINCT FROM 'Parent' THEN
                RAISE EXCEPTION 'students.parent_id must reference a Parent user';
            END IF;
            IF NEW.school_id IS DISTINCT FROM linked_school_id THEN
                RAISE EXCEPTION 'students.parent_id must belong to the same school';
            END IF;
        END IF;
    ELSIF TG_TABLE_NAME = 'subjects' AND NEW.teacher_id IS NOT NULL THEN
        SELECT role, school_id INTO linked_role, linked_school_id FROM users WHERE user_id = NEW.teacher_id;
        IF linked_role IS DISTINCT FROM 'Teacher' THEN
            RAISE EXCEPTION 'subjects.teacher_id must reference a Teacher user';
        END IF;
        IF NEW.school_id IS DISTINCT FROM linked_school_id THEN
            RAISE EXCEPTION 'subjects.teacher_id must belong to the same school';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_students_role_integrity ON students;
CREATE TRIGGER enforce_students_role_integrity
BEFORE INSERT OR UPDATE ON students
FOR EACH ROW
EXECUTE PROCEDURE enforce_school_scoped_role_integrity();

DROP TRIGGER IF EXISTS enforce_subjects_role_integrity ON subjects;
CREATE TRIGGER enforce_subjects_role_integrity
BEFORE INSERT OR UPDATE ON subjects
FOR EACH ROW
EXECUTE PROCEDURE enforce_school_scoped_role_integrity();

CREATE UNIQUE INDEX IF NOT EXISTS idx_cbt_results_quiz_student_school ON cbt_results(quiz_id, student_id, school_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school_teacher ON subjects(school_id, teacher_id);
CREATE INDEX IF NOT EXISTS idx_cbt_results_school_id ON cbt_results(school_id);
CREATE INDEX IF NOT EXISTS idx_extracurriculars_school_id ON extracurriculars(school_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_school_id ON student_activities(school_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_subject_school_unique ON subjects(subject_id, school_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_invoice_school_unique ON invoices(invoice_id, school_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_results_student_same_school'
    ) THEN
        ALTER TABLE results
            ADD CONSTRAINT fk_results_student_same_school
            FOREIGN KEY (student_id, school_id) REFERENCES students(student_id, school_id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_results_subject_same_school'
    ) THEN
        ALTER TABLE results
            ADD CONSTRAINT fk_results_subject_same_school
            FOREIGN KEY (subject_id, school_id) REFERENCES subjects(subject_id, school_id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_student_same_school'
    ) THEN
        ALTER TABLE invoices
            ADD CONSTRAINT fk_invoices_student_same_school
            FOREIGN KEY (student_id, school_id) REFERENCES students(student_id, school_id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_results_student_subject_term_school
    ON results(student_id, subject_id, academic_term, school_id);
CREATE INDEX IF NOT EXISTS idx_invoices_school_status_due_date
    ON invoices(school_id, status, due_date);
