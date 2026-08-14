/**
 * Intake Inbox — turn an inbound email from a prospective client into a
 * conflict-checked, AI-qualified intake (Lead).
 *
 * Each firm gets a unique intake address, e.g.
 *     intake-<firmPublicId>@intake.linoscore.com
 * A firm can publish that address, or forward info@theirfirm.com to it. An
 * email provider's inbound-parse webhook (SendGrid / Mailgun / Postmark) POSTs
 * the parsed message to /api/public/intake-email; staff can also paste an email
 * in manually. Both paths funnel through the same intake pipeline.
 *
 * Legal framing (ABA Model Rule 1.18): the sender is a *prospective client* the
 * firm may already owe confidentiality to, so every inbound email gets an
 * automatic acknowledgment making clear that no attorney–client relationship is
 * formed until a written engagement is signed, and the matter is conflict-checked
 * before anyone engages.
 */

/** Domain that carries intake addresses. Overridable per environment. */
export function intakeEmailDomain(): string {
  return (process.env.INTAKE_EMAIL_DOMAIN || "intake.linoscore.com").toLowerCase();
}

/** The firm's unique intake address, keyed by its opaque publicId. */
export function firmIntakeAddress(firmPublicId: string): string {
  return `intake-${firmPublicId}@${intakeEmailDomain()}`;
}

/**
 * Pull the firm publicId out of a recipient address like
 * "Intake <intake-abc123@intake.linoscore.com>" or a bare address. Returns null
 * if the address isn't one of ours.
 */
export function firmTokenFromAddress(recipient: string | null | undefined): string | null {
  if (!recipient) return null;
  // Grab the local-part(s); a recipient header can hold a display name + <addr>.
  const addrMatch = recipient.match(/intake-([a-zA-Z0-9-]+)@/);
  return addrMatch ? addrMatch[1] : null;
}

/**
 * Parse a From header into a display name + email.
 *   "Jane Doe <jane@x.com>"  -> { name: "Jane Doe", email: "jane@x.com" }
 *   "jane@x.com"             -> { name: "Jane",     email: "jane@x.com" }
 */
export function parseFromHeader(from: string | null | undefined): { name: string; email: string | null } {
  if (!from) return { name: "Unknown sender", email: null };
  const raw = from.trim();
  const bracket = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (bracket) {
    const name = bracket[1].trim();
    const email = bracket[2].trim().toLowerCase();
    return { name: name || nameFromEmail(email), email };
  }
  const emailMatch = raw.match(/[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+/);
  if (emailMatch) {
    const email = emailMatch[0].toLowerCase();
    return { name: nameFromEmail(email), email };
  }
  return { name: raw || "Unknown sender", email: null };
}

/** Best-effort human name from the local-part of an email ("jane.doe" -> "Jane Doe"). */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] || email;
  const words = local
    .replace(/[._-]+/g, " ")
    .replace(/\d+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return words.join(" ") || email;
}

/** Compose the description stored on the intake from an email's subject + body. */
export function composeIntakeDescription(subject: string | null | undefined, body: string | null | undefined): string {
  const s = (subject || "").trim();
  const b = normalizeEmailBody(body);
  if (s && b) return `Subject: ${s}\n\n${b}`;
  return b || s || "(no message body)";
}

/**
 * Strip quoted reply chains and signature-ish noise so the AI qualifier and the
 * attorney see the actual inquiry, not a thread. Conservative — only trims the
 * obvious markers.
 */
export function normalizeEmailBody(body: string | null | undefined): string {
  if (!body) return "";
  let text = body.replace(/\r\n/g, "\n");
  // Cut at common quoted-reply headers.
  const cutMarkers = [
    /\nOn .*wrote:\n/i,
    /\n-{2,} ?Original Message ?-{2,}/i,
    /\n_{5,}\n/,
    /\nFrom: .*\nSent: /i,
  ];
  for (const re of cutMarkers) {
    const m = text.match(re);
    if (m && m.index !== undefined) text = text.slice(0, m.index);
  }
  return text.trim().slice(0, 8000);
}

/**
 * Rule 1.18 auto-acknowledgment. Returned to the webhook so an outbound mailer
 * (once configured) can reply, and surfaced in the UI so staff can send it
 * manually today. Deliberately makes clear no relationship is formed yet.
 */
export function buildAcknowledgment(opts: { firmName: string; prospectName: string }): { subject: string; body: string } {
  const first = (opts.prospectName || "").split(/\s+/)[0] || "there";
  return {
    subject: `We received your message — ${opts.firmName}`,
    body: [
      `Dear ${first},`,
      ``,
      `Thank you for contacting ${opts.firmName}. We've received your message and a member of our team will review it and follow up with you.`,
      ``,
      `Please note: this automated acknowledgment does not create an attorney–client relationship, and nothing sent to us becomes privileged or obligates the firm to represent you until we have run a conflict-of-interest check and both signed a written engagement agreement. Please do not send sensitive documents or time-critical information until we have confirmed we can represent you.`,
      ``,
      `If your matter is urgent or involves an imminent deadline, please call our office directly.`,
      ``,
      `Sincerely,`,
      `${opts.firmName}`,
    ].join("\n"),
  };
}
