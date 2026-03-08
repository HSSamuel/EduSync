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
    const teacherSubjects = await pool.query(
      'SELECT subject_id FROM subjects WHERE teacher_id = $1 AND school_id = $2',
      [user.user_id, user.school_id],
    );

    const subjectIds = teacherSubjects.rows.map((row) => row.subject_id);

    if (subjectIds.length === 0) {
      return { clause: '1 = 0', params: [] };
    }

    return {
      clause: `u.school_id = $1 AND s.student_id IN (
        SELECT DISTINCT r.student_id
        FROM results r
        WHERE r.school_id = $1 AND r.subject_id = ANY($2::int[])
      )`,
      params: [user.school_id, subjectIds],
    };
  }

  return { clause: '1 = 0', params: [] };
}

module.exports = {
  permit,
  resolveStudentScope,
};
