import { describe, it } from 'vitest';

describe('Authentication (Phase 1)', () => {
  it.todo('AUTH-01: Send OTP to mobile number via SMS gateway (MSG91 / Fast2SMS)');
  it.todo('AUTH-02: Verify OTP with 5-minute expiry and 3-attempt lockout');
  it.todo('AUTH-03: Issue JWT session token on successful OTP verification');
  it.todo('AUTH-04: Auto-logout on 30-day token expiry');
  it.todo('AUTH-05: Resend OTP with 60-second cooldown');
  it.todo('AUTH-06: Admin login restricted to whitelisted mobile numbers stored in env config');
});
