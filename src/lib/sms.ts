/**
 * SMS Library for Fast2SMS Integration
 */

export async function sendSMS(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.error('[SMS] FAST2SMS_API_KEY is missing');
    return { success: false, error: 'SMS service configuration error' };
  }
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV SMS BYPASS] OTP ${otp} for ${phone} — skipping real SMS`);
    return { success: true };
  }

  try {
    // Fast2SMS API prefers URL-encoded form data for POST
    const formData = new URLSearchParams();
    formData.append('variables_values', otp);
    formData.append('route', 'otp');
    formData.append('numbers', phone);

    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok || !data.return) {
      console.error('[SMS] Fast2SMS Error:', data);
      return { success: false, error: data.message || 'Failed to send SMS' };
    }

    console.log(`[SMS] OTP sent successfully to ${phone}`);
    return { success: true };
  } catch (error) {
    console.error('[SMS] API request failed:', error);
    return { success: false, error: 'SMS gateway request failed' };
  }
}
