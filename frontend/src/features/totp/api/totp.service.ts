export const totpService = {
  async setup(email: string) {
    const res = await fetch("/api/v1/totp/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error("Failed to initialize 2FA setup");
    return res.json(); // { secret, qr_code_base64, message }
  },

  async enable(email: string, code: string) {
    const res = await fetch("/api/v1/totp/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) throw new Error("Invalid verification code");
    return res.json(); // { message, backup_codes }
  },

  async verify(email: string, code: string) {
    const res = await fetch("/api/v1/totp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) throw new Error("Invalid or expired code");
    return res.json(); // { message, access_token, token_type }
  },

  async verifyBackup(email: string, backup_code: string) {
    const res = await fetch("/api/v1/totp/verify-backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, backup_code }),
    });
    if (!res.ok) throw new Error("Invalid backup code");
    return res.json(); // { message, remaining_backup_codes, access_token }
  },

  async regenerateBackups(email: string, code: string) {
    const res = await fetch("/api/v1/totp/regenerate-backup-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) throw new Error("Verification failed");
    return res.json(); // { message, backup_codes }
  },

  async disable(email: string, code: string) {
    const res = await fetch("/api/v1/totp/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) throw new Error("Verification failed");
    return res.json(); // { message }
  },
};