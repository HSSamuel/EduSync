function buildSuccessPayload({ data = null, message = null, meta = null } = {}) {
  const payload = { success: true };
  if (message) payload.message = message;
  if (data !== null) payload.data = data;
  if (meta) payload.meta = meta;
  return payload;
}

function buildErrorPayload({ message, details = null, code = null } = {}) {
  const payload = { success: false, error: message || 'Request failed.' };
  if (code) payload.code = code;
  if (details) payload.details = details;
  return payload;
}

function sendSuccess(res, { status = 200, data = null, message = null, meta = null } = {}) {
  return res.status(status).json(buildSuccessPayload({ data, message, meta }));
}

function sendError(res, { status = 500, message = 'Internal Server Error', details = null, code = null } = {}) {
  return res.status(status).json(buildErrorPayload({ message, details, code }));
}

module.exports = {
  buildSuccessPayload,
  buildErrorPayload,
  sendSuccess,
  sendError,
};
