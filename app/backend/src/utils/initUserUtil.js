import bcrypt from 'bcrypt';
import { createPortfolioForUserService } from '../services/portfolioCRUDService.js';
import { createDefaultHoldingsForPortfolioService } from '../services/holdingCRUDService.js';

/**
 * Initializes an admin user with portfolio and holdings if not already present.
 * @param {Object} options - { pool, log, constants, email, username, password, role }
 */
export async function initializeAdminUser({ pool, log, constants, email, username, password, role = 'admin' }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hashedPassword = await bcrypt.hash(password, constants.SALT_ROUNDS);
    const checkAdmin = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (checkAdmin.rows.length === 0) {
      const adminResult = await client.query(
        'INSERT INTO users (email, password, username, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [email, hashedPassword, username, role]
      );
      const adminId = adminResult.rows[0].id;
      // Create a default portfolio for the admin
      const portfolioId = await createPortfolioForUserService(adminId, client);
      // Create default holdings with the actual portfolio ID
      await createDefaultHoldingsForPortfolioService(portfolioId, client);
      await client.query('COMMIT');
      log.warn(`Admin user initialized successfully: ${email} with credentials: ${username}, ${password}`);
    } else {
      await client.query('ROLLBACK');
      log.info('Admin user already exists');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    log.error('Failed to initialize admin user:', error);
  } finally {
    client.release();
  }
}

/**
 * Initializes a normal user with portfolio and holdings if not already present.
 * @param {Object} options - { pool, log, constants, email, username, password, role }
 */
export async function initializeNormalUser({ pool, log, constants, email, username, password, role = 'user' }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hashedPassword = await bcrypt.hash(password, constants.SALT_ROUNDS);
    const checkUser = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (checkUser.rows.length === 0) {
      const userResult = await client.query(
        'INSERT INTO users (email, password, username, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [email, hashedPassword, username, role]
      );
      const userId = userResult.rows[0].id;
      // Create a default portfolio for the user
      const portfolioId = await createPortfolioForUserService(userId, client);
      // Create default holdings with the actual portfolio ID
      await createDefaultHoldingsForPortfolioService(portfolioId, client);
      await client.query('COMMIT');
      log.warn(`Normal user initialized successfully: ${email} with credentials: ${username}, ${password}`);
    } else {
      await client.query('ROLLBACK');
      log.info('Normal user already exists');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    log.error('Failed to initialize normal user:', error);
  } finally {
    client.release();
  }
}