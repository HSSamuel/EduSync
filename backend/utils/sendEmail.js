const nodemailer = require("nodemailer");
const dns = require("node:dns").promises;
require("dotenv").config();

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const EMAIL_SERVICE = process.env.EMAIL_SERVICE;
const EMAIL_REQUIRE_TLS = process.env.EMAIL_REQUIRE_TLS === "true";
const EMAIL_IGNORE_TLS = process.env.EMAIL_IGNORE_TLS === "true";
const EMAIL_ALLOW_INVALID_TLS = process.env.EMAIL_ALLOW_INVALID_TLS === "true";
const EMAIL_FORCE_IPV4 = process.env.EMAIL_FORCE_IPV4 !== "false";
const EMAIL_DEBUG = process.env.EMAIL_DEBUG === "true";

if ((!EMAIL_SERVICE && !EMAIL_HOST) || !EMAIL_USER || !EMAIL_PASS) {
  console.warn(
    "Email is not fully configured. Check EMAIL_HOST or EMAIL_SERVICE, plus EMAIL_USER and EMAIL_PASS in your .env file.",
  );
}

async function buildTransportConfig() {
  const config = {
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    requireTLS: EMAIL_REQUIRE_TLS,
    ignoreTLS: EMAIL_IGNORE_TLS,
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    dnsTimeout: 15000,
    debug: EMAIL_DEBUG,
    logger: EMAIL_DEBUG,
  };

  if (EMAIL_SERVICE) {
    config.service = EMAIL_SERVICE;
    return config;
  }

  if (!EMAIL_HOST) {
    throw new Error("EMAIL_HOST is required when EMAIL_SERVICE is not set.");
  }

  if (!EMAIL_FORCE_IPV4) {
    config.host = EMAIL_HOST;
    if (EMAIL_ALLOW_INVALID_TLS) {
      config.tls = { rejectUnauthorized: false };
    }
    return config;
  }

  try {
    const ipv4Addresses = await dns.resolve4(EMAIL_HOST);
    if (!ipv4Addresses.length) {
      throw new Error(`No IPv4 address found for ${EMAIL_HOST}`);
    }

    config.host = ipv4Addresses[0];
    config.tls = {
      servername: EMAIL_HOST,
      rejectUnauthorized: !EMAIL_ALLOW_INVALID_TLS,
    };
  } catch (resolveError) {
    console.warn(
      `IPv4 resolution failed for ${EMAIL_HOST}. Falling back to hostname lookup.`,
      resolveError?.message || resolveError,
    );

    config.host = EMAIL_HOST;
    if (EMAIL_ALLOW_INVALID_TLS) {
      config.tls = { rejectUnauthorized: false };
    }
  }

  return config;
}

async function createTransporter() {
  const transportConfig = await buildTransportConfig();
  return nodemailer.createTransport(transportConfig);
}

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });

    return info;
  } catch (error) {
    console.error("Email sending failed:", error?.message || error);
    throw error;
  }
};

const verifyEmailTransport = async () => {
  const transporter = await createTransporter();
  return transporter.verify();
};

module.exports = sendEmail;
module.exports.verifyEmailTransport = verifyEmailTransport;
