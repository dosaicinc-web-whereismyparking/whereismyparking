import { createHash, randomInt } from 'crypto';

const AUTH_SALT = process.env.AUTH_SALT || 'wheremyparking-salt-2026';

/**
 * Hash an OTP for secure storage
 */
export function hashOtp(otp: string): string {
  return createHash('sha256')
    .update(`${otp}:${AUTH_SALT}`)
    .digest('hex');
}

/**
 * Generate a 6-digit numeric OTP
 */
export function generateOtp(): string {
  return randomInt(100000, 999999).toString();
}

/**
 * Verify an input OTP against a stored hash
 */
export function verifyOtpHash(otp: string, hash: string): boolean {
  return hashOtp(otp) === hash;
}
