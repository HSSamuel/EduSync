require("dotenv").config();

if (process.env.NODE_ENV === "test" || process.env.DISABLE_REDIS === "true") {
  const noopQueue = {
    add: async (name, data) => {
      console.log(
        `[MOCK QUEUE] Pretending to queue email to: ${data?.to || "unknown"}`,
      );
      return {};
    },
    addBulk: async (jobs) => {
      console.log(`[MOCK QUEUE] Pretending to queue ${jobs.length} emails.`);
      return [];
    },
  };

  module.exports = {
    emailQueue: noopQueue,
    connection: null,
    createEmailWorker: () => null,
    emailWorker: null,
  };
} else {
  const { Queue, Worker } = require("bullmq");
  const sendEmail = require("./sendEmail");
  const IORedis = require("ioredis");

  const connection = new IORedis(
    process.env.REDIS_URL || "redis://127.0.0.1:6379",
    {
      maxRetriesPerRequest: null,
      retryStrategy(times) {
        if (process.env.NODE_ENV !== "production" && times > 3) {
          console.error(
            "❌ Redis is not running locally. Halting retries to prevent terminal spam.",
          );
          return null;
        }
        return Math.min(times * 100, 2000);
      },
    },
  );

  connection.on("error", (err) => {
    // Suppress the raw error spam after the custom retryStrategy kicks in
    if (err.code !== "ECONNREFUSED") {
      console.error("❌ Redis Connection Error:", err.message);
    }
  });

  const emailQueue = new Queue("email-queue", { connection });

  // Catch Queue errors to prevent raw stack traces from spamming the console
  emailQueue.on("error", (err) => {
    if (err.code !== "ECONNREFUSED") {
      console.error("❌ BullMQ Queue Error:", err.message);
    }
  });

  function createEmailWorker() {
    const worker = new Worker(
      "email-queue",
      async (job) => {
        console.log(
          `⏳ Processing Job ${job.id}: Sending email to ${job.data.to}`,
        );
        await sendEmail({
          to: job.data.to,
          subject: job.data.subject,
          html: job.data.html,
        });
        console.log(`✅ Job ${job.id} complete!`);
      },
      { connection },
    );

    worker.on("failed", (job, err) => {
      console.error(`❌ Job ${job?.id} failed with error: ${err.message}`);
    });

    worker.on("error", (err) => {
      if (err.code !== "ECONNREFUSED") {
        console.error("❌ BullMQ Worker Error:", err.message);
      }
    });

    return worker;
  }

  let emailWorker = null;

  function shouldRunInlineWorker() {
    if (process.env.EMAIL_QUEUE_INLINE_WORKER === "true") return true;
    if (process.env.EMAIL_QUEUE_INLINE_WORKER === "false") return false;
    return process.env.NODE_ENV !== "production";
  }

  if (shouldRunInlineWorker()) {
    emailWorker = createEmailWorker();
  }

  module.exports = { emailQueue, connection, createEmailWorker, emailWorker };
}
