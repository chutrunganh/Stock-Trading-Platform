import bcrypt from 'bcrypt';


/**
 * Initializes an admin user with portfolio and holdings if not already present.
 * @param {Object} options - { pool, log, constants, email, username, password, role }
 */
export async function initializeAdminUser({ pool, log, constants, email, username, password, role = 'admin' }) {
  try {
    const hashedPassword = await bcrypt.hash(password, constants.SALT_ROUNDS);
    const checkAdmin = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (checkAdmin.rows.length === 0) {
      const adminResult = await pool.query(
        'INSERT INTO users (email, password, username, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [email, hashedPassword, username, role]
      );
      const adminId = adminResult.rows[0].id; // UUID string
      await pool.query(
        'INSERT INTO portfolios (user_id, cash_balance) VALUES ($1, $2)',
        [adminId, constants.INITIAL_CASH_BALANCE]
      );
      log.warn(`Admin user initialized successfully: ${email} with credentials: ${username}, ${password}`);
    } else {
      log.info('Admin user already exists');
    }
  } catch (error) {
    log.error('Failed to initialize admin user:', error);
  }
}

/**
 * Initializes a normal user with portfolio and holdings if not already present.
 * @param {Object} options - { pool, log, constants, email, username, password, role }
 */
export async function initializeNormalUser({ pool, log, constants, email, username, password, role = 'user' }) {
  try {
    const hashedPassword = await bcrypt.hash(password, constants.SALT_ROUNDS);
    const checkUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (checkUser.rows.length === 0) {
      const userResult = await pool.query(
        'INSERT INTO users (email, password, username, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [email, hashedPassword, username, role]
      );
      const userId = userResult.rows[0].id; // UUID string
      await pool.query(
        'INSERT INTO portfolios (user_id, cash_balance) VALUES ($1, $2)',
        [userId, constants.INITIAL_CASH_BALANCE]
      );
      log.warn(`Normal user initialized successfully: ${email} with credentials: ${username}, ${password}`);
    } else {
      log.info('Normal user already exists');
    }
  } catch (error) {
    log.error('Failed to initialize normal user:', error);
  }
} 