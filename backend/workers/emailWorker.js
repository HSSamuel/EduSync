require("dotenv").config();
const { createEmailWorker } = require("../utils/emailQueue");

createEmailWorker();
console.log("📮 Email worker started.");
