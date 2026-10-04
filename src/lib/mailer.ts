import nodemailer, { type Transporter } from "nodemailer";

/**
 * Outbound email via SMTP. Configured entirely by env vars so the app runs
 * without it:
 *   SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS
 *   SMTP_SECURE ("true" for port 465 implicit TLS)
 *   EMAIL_FROM  (e.g. "Linoscore Legal <no-reply@yourfirm.com>")
 *
 * When SMTP isn't configured, sendEmail() logs the message server-side and
 * returns { delivered: false } — callers must not change behavior based on that
 * (e.g. password reset stays non-enumerating).
 */

export function mailerConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || process.env.SMTP_USER || "no-reply@linoscore.com";
}

let _transport: Transporter | null = null;
function transport(): Transporter {
  if (!_transport) {
    _transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587/STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return _transport;
}

export async function sendEmail(msg: { to: string; subject: string; html: string; text: string }): Promise<{ delivered: boolean }> {
  if (!mailerConfigured()) {
    // Dev/unconfigured fallback: log so the flow is testable before SMTP is set up.
    console.log(`[mailer:unconfigured] would send to ${msg.to} — "${msg.subject}"\n${msg.text}`);
    return { delivered: false };
  }
  try {
    await transport().sendMail({ from: fromAddress(), to: msg.to, subject: msg.subject, text: msg.text, html: msg.html });
    return { delivered: true };
  } catch (err) {
    console.error("sendEmail failed:", err);
    return { delivered: false };
  }
}
