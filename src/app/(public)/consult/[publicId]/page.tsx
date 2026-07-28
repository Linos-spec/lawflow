"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Scale, Loader2, Plus, X, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { INTAKE_LANGUAGES } from "@/lib/translate";

const CASE_TYPES: { value: string; label: string }[] = [
  { value: "FAMILY", label: "Family" },
  { value: "PERSONAL_INJURY", label: "Personal Injury" },
  { value: "CRIMINAL", label: "Criminal Defense" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "IMMIGRATION", label: "Immigration" },
  { value: "BANKRUPTCY", label: "Bankruptcy" },
  { value: "CORPORATE", label: "Business / Corporate" },
  { value: "CIVIL", label: "Civil Dispute" },
  { value: "OTHER", label: "Something else" },
];

// Branching follow-up question, tailored by matter type.
type Branch = { key: string; question: string; options?: string[]; kind: "choice" | "text" | "date" };
const BRANCHES: Record<string, Branch> = {
  FAMILY: { key: "familyMatter", kind: "choice", question: "What kind of family matter is this?", options: ["Divorce", "Child custody", "Child support", "Adoption", "Other"] },
  PERSONAL_INJURY: { key: "injuryDate", kind: "date", question: "When did the injury happen?" },
  CRIMINAL: { key: "courtDate", kind: "date", question: "Do you have an upcoming court date? (leave blank if none)" },
  REAL_ESTATE: { key: "closingDeadline", kind: "date", question: "Is there a closing or transaction deadline? (leave blank if none)" },
  IMMIGRATION: { key: "immigrationDeadline", kind: "text", question: "What is your current status or any filing deadline?" },
  BANKRUPTCY: { key: "urgentFinancial", kind: "choice", question: "Are you facing foreclosure or wage garnishment?", options: ["Yes, foreclosure", "Yes, garnishment", "Not yet"] },
  CORPORATE: { key: "corporateMatter", kind: "choice", question: "What best describes the matter?", options: ["Contract", "Business formation", "Dispute / litigation", "Other"] },
};

