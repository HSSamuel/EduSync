require("dotenv").config();

function requireEnv(name, fallback) {
  const value = process.env[name] || fallback;
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const ACCESS_TOKEN_SECRET = requireEnv("ACCESS_TOKEN_SECRET");
const REFRESH_TOKEN_SECRET = requireEnv("REFRESH_TOKEN_SECRET");
const RESET_TOKEN_SECRET = requireEnv(
  "RESET_TOKEN_SECRET",
  "dev-fallback-reset-secret",
);

if (process.env.NODE_ENV === "production") {
  if (ACCESS_TOKEN_SECRET === REFRESH_TOKEN_SECRET)
    throw new Error("Tokens must differ.");
  if (ACCESS_TOKEN_SECRET === RESET_TOKEN_SECRET)
    throw new Error("Reset token must be isolated.");
}

module.exports = {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  RESET_TOKEN_SECRET,
};
