const crypto = require('crypto');

const INVITE_CODE_BYTES = 8;

function generateInviteCode() {
  const hex = crypto.randomBytes(INVITE_CODE_BYTES).toString('hex').toUpperCase();
  return `${hex.slice(0, 8)}-${hex.slice(8)}`;
}

module.exports = {
  generateInviteCode,
};
