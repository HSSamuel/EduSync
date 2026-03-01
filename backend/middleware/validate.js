const { ZodError } = require("zod");

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      // Map Zod's detailed errors into a readable format
      const errorMessages = err.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`,
      );
      return res
        .status(400)
        .json({ error: "Validation Failed", details: errorMessages });
    }
    next(err);
  }
};

module.exports = validate;
