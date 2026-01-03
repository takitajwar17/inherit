#!/usr/bin/env node

/**
 * Admin Password Hash Generator
 * 
 * This script generates a bcrypt hash for the admin password.
 * Use the output hash in your ADMIN_PASSWORD_HASH environment variable.
 * 
 * Usage:
 *   node scripts/generate-admin-hash.js <password>
 *   node scripts/generate-admin-hash.js "my-secure-password"
 * 
 * Example:
 *   $ node scripts/generate-admin-hash.js "SuperSecure123!"
 *   
 *   ========================================
 *   Admin Password Hash Generator
 *   ========================================
 *   
 *   Password: SuperSecure123!
 *   Hash: $2a$12$...
 *   
 *   Add this to your .env file:
 *   ADMIN_PASSWORD_HASH=$2a$12$...
 *   ========================================
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Number of salt rounds (higher = more secure but slower)
const SALT_ROUNDS = 12;

/**
 * Generates a bcrypt hash for the given password
 * @param {string} password - The plaintext password to hash
 * @returns {Promise<string>} The bcrypt hash
 */
async function generateHash(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

/**
 * Generates a secure random JWT secret
 * @param {number} length - Length of the secret in bytes
 * @returns {string} The hex-encoded secret
 */
function generateJwtSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {Object} Validation result with isValid and message
 */
function validatePassword(password) {
  if (password.length < 12) {
    return { 
      isValid: false, 
      message: 'Password should be at least 12 characters long' 
    };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password should contain at least one uppercase letter' 
    };
  }
  
  if (!/[a-z]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password should contain at least one lowercase letter' 
    };
  }
  
  if (!/[0-9]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password should contain at least one number' 
    };
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password should contain at least one special character' 
    };
  }
  
  return { isValid: true, message: 'Password meets security requirements' };
}

async function main() {
  console.log('\n========================================');
  console.log('Admin Password Hash Generator');
  console.log('========================================\n');

  const password = process.argv[2];

  if (!password) {
    console.log('Usage: node scripts/generate-admin-hash.js <password>\n');
    console.log('Example:');
    console.log('  node scripts/generate-admin-hash.js "MySecurePassword123!"\n');
    
    // Generate example credentials
    console.log('--- Generating example credentials ---\n');
    
    const examplePassword = 'Admin' + crypto.randomBytes(4).toString('hex') + '!';
    const exampleHash = await generateHash(examplePassword);
    const jwtSecret = generateJwtSecret();
    
    console.log('Example environment variables:\n');
    console.log(`ADMIN_USERNAME=admin`);
    console.log(`ADMIN_PASSWORD_HASH=${exampleHash}`);
    console.log(`ADMIN_JWT_SECRET=${jwtSecret}`);
    console.log(`\nExample password (save this somewhere safe): ${examplePassword}`);
    console.log('\n⚠️  WARNING: Generate your own password for production use!\n');
    console.log('========================================\n');
    process.exit(0);
  }

  // Validate password strength
  const validation = validatePassword(password);
  if (!validation.isValid) {
    console.log(`⚠️  Warning: ${validation.message}`);
    console.log('Consider using a stronger password for production.\n');
  } else {
    console.log('✅ Password meets security requirements\n');
  }

  try {
    const hash = await generateHash(password);
    const jwtSecret = generateJwtSecret();
    
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}\n`);
    
    console.log('Add these to your .env file:\n');
    console.log(`ADMIN_USERNAME=admin`);
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log(`ADMIN_JWT_SECRET=${jwtSecret}`);
    
    console.log('\n========================================');
    console.log('✅ Credentials generated successfully!');
    console.log('========================================\n');
    
    // Verify the hash works
    const isValid = await bcrypt.compare(password, hash);
    if (isValid) {
      console.log('✅ Hash verification passed\n');
    } else {
      console.log('❌ Hash verification failed - this should not happen!\n');
    }
    
  } catch (error) {
    console.error('Error generating hash:', error.message);
    process.exit(1);
  }
}

main();

