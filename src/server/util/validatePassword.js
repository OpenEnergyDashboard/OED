const zxcvbn = require('zxcvbn');

//Temproarly list, until we decide a better approach like a specific file
const COMMON_PASSWORDS = new Set([
  'password',
  '12345678',
]);

function validatePasswordPolicy(password, username, role = []) {
  const minLength = role === 'admin' ? 14 : 8;
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long.`;
  }

  // Username inclusion
  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    return 'Password must not contain your username.';
  }

  // Common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return 'Password is too common.';
  }

  // Strength check
  const result = zxcvbn(password);
  if (result.score < 3) {
    return 'Password is too weak.';
  }

  return null; // valid
}
module.exports = { validatePasswordPolicy };