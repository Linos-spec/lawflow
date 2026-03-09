"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const matterTypes = [
  "CIVIL", "CRIMINAL", "FAMILY", "CORPORATE", "IMMIGRATION",
  "REAL_ESTATE", "BANKRUPTCY", "PERSONAL_INJURY", "OTHER",
];
const typeLabels: Record<string, string> = {
  CIVIL: "Civil", CRIMINAL: "Criminal", FAMILY: "Family",
  CORPORATE: "Corporate", IMMIGRATION: "Immigration",
  REAL_ESTATE: "Real Estate", BANKRUPTCY: "Bankruptcy",
  PERSONAL_INJURY: "Personal Injury", OTHER: "Other",
};

const referralSources = [
  "Referral", "Website", "Social Media", "Legal Directory",
  "Court Appointment", "Walk-in", "Other",
];

export default function NewIntakePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    prospectName: "",
    prospectEmail: "",
    prospectPhone: "",
    caseType: "CIVIL",
    description: "",
    referralSource: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.prospectName.trim()) {
      toast.error("Client name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectName: form.prospectName,
          prospectEmail: form.prospectEmail || undefined,
          prospectPhone: form.prospectPhone || undefined,
          caseType: form.caseType,
          description: form.description || undefined,
          notes: form.referralSource ? `Referral: ${form.referralSource}` : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit intake");
      toast.success("Intake form submitted successfully");
      router.push("/intake");
    } catch {
      toast.error("Failed to submit intake. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
        <div className="flex items-center gap-3">
          <Link href="/intake" className="lf-btn lf-btn-ghost" style={{ padding: "0.375rem" }}>
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>
              New Intake Form
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Process a new prospective client
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="lf-card max-w-2xl space-y-5">
        <div>
          <label className="lf-label">Client Name *</label>
          <input
            type="text"
            className="lf-input"
            placeholder="Full name of the prospective client"
            value={form.prospectName}
            onChange={(e) => update("prospectName", e.target.value)}
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="lf-label">Email</label>
            <input
              type="email"
              className="lf-input"
              placeholder="prospect@email.com"
              value={form.prospectEmail}
              onChange={(e) => update("prospectEmail", e.target.value)}
            />
          </div>
          <div>
            <label className="lf-label">Phone</label>
            <input
              type="tel"
              className="lf-input"
              placeholder="(555) 123-4567"
              value={form.prospectPhone}
              onChange={(e) => update("prospectPhone", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="lf-label">Matter Type</label>
          <select
            className="lf-input"
            value={form.caseType}
            onChange={(e) => update("caseType", e.target.value)}
          >
            {matterTypes.map((t) => (
              <option key={t} value={t}>{typeLabels[t]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="lf-label">Description of Matter</label>
          <textarea
            className="lf-input"
            rows={4}
            placeholder="Please describe the legal matter in detail..."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>

        <div>
          <label className="lf-label">How did you hear about us?</label>
          <select
            className="lf-input"
            value={form.referralSource}
            onChange={(e) => update("referralSource", e.target.value)}
          >
            <option value="">Select...</option>
            {referralSources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/intake" className="lf-btn lf-btn-outline">
            Cancel
          </Link>
          <button type="submit" className="lf-btn lf-btn-gold" disabled={saving}>
            <Save style={{ width: 16, height: 16 }} />
            {saving ? "Submitting..." : "Submit Intake"}
          </button>
        </div>
      </form>
    </div>
  );
}
