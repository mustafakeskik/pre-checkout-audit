/**
 * Shared error-safety helpers.
 *
 * The rule: a raw Node/system error (e.g. "spawn ETXTBSY", a stack trace, a file
 * path) must never reach the client — confusing, unprofessional, and in the worst
 * case leaks internal implementation details. Every error we deliberately throw
 * with a clear Turkish message for the user should be a UserFacingError; anything
 * else gets replaced with a generic fallback before it's sent in an HTTP response,
 * while the full original error still goes to console.error for debugging.
 */

class UserFacingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserFacingError';
    this.userFacing = true;
  }
}

const DEFAULT_FALLBACK = 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';

function toSafeErrorMessage(err, fallback = DEFAULT_FALLBACK) {
  if (!err) return fallback;
  if (err.userFacing && err.message) return err.message;
  return fallback;
}

module.exports = {
  UserFacingError,
  toSafeErrorMessage
};
