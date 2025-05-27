// Password validation utility for registration and reset (frontend)

/**
 * Validates a password against the following policy:
 * This policy need to match the password policy defined in the passwordYtil.js in the backend to prevent
 * the situation when the password is allowed at the frontend but then rejected by the backend
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
/**
 * Returns an object with boolean flags for each password requirement.
 * Used for live feedback in forms.
 */
export function getPasswordRequirements(password, username) {
  let containsUsername = false;
  if (username && username.length >= 3) {
    const lowerPassword = password.toLowerCase();
    const lowerUsername = username.toLowerCase();
    for (let i = 0; i < lowerUsername.length - 2; i++) {
      for (let j = i + 3; j <= lowerUsername.length; j++) {
        const part = lowerUsername.slice(i, j);
        if (lowerPassword.includes(part)) {
          containsUsername = true;
          break;
        }
      }
      if (containsUsername) break;
    }
  }
  return {
    length: password.length >= 6,
    maxLength: password.length <= 72,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[@$!%*?&]/.test(password),
    noUsername: !containsUsername
  };
} 