export default function ConsultIntakePage() {
  const { publicId } = useParams<{ publicId: string }>();

  const [firmName, setFirmName] = useState<string | null>(null);
  const [loadingFirm, setLoadingFirm] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [caseType, setCaseType] = useState("");
  const [branchAnswer, setBranchAnswer] = useState("");
  const [description, setDescription] = useState("");
  const [adverseParties, setAdverseParties] = useState<string[]>([]);
  const [partyInput, setPartyInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [referralSource, setReferralSource] = useState("");
  const [consultationPreference, setConsultationPreference] = useState("");
  const [consent, setConsent] = useState(false);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/public/firm/${publicId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d?.success) setFirmName(d.data.firmName);
        else setNotFound(true);
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoadingFirm(false));
    return () => {
      active = false;
    };
  }, [publicId]);

  const branch = caseType ? BRANCHES[caseType] : undefined;

  // Step sequence adapts to whether the chosen matter has a follow-up.
  const steps = useMemo(() => {
    const s = ["contact", "matter"];
    if (branch) s.push("branch");
    s.push("details", "parties", "review");
    return s;
  }, [branch]);

  const current = steps[step];
  const progress = Math.round(((step + 1) / steps.length) * 100);

  const canAdvance = () => {
    if (current === "contact") return name.trim().length > 0 && (email.trim() || phone.trim());
    if (current === "matter") return !!caseType;
    if (current === "branch") return true; // optional
    if (current === "details") return description.trim().length > 0;
    if (current === "parties") return true; // optional
    return true;
  };

  const addParty = () => {
    const v = partyInput.trim();
    if (v && !adverseParties.includes(v)) setAdverseParties([...adverseParties, v]);
    setPartyInput("");
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    const answers: Record<string, unknown> = {};
    if (branch && branchAnswer) answers[branch.key] = branchAnswer;
    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId,
          name,
          email,
          phone,
          caseType: caseType || "OTHER",
          description,
          adverseParties,
          answers,
          intakeLanguage: language,
          referralSource,
          consultationPreference,
          consentToContact: consent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  // ── Shells ──────────────────────────────────────────
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, var(--bg-base) 0%, #EDE9E0 100%)",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--navy)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Scale style={{ width: 26, height: 26, color: "#fff" }} />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--navy)",
              marginTop: "0.75rem",
            }}
          >
            {firmName || "Client Intake"}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Tell us about your legal matter
          </p>
        </div>
        {children}
      </div>
    </div>
  );

  if (loadingFirm) {
    return (
      <Shell>
        <div className="lf-card" style={{ padding: "2rem", textAlign: "center" }}>
          <Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite", color: "var(--gold)" }} />
        </div>
      </Shell>
    );
  }

  if (notFound) {
    return (
      <Shell>
        <div className="lf-card" style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>
            This intake link is not valid. Please check the link from the firm and try again.
          </p>
        </div>
      </Shell>
    );
  }

  if (submitted) {
    return (
      <Shell>
        <div className="lf-card" style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
          <CheckCircle2 style={{ width: 48, height: 48, color: "var(--success, #2e7d5b)", margin: "0 auto" }} />
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", color: "var(--navy)", marginTop: "1rem" }}>
            Thank you, {name.split(" ")[0]}!
          </h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", fontSize: "0.9375rem", lineHeight: 1.6 }}>
            Your information has been sent to {firmName}. Their team will review your matter and reach out to you shortly to discuss next steps.
          </p>
        </div>
      </Shell>
    );
  }

  const labelStyle = { fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 600, color: "var(--navy)", marginBottom: "1rem" } as const;

  return (
    <Shell>
      <div className="lf-card" style={{ padding: "2rem" }}>
        {/* Progress */}
        <div style={{ height: 6, background: "var(--border, #e5e0d5)", borderRadius: 999, marginBottom: "1.75rem", overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "var(--gold)", transition: "width 0.3s ease" }} />
        </div>

        {error && (
          <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.875rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {current === "contact" && (
          <div>
            <p style={labelStyle}>First, how can the firm reach you?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="lf-label">Your name</label>
                <input className="lf-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="lf-label">Email</label>
                <input className="lf-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
              </div>
              <div>
                <label className="lf-label">Phone</label>
                <input className="lf-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Provide at least an email or phone number.</p>
            </div>
          </div>
        )}

        {current === "matter" && (
          <div>
            <p style={labelStyle}>What kind of legal help do you need?</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
              {CASE_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => { setCaseType(ct.value); setBranchAnswer(""); }}
                  className="lf-card"
                  style={{
                    padding: "0.875rem 0.75rem",
                    textAlign: "center",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    border: caseType === ct.value ? "2px solid var(--gold)" : "1px solid var(--border, #e5e0d5)",
                    color: caseType === ct.value ? "var(--navy)" : "var(--text-secondary)",
                    background: caseType === ct.value ? "var(--gold-bg, #faf6ec)" : "#fff",
                  }}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {current === "branch" && branch && (
          <div>
            <p style={labelStyle}>{branch.question}</p>
            {branch.kind === "choice" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {branch.options!.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setBranchAnswer(opt)}
                    className="lf-card"
                    style={{
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "0.9375rem",
                      border: branchAnswer === opt ? "2px solid var(--gold)" : "1px solid var(--border, #e5e0d5)",
                      background: branchAnswer === opt ? "var(--gold-bg, #faf6ec)" : "#fff",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {branch.kind === "date" && (
              <input className="lf-input" type="date" value={branchAnswer} onChange={(e) => setBranchAnswer(e.target.value)} />
            )}
            {branch.kind === "text" && (
              <input className="lf-input" value={branchAnswer} onChange={(e) => setBranchAnswer(e.target.value)} placeholder="Type your answer" />
            )}
          </div>
        )}

        {current === "details" && (
          <div>
            <p style={labelStyle}>In your own words, what’s going on?</p>
            <textarea
              className="lf-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Share as much or as little as you'd like. This helps the firm understand your situation."
              style={{ resize: "vertical", minHeight: 120 }}
            />
          </div>
        )}

        {current === "parties" && (
          <div>
            <p style={labelStyle}>Who else is involved on the other side?</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "-0.5rem", marginBottom: "1rem" }}>
              Names of any other people or companies involved (opposing party, employer, etc.). This lets the firm check for conflicts. Optional.
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                className="lf-input"
                value={partyInput}
                onChange={(e) => setPartyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addParty(); } }}
                placeholder="e.g. Acme Corp, John Smith"
                style={{ flex: 1 }}
              />
              <button type="button" onClick={addParty} className="lf-btn lf-btn-gold" style={{ padding: "0 1rem" }}>
                <Plus style={{ width: 18, height: 18 }} />
              </button>
            </div>
            {adverseParties.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.875rem" }}>
                {adverseParties.map((p) => (
                  <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", background: "var(--bg-base)", border: "1px solid var(--border, #e5e0d5)", borderRadius: 999, padding: "0.25rem 0.625rem", fontSize: "0.8125rem" }}>
                    {p}
                    <X style={{ width: 14, height: 14, cursor: "pointer" }} onClick={() => setAdverseParties(adverseParties.filter((x) => x !== p))} />
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {current === "review" && (
          <div>
            <p style={labelStyle}>Review &amp; submit</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", fontSize: "0.875rem" }}>
              <Row label="Name" value={name} />
              <Row label="Contact" value={[email, phone].filter(Boolean).join(" · ")} />
              <Row label="Matter" value={CASE_TYPES.find((c) => c.value === caseType)?.label || caseType} />
              {branch && branchAnswer && <Row label={branch.question} value={branchAnswer} />}
              <Row label="Details" value={description} />
              {adverseParties.length > 0 && <Row label="Other parties" value={adverseParties.join(", ")} />}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-light, #eee)" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--navy)", display: "block", marginBottom: 4 }}>What language did you fill this out in?</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid var(--border-default, #ddd)", fontSize: "0.9rem" }}>
                  {INTAKE_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>Write in your own language — the firm will receive it in English.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--navy)", display: "block", marginBottom: 4 }}>How did you hear about us?</label>
                  <input value={referralSource} onChange={(e) => setReferralSource(e.target.value)} placeholder="Referral, Google…" style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid var(--border-default, #ddd)", fontSize: "0.9rem" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--navy)", display: "block", marginBottom: 4 }}>Consultation preference</label>
                  <select value={consultationPreference} onChange={(e) => setConsultationPreference(e.target.value)} style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid var(--border-default, #ddd)", fontSize: "0.9rem" }}>
                    <option value="">No preference</option>
                    <option value="Phone">Phone</option>
                    <option value="Video">Video</option>
                    <option value="In person">In person</option>
                  </select>
                </div>
              </div>
              <label style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
                <span>I consent to being contacted by the firm about my inquiry.</span>
              </label>
            </div>
          </div>
        )}

        {/* Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.75rem" }}>
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="lf-btn"
            style={{ padding: "0.625rem 1rem", opacity: step === 0 ? 0.4 : 1, background: "transparent", color: "var(--text-secondary)" }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} /> Back
          </button>

          {current === "review" ? (
            <button type="button" onClick={submit} disabled={submitting || !consent} title={!consent ? "Please consent to be contacted" : ""} className="lf-btn lf-btn-gold" style={{ padding: "0.75rem 1.5rem", opacity: submitting || !consent ? 0.5 : 1 }}>
              {submitting && <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />}
              Submit request
            </button>
          ) : (
            <button
              type="button"
              onClick={() => canAdvance() && setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="lf-btn lf-btn-gold"
              style={{ padding: "0.75rem 1.5rem", opacity: canAdvance() ? 1 : 0.5 }}
            >
              Continue <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem" }}>
      <span style={{ color: "var(--text-muted)", minWidth: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "var(--navy)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
