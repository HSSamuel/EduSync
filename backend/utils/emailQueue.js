const { Queue, Worker } = require("bullmq");
const sendEmail = require("./sendEmail");
const IORedis = require("ioredis");
require("dotenv").config();

const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  },
);

// 👈 FIX: Catch Redis connection errors so the server doesn't crash
connection.on("error", (err) => {
  console.error("❌ Redis Connection Error:", err.message);
});

const emailQueue = new Queue("email-queue", { connection });

const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    console.log(`⏳ Processing Job ${job.id}: Sending email to ${job.data.to}`);
    await sendEmail({
      to: job.data.to,
      subject: job.data.subject,
      html: job.data.html,
    });
    console.log(`✅ Job ${job.id} complete!`);
  },
  { connection },
);

emailWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed with error: ${err.message}`);
});

// 👈 FIX: Catch worker-level stalling errors
emailWorker.on("error", (err) => {
  console.error("❌ BullMQ Worker Error:", err.message);
});

module.exports = { emailQueue };
