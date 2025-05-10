// Password validation utility for registration and reset

/**
 * Validates a password against the following policy:
 * - 6 to 72 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one symbol (@$!%*?&)
 * - Must NOT contain the username or any substring of the username (min 3 chars, case-insensitive)
 *
 * @param {string} password
 * @param {string} username
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePassword(password, username) {
  const errors = [];
  if (typeof password !== 'string' || typeof username !== 'string') {
    errors.push('Password and username must be strings.');
    return { valid: false, errors };
  }
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }
  if (password.length > 72) {
    errors.push('Password must be no more than 72 characters.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter.');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must include at least one number.');
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must include at least one symbol (@$!%*?&).');
  }
  // Check for username or any substring of username (min 3 chars, case-insensitive)
  if (username && username.length >= 3) {
    const lowerPassword = password.toLowerCase();
    const lowerUsername = username.toLowerCase();
    for (let i = 0; i < lowerUsername.length - 2; i++) {
      for (let j = i + 3; j <= lowerUsername.length; j++) {
        const part = lowerUsername.slice(i, j);
        if (lowerPassword.includes(part)) {
          errors.push('Password must not contain your username or any part of it (min 3 chars).');
          i = lowerUsername.length; // break outer
          break;
        }
      }
    }
  }
  return { valid: errors.length === 0, errors };
} 