/**
 * Public policy content for Linoscore Legal — the legal practice-management
 * product operated by Linos LLC (a Texas limited liability company), Allen, Texas.
 * "Linoscore Legal" is the Service; "Linos LLC" / "we" is the operating entity.
 */

export const POLICY_EFFECTIVE_DATE = "August 25, 2026";
export const POLICY_ENTITY = "Linos LLC";
export const POLICY_ENTITY_LOCATION = "Allen, Texas";

// Version string recorded against each firm's click-through acceptance at signup.
// Bump this whenever the Terms or DPA change materially so acceptance is auditable.
export const POLICY_VERSION = "2026-08-25";

// Current third-party subprocessors, named in the DPA so firms can diligence them
// up front (rather than "on request"). All process data in the United States.
export const SUBPROCESSORS: { name: string; purpose: string; location: string }[] = [
  { name: "DigitalOcean, LLC", purpose: "Application hosting, managed database & storage", location: "United States (New York)" },
  { name: "Anthropic, PBC", purpose: "AI features (Claude) — zero data retention, no model training", location: "United States" },
  { name: "OpenAI, L.L.C.", purpose: "Text embeddings for search — no model training on API content", location: "United States" },
];

export type Policy = {
  slug: string;
  title: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
};

export const POLICIES: Record<string, Policy> = {
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "How Linoscore Legal collects, uses, and protects personal information.",
    sections: [
      { heading: "Information we process", body: [
        "Account data you provide (name, email, firm details) to create and manage your account.",
        "Client and matter data your firm enters, including the personal data of your clients and opposing parties. Your firm is the controller of this data; Linos LLC processes it on your instructions.",
        "Usage and device data (log data, IP address, browser type) collected automatically to operate and secure the service.",
      ]},
      { heading: "How we use information", body: [
        "To provide, maintain, and improve the service; to secure it and prevent abuse; to communicate with you; and to comply with legal obligations.",
        "We do not sell personal information. We do not use client matter content to train shared AI models.",
      ]},
      { heading: "Sharing", body: [
        "With subprocessors that help us run the service (hosting, storage, email, and — where you enable it — AI providers), under contractual data-protection terms.",
        "When required by law, or to protect rights and safety.",
      ]},
      { heading: "Retention & your choices", body: [
        "We retain data for as long as your account is active or as needed to provide the service and meet legal obligations. Your firm can export or delete client data at any time from within the app.",
        "Individuals may exercise access, correction, and deletion rights by contacting the firm that controls their data, or us at info@linosconsulting.com.",
      ]},
      { heading: "Security", body: [
        "Data is encrypted in transit (TLS) and at rest. Access is role-restricted and audit-logged. See our Security Overview for details.",
      ]},
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms of Service",
    summary: "The agreement governing use of the Linoscore Legal platform.",
    sections: [
      { heading: "The service", body: [
        "Linoscore Legal is a legal practice-management product operated by Linos LLC, a Texas limited liability company (“Linos”, “we”, “us”). We grant you a non-exclusive, non-transferable right to use it in accordance with these terms and your subscription.",
      ]},
      { heading: "Your responsibilities", body: [
        "You are responsible for the accuracy and lawfulness of the data you enter, for maintaining professional and ethical obligations to your clients, and for reviewing any AI-generated output before relying on it.",
        "AI features are decision-support tools, not legal advice, and may be incomplete or incorrect. You remain responsible for all professional judgments, including verifying scope of representation and that any fee structure (hourly, flat, or contingency) is permitted for the matter under the rules of your jurisdiction.",
        "You are solely responsible for your own client trust accounting and IOLTA obligations. The service records fees and invoices for your convenience but is not a trust-accounting system and does not hold, move, or reconcile client funds.",
      ]},
      { heading: "Your data & ownership", body: [
        "As between you and Linos LLC, your firm owns all client and matter data it enters (“Firm Data”). We claim no ownership of it and use it only to provide and secure the service on your instructions.",
        "You can export your Firm Data at any time from within the app. After termination or cancellation, you may retrieve your Firm Data for 60 days; after that window we delete or de-identify it in the ordinary course, except where retention is required by law.",
      ]},
      { heading: "Fees & term", body: [
        "Fees are described in your subscription. The agreement continues until terminated as described here. Termination for non-payment does not remove your 60-day data-retrieval window described above.",
      ]},
      { heading: "Disclaimers & liability", body: [
        "The service is provided “as is,” and to the fullest extent permitted by law Linos LLC disclaims implied warranties, including merchantability and fitness for a particular purpose.",
        "Except for the excluded claims below, Linos LLC’s total liability arising out of or relating to the service is capped at the fees you paid for the service in the twelve (12) months before the event giving rise to the claim, and neither party is liable for indirect, incidental, or consequential damages.",
        "That cap and the “as is” disclaimer do not apply to Linos LLC’s breach of its confidentiality and data-security obligations, its indemnification obligations, or liability that cannot be limited under applicable law.",
      ]},
      { heading: "Governing law & disputes", body: [
        "These terms are governed by the laws of the State of Texas, without regard to its conflict-of-law rules. The exclusive venue for any dispute arising out of or relating to these terms or the service is the state and federal courts located in Collin County, Texas, and you and Linos LLC consent to the personal jurisdiction of those courts.",
      ]},
    ],
  },
  dpa: {
    slug: "dpa",
    title: "Data Processing Addendum",
    summary: "Terms for processing personal data on your firm's behalf (GDPR/CCPA).",
    sections: [
      { heading: "Roles", body: [
        "Your firm is the controller (or business) of client personal data; Linos LLC (which operates Linoscore Legal) is the processor (or service provider) and processes it only on your documented instructions.",
      ]},
      { heading: "Processing details", body: [
        "Subject matter: provision of the practice-management service. Duration: the term of your subscription. Categories of data subjects: your clients, prospective clients, and opposing parties. Categories of data: contact details, matter information, documents, and billing records.",
      ]},
      { heading: "Security & subprocessors", body: [
        "We implement appropriate technical and organizational measures (encryption in transit and at rest, role-based access control, tenant isolation, and audit logging).",
        `We use the following subprocessors, each under equivalent data-protection terms: ${SUBPROCESSORS.map((s) => `${s.name} — ${s.purpose} (${s.location})`).join("; ")}. Our AI subprocessors do not retain your prompts to train shared models. We will give you advance notice before adding or replacing a subprocessor, and you may object on reasonable data-protection grounds.`,
      ]},
      { heading: "Data-subject requests & breach", body: [
        "We assist you in responding to data-subject requests and provide export/erasure tooling in-app.",
        "We notify you of a personal-data breach affecting your data without undue delay, and in any event within 72 hours of confirming the incident, with the information reasonably available to you at that time.",
      ]},
      { heading: "International transfers & deletion", body: [
        "Where data is transferred across borders, we rely on appropriate safeguards (e.g. Standard Contractual Clauses). On termination we return or delete personal data as instructed, and in any case delete or de-identify it within 60 days of the end of your subscription, except where retention is required by law.",
      ]},
    ],
  },
  security: {
    slug: "security",
    title: "Security Overview",
    summary: "How Linoscore Legal protects your firm's and clients' data.",
    sections: [
      { heading: "Encryption", body: [
        "All traffic is encrypted in transit with TLS. Data is encrypted at rest by our managed database and storage providers.",
      ]},
      { heading: "Access control", body: [
        "Role-based access control (Admin, Partner, Associate, Paralegal) governs sensitive actions. Every firm's data is isolated by tenant. Sensitive operations require the appropriate role.",
      ]},
      { heading: "Auditability", body: [
        "An immutable, firm-scoped audit log records who did what and when — record creation and deletion, data exports, and permission changes — and is available to firm admins.",
      ]},
      { heading: "Resilience & change management", body: [
        "The platform runs on managed cloud infrastructure with automated backups. Changes are version-controlled and reviewed before release.",
      ]},
      { heading: "Reporting", body: [
        "To report a security concern, contact info@linosconsulting.com.",
      ]},
    ],
  },
};

export const POLICY_ORDER = ["privacy", "terms", "dpa", "security"];
