const { Queue, Worker } = require("bullmq");
const sendEmail = require("./sendEmail");
const IORedis = require("ioredis");
require("dotenv").config();

// Connect to Redis (defaults to localhost:6379, or use an Upstash URL from your .env)
const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  },
);

// 1. Create the Queue (The Inbox)
const emailQueue = new Queue("email-queue", { connection });

// 2. Create the Worker (The Processor)
const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    console.log(`⏳ Processing Job ${job.id}: Sending email to ${job.data.to}`);

    // Execute the actual email sending function
    await sendEmail({
      to: job.data.to,
      subject: job.data.subject,
      html: job.data.html,
    });

    console.log(`✅ Job ${job.id} complete!`);
  },
  { connection },
);

// Listen for worker errors
emailWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed with error ${err.message}`);
});

module.exports = { emailQueue };
