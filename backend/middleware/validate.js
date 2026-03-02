const { ZodError } = require("zod");

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError || err.name === "ZodError") {
      const issues = err.issues || [];

      const errorMessages = issues.map((e) => {
        const fieldPath =
          e.path && e.path.length > 0 ? e.path.join(".") : "Input";
        return `${fieldPath}: ${e.message}`;
      });

      // 👈 FIX: We now return the SPECIFIC error as the main message!
      return res.status(400).json({
        error:
          errorMessages.length > 0 ? errorMessages[0] : "Validation Failed",
        details: errorMessages,
      });
    }

    next(err);
  }
};

module.exports = validate;
