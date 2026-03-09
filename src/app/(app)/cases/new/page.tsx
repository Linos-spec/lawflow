"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const caseTypes = [
  "CIVIL", "CRIMINAL", "FAMILY", "CORPORATE", "IMMIGRATION",
  "REAL_ESTATE", "BANKRUPTCY", "PERSONAL_INJURY", "OTHER",
];

const caseTypeLabels: Record<string, string> = {
  CIVIL: "Civil", CRIMINAL: "Criminal", FAMILY: "Family",
  CORPORATE: "Corporate", IMMIGRATION: "Immigration",
  REAL_ESTATE: "Real Estate", BANKRUPTCY: "Bankruptcy",
  PERSONAL_INJURY: "Personal Injury", OTHER: "Other",
};

const caseStatuses = ["OPEN", "ACTIVE", "ON_HOLD", "PENDING"];
const statusLabels: Record<string, string> = {
  OPEN: "Open", ACTIVE: "Active", ON_HOLD: "On Hold", PENDING: "Pending",
};

export default function NewCasePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    clientId: "",
    caseType: "CIVIL",
    status: "OPEN",
    value: "",
    description: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Case title is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          caseType: form.caseType,
          status: form.status,
          description: form.description || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create case");
      toast.success("Case created successfully");
      router.push("/cases");
    } catch {
      toast.error("Failed to create case. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
        <div className="flex items-center gap-3">
          <Link href="/cases" className="lf-btn lf-btn-ghost" style={{ padding: "0.375rem" }}>
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>
              New Case
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Create a new legal case
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="lf-card max-w-2xl space-y-5">
        <div>
          <label className="lf-label">Case Title *</label>
          <input
            type="text"
            className="lf-input"
            placeholder="e.g. Martinez v. Acme Corp"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="lf-label">Case Type</label>
            <select
              className="lf-input"
              value={form.caseType}
              onChange={(e) => update("caseType", e.target.value)}
            >
              {caseTypes.map((t) => (
                <option key={t} value={t}>{caseTypeLabels[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="lf-label">Status</label>
            <select
              className="lf-input"
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
            >
              {caseStatuses.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="lf-label">Estimated Value ($)</label>
          <input
            type="number"
            className="lf-input"
            placeholder="0.00"
            value={form.value}
            onChange={(e) => update("value", e.target.value)}
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="lf-label">Description</label>
          <textarea
            className="lf-input"
            rows={4}
            placeholder="Brief description of the case..."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/cases" className="lf-btn lf-btn-outline">
            Cancel
          </Link>
          <button type="submit" className="lf-btn lf-btn-gold" disabled={saving}>
            <Save style={{ width: 16, height: 16 }} />
            {saving ? "Saving..." : "Create Case"}
          </button>
        </div>
      </form>
    </div>
  );
}
