const { z } = require("zod");

const allowedWeekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const allowedDocumentMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
];

const scheduleItemSchema = z
  .object({
    start_time: z
      .string()
      .regex(timeRegex, "start_time must be in HH:MM format"),
    end_time: z.string().regex(timeRegex, "end_time must be in HH:MM format"),
    subject: z
      .string()
      .trim()
      .min(1, "subject is required")
      .max(120, "subject is too long"),
  })
  .superRefine((slot, ctx) => {
    if (slot.start_time >= slot.end_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_time"],
        message: "end_time must be later than start_time",
      });
    }
  });

const dayScheduleSchema = z
  .array(scheduleItemSchema)
  .superRefine((slots, ctx) => {
    const sorted = [...slots].sort((a, b) =>
      a.start_time.localeCompare(b.start_time),
    );

    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i].start_time < sorted[i - 1].end_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i, "start_time"],
          message: "Time slot overlaps with the previous entry",
        });
      }
    }
  });

const timetableSchema = z.object({
  class_grade: z
    .string()
    .trim()
    .min(1, "Class Grade is required")
    .max(50, "Class Grade is too long"),
  schedule: z
    .object({
      Monday: dayScheduleSchema.default([]),
      Tuesday: dayScheduleSchema.default([]),
      Wednesday: dayScheduleSchema.default([]),
      Thursday: dayScheduleSchema.default([]),
      Friday: dayScheduleSchema.default([]),
    })
    .strict(),
});

const documentTitleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title is required")
    .max(255, "Title is too long"),
});

const broadcastSchema = z.object({
  audience: z.enum(["All", "Student", "Teacher", "Parent"]),
  subject: z
    .string()
    .trim()
    .min(3, "Subject is required")
    .max(200, "Subject is too long"),
  message: z
    .string()
    .trim()
    .min(10, "Message is too short")
    .max(5000, "Message is too long"),
});

const eventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title is required")
    .max(255, "Title is too long"),
  event_date: z
    .string()
    .trim()
    .regex(isoDateRegex, "Event date must be in YYYY-MM-DD format"),
  event_type: z
    .string()
    .trim()
    .min(2, "Event type is required")
    .max(50, "Event type is too long"),
});

module.exports = {
  allowedDocumentMimeTypes,
  allowedWeekdays,
  timetableSchema,
  documentTitleSchema,
  broadcastSchema,
  eventSchema,
  isoDateRegex,
};
