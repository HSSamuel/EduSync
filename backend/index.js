require("dotenv").config({ quiet: true });
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const createApp = require("./app");
const { ACCESS_TOKEN_SECRET } = require("./utils/tokenConfig");
const { createChatRateLimiter } = require("./utils/chatRateLimiter");
const { logger } = require("./utils/logger");

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || CLIENT_URL)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const ROOM_NAME_REGEX = /^[a-zA-Z0-9 _-]{1,64}$/;
const MAX_CHAT_MESSAGE_LENGTH = 2000;
const chatRateLimiter = createChatRateLimiter({
  windowMs: Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS) || 10_000,
  maxEvents: Number(process.env.CHAT_RATE_LIMIT_MAX_EVENTS) || 8,
});

const isValidRoomName = (room) =>
  typeof room === "string" && ROOM_NAME_REGEX.test(room.trim());
const isValidMessage = (message) =>
  typeof message === "string" &&
  message.trim().length > 0 &&
  message.trim().length <= MAX_CHAT_MESSAGE_LENGTH;
const getSecureRoomName = (schoolId, roomName) =>
  `${schoolId}_${roomName.trim()}`;

const formatChatTime = (dateValue) => {
  if (!dateValue) return "--:--";
  return new Date(dateValue).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    const userQuery = await pool.query(
      `SELECT full_name, role FROM users WHERE user_id = $1`,
      [payload.user_id],
    );

    if (userQuery.rows.length === 0) {
      return next(new Error("User not found"));
    }

    socket.user = {
      id: payload.user_id,
      name: userQuery.rows[0].full_name,
      role: userQuery.rows[0].role,
      school_id: payload.school_id,
    };

    return next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  logger.info("🟢 Socket client connected", {
    socketId: socket.id,
    userId: socket.user.id,
    schoolId: socket.user.school_id,
    role: socket.user.role,
  });

  socket.on("join_room", (room) => {
    if (!isValidRoomName(room)) {
      socket.emit("chat_error", { error: "Invalid room name." });
      return;
    }

    const normalizedRoom = room.trim();
    const secureRoom = getSecureRoomName(socket.user.school_id, normalizedRoom);
    socket.join(secureRoom);
    logger.debug("Socket room joined", {
      socketId: socket.id,
      userId: socket.user.id,
      schoolId: socket.user.school_id,
      room: normalizedRoom,
    });
  });

  socket.on("leave_room", (room) => {
    if (!isValidRoomName(room)) return;

    const normalizedRoom = room.trim();
    const secureRoom = getSecureRoomName(socket.user.school_id, normalizedRoom);
    socket.leave(secureRoom);
    logger.debug("Socket room left", {
      socketId: socket.id,
      userId: socket.user.id,
      schoolId: socket.user.school_id,
      room: normalizedRoom,
    });
  });

  socket.on("send_message", async (data = {}) => {
    const room = data.room;
    const rawMessage = data.message;

    if (!isValidRoomName(room)) {
      socket.emit("chat_error", { error: "Invalid room name." });
      return;
    }

    if (!isValidMessage(rawMessage)) {
      socket.emit("chat_error", {
        error: `Message must be between 1 and ${MAX_CHAT_MESSAGE_LENGTH} characters.`,
      });
      return;
    }

    const rateLimitKey = `${socket.user.school_id}:${socket.user.id}`;
    const rateLimitResult = chatRateLimiter.consume(rateLimitKey);
    if (!rateLimitResult.allowed) {
      socket.emit("chat_error", {
        error: `Message rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.retryAfterMs / 1000)} second(s).`,
        code: "CHAT_RATE_LIMITED",
      });
      logger.warn("Socket chat rate limit triggered", {
        userId: socket.user.id,
        schoolId: socket.user.school_id,
        retryAfterMs: rateLimitResult.retryAfterMs,
      });
      return;
    }

    const normalizedRoom = room.trim();
    const normalizedMessage = rawMessage.trim();
    const secureRoom = getSecureRoomName(socket.user.school_id, normalizedRoom);

    try {
      const result = await pool.query(
        `
          INSERT INTO messages (
            room,
            message,
            sender_name,
            sender_role,
            sender_user_id,
            school_id
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING message_id, sent_at
        `,
        [
          normalizedRoom,
          normalizedMessage,
          socket.user.name,
          socket.user.role,
          socket.user.id,
          socket.user.school_id,
        ],
      );

      const persistedMessage = result.rows[0];
      const outgoingMessage = {
        id: persistedMessage.message_id,
        room: normalizedRoom,
        message: normalizedMessage,
        time: formatChatTime(persistedMessage.sent_at),
        sender: socket.user.name,
        role: socket.user.role,
        sender_user_id: socket.user.id,
      };

      io.to(secureRoom).emit("receive_message", outgoingMessage);
    } catch (err) {
      logger.error("❌ Chat persistence failed", {
        userId: socket.user.id,
        schoolId: socket.user.school_id,
        room: normalizedRoom,
        error: err,
      });
      socket.emit("chat_error", {
        error: "❌ Unable to send message right now.",
      });
    }
  });

  socket.on("disconnect", () => {
    logger.info("🔴 Socket client disconnected", {
      socketId: socket.id,
      userId: socket.user?.id,
      schoolId: socket.user?.school_id,
    });
  });
});

pool
  .connect()
  .then((client) => {
    client.release();
    logger.info("📦 Successfully connected to PostgreSQL", {
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      port: Number(process.env.DB_PORT || 5432),
    });

    server.listen(PORT, () => {
      logger.info(`🚀 HTTP and WebSocket are running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("❌ Database connection failed during bootstrap", {
      error: err,
    });
    process.exitCode = 1;
  });
