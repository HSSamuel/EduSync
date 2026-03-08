const { ZodError } = require('zod');
const { sendError } = require('../utils/response');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError || err.name === 'ZodError') {
      const issues = err.issues || [];

      const errorMessages = issues.map((e) => {
        const fieldPath = e.path && e.path.length > 0 ? e.path.join('.') : 'Input';
        return `${fieldPath}: ${e.message}`;
      });

      return sendError(res, {
        status: 400,
        message: errorMessages.length > 0 ? errorMessages[0] : 'Validation Failed',
        details: errorMessages,
        code: 'VALIDATION_ERROR',
      });
    }

    next(err);
  }
};

module.exports = validate;
