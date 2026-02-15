export async function validateCaptcha(token?: string | null, remoteip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Captcha disabled in this environment
    return true;
  }
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: remoteip || "" }),
    });
    const data = await res.json();
    return !!data?.success;
  } catch {
    return false;
  }
}
