const { sendError } = require('../utils/response');

function permit(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, { status: 401, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, {
        status: 403,
        message: 'Access Denied.',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
}

async function resolveTeacherStudentScope(pool, user) {
  const teacherSubjects = await pool.query(
    'SELECT subject_id, subject_name FROM subjects WHERE teacher_id = $1 AND school_id = $2',
    [user.user_id, user.school_id],
  );

  if (teacherSubjects.rows.length === 0) {
    return { clause: '1 = 0', params: [] };
  }

  const subjectIds = teacherSubjects.rows.map((row) => row.subject_id);
  const subjectNames = teacherSubjects.rows
    .map((row) => row.subject_name)
    .filter(Boolean);

  const timetableCoverage = await pool.query(
    `
      SELECT DISTINCT t.class_grade
      FROM timetables t
      CROSS JOIN LATERAL jsonb_each(t.schedule) AS day_schedule(day_name, slots)
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE jsonb_typeof(day_schedule.slots)
          WHEN 'array' THEN day_schedule.slots
          ELSE '[]'::jsonb
        END
      ) AS slot(slot_json)
      WHERE t.school_id = $1
        AND (slot.slot_json ->> 'subject') = ANY($2::text[])
    `,
    [user.school_id, subjectNames],
  );

  const classGrades = timetableCoverage.rows
    .map((row) => row.class_grade)
    .filter(Boolean);

  if (classGrades.length > 0) {
    return {
      clause: 'u.school_id = $1 AND s.class_grade = ANY($2::text[])',
      params: [user.school_id, classGrades],
    };
  }

  return {
    clause: `u.school_id = $1 AND s.student_id IN (
      SELECT DISTINCT r.student_id
      FROM results r
      WHERE r.school_id = $1 AND r.subject_id = ANY($2::int[])
      UNION
      SELECT DISTINCT a.student_id
      FROM attendance a
      WHERE a.school_id = $1
    )`,
    params: [user.school_id, subjectIds],
  };
}

async function resolveStudentScope({ pool, user }) {
  if (!user?.school_id) {
    return { clause: '1 = 0', params: [] };
  }

  if (user.role === 'Admin') {
    return {
      clause: 'u.school_id = $1',
      params: [user.school_id],
    };
  }

  if (user.role === 'Student') {
    return {
      clause: 'u.school_id = $1 AND s.user_id = $2',
      params: [user.school_id, user.user_id],
    };
  }

  if (user.role === 'Parent') {
    return {
      clause: 'u.school_id = $1 AND s.parent_id = $2',
      params: [user.school_id, user.user_id],
    };
  }

  if (user.role === 'Teacher') {
    return resolveTeacherStudentScope(pool, user);
  }

  return { clause: '1 = 0', params: [] };
}

module.exports = {
  permit,
  resolveStudentScope,
};
