/**
 * Policy page templates. These are STARTING POINTS, not legal advice — every
 * firm must review and adapt them with counsel before publishing. The page
 * renders a prominent notice to that effect.
 */

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
    summary: "How Linoscore collects, uses, and protects personal information.",
    sections: [
      { heading: "Information we process", body: [
        "Account data you provide (name, email, firm details) to create and manage your account.",
        "Client and matter data your firm enters, including the personal data of your clients and opposing parties. Your firm is the controller of this data; Linoscore processes it on your instructions.",
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
        "Individuals may exercise access, correction, and deletion rights by contacting the firm that controls their data, or us at privacy@linoscore.com.",
      ]},
      { heading: "Security", body: [
        "Data is encrypted in transit (TLS) and at rest. Access is role-restricted and audit-logged. See our Security Overview for details.",
      ]},
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms of Service",
    summary: "The agreement governing use of the Linoscore platform.",
    sections: [
      { heading: "The service", body: [
        "Linoscore provides practice-management software. We grant you a non-exclusive, non-transferable right to use it in accordance with these terms and your subscription.",
      ]},
      { heading: "Your responsibilities", body: [
        "You are responsible for the accuracy and lawfulness of the data you enter, for maintaining professional and ethical obligations to your clients, and for reviewing any AI-generated output before relying on it.",
        "AI features are decision-support tools, not legal advice, and may be incomplete or incorrect. You remain responsible for all professional judgments.",
      ]},
      { heading: "Fees & term", body: [
        "Fees are described in your subscription. The agreement continues until terminated as described here. You can export your data before termination.",
      ]},
      { heading: "Disclaimers & liability", body: [
        "The service is provided “as is.” To the fullest extent permitted by law, Linoscore disclaims implied warranties and limits liability as set out in your subscription agreement.",
      ]},
    ],
  },
  dpa: {
    slug: "dpa",
    title: "Data Processing Addendum",
    summary: "Terms for processing personal data on your firm's behalf (GDPR/CCPA).",
    sections: [
      { heading: "Roles", body: [
        "Your firm is the controller (or business) of client personal data; Linoscore is the processor (or service provider) and processes it only on your documented instructions.",
      ]},
      { heading: "Processing details", body: [
        "Subject matter: provision of the practice-management service. Duration: the term of your subscription. Categories of data subjects: your clients, prospective clients, and opposing parties. Categories of data: contact details, matter information, documents, and billing records.",
      ]},
      { heading: "Security & subprocessors", body: [
        "We implement appropriate technical and organizational measures (encryption, access control, audit logging). We use vetted subprocessors under equivalent data-protection terms and maintain a current subprocessor list available on request.",
      ]},
      { heading: "Data-subject requests & breach", body: [
        "We assist you in responding to data-subject requests and provide export/erasure tooling in-app. We notify you without undue delay after becoming aware of a personal-data breach.",
      ]},
      { heading: "International transfers & deletion", body: [
        "Where data is transferred across borders, we rely on appropriate safeguards (e.g. Standard Contractual Clauses). On termination we delete or return personal data as instructed.",
      ]},
    ],
  },
  security: {
    slug: "security",
    title: "Security Overview",
    summary: "How Linoscore protects your firm's and clients' data.",
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
        "To report a security concern, contact security@linoscore.com.",
      ]},
    ],
  },
};

export const POLICY_ORDER = ["privacy", "terms", "dpa", "security"];
