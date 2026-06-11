import { describe, it, expect } from 'vitest';
import { generateOtp, hashOtp, verifyOtpHash } from '@/lib/crypto';

/**
 * Auth unit coverage now targets the OTP primitives used by the LIVE auth flow
 * (`/api/auth/send-otp` + `/api/auth/verify-otp`). The previous suite exercised
 * the abandoned `/api/auth/login` route (GoTrue-native OTP), which was removed:
 * it was unreachable from the UI and queried `otp_rate_limits` with the wrong
 * column casing — bugs the fully-mocked test could never catch.
 */
describe('Authentication (Phase 1) — OTP primitives', () => {
  it('AUTH-01: generates a 6-digit numeric OTP', () => {
    for (let i = 0; i < 200; i++) {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
      const n = Number(otp);
      expect(n).toBeGreaterThanOrEqual(100000);
      expect(n).toBeLessThanOrEqual(999999);
    }
  });

  it('AUTH-02: hashing is deterministic and verifiable', () => {
    const otp = '123456';
    const hash = hashOtp(otp);

    // Never store the plaintext OTP in the hash.
    expect(hash).not.toContain(otp);
    expect(hash).toHaveLength(64); // sha256 hex
    // Same input → same hash (so verification works across requests).
    expect(hashOtp(otp)).toBe(hash);
    expect(verifyOtpHash(otp, hash)).toBe(true);
  });

  it('AUTH-03: rejects an incorrect OTP against a stored hash', () => {
    const hash = hashOtp('654321');
    expect(verifyOtpHash('123456', hash)).toBe(false);
    expect(verifyOtpHash('654320', hash)).toBe(false);
  });

  it('AUTH-04: distinct OTPs produce distinct hashes', () => {
    expect(hashOtp('111111')).not.toBe(hashOtp('222222'));
  });
});
