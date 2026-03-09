"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const deadlineTypes = [
  "FILING", "COURT_APPEARANCE", "DISCOVERY",
  "STATUTE_OF_LIMITATIONS", "CLIENT_MEETING", "INTERNAL", "OTHER",
];
const typeLabels: Record<string, string> = {
  FILING: "Filing", COURT_APPEARANCE: "Court Appearance",
  DISCOVERY: "Discovery", STATUTE_OF_LIMITATIONS: "Statute of Limitations",
  CLIENT_MEETING: "Client Meeting", INTERNAL: "Internal", OTHER: "Other",
};

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const priorityLabels: Record<string, string> = {
  LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent",
};

export default function NewDeadlinePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    deadlineType: "FILING",
    dueDate: "",
    priority: "MEDIUM",
    description: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Deadline title is required");
      return;
    }
    if (!form.dueDate) {
      toast.error("Due date is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          deadlineType: form.deadlineType,
          dueDate: new Date(form.dueDate).toISOString(),
          priority: form.priority,
          description: form.description || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create deadline");
      toast.success("Deadline created successfully");
      router.push("/deadlines");
    } catch {
      toast.error("Failed to create deadline. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
        <div className="flex items-center gap-3">
          <Link href="/deadlines" className="lf-btn lf-btn-ghost" style={{ padding: "0.375rem" }}>
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>
              New Deadline
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Set a new deadline to track
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="lf-card max-w-2xl space-y-5">
        <div>
          <label className="lf-label">Title *</label>
          <input
            type="text"
            className="lf-input"
            placeholder="e.g. File Motion to Dismiss"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="lf-label">Deadline Type</label>
            <select
              className="lf-input"
              value={form.deadlineType}
              onChange={(e) => update("deadlineType", e.target.value)}
            >
              {deadlineTypes.map((t) => (
                <option key={t} value={t}>{typeLabels[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="lf-label">Priority</label>
            <select
              className="lf-input"
              value={form.priority}
              onChange={(e) => update("priority", e.target.value)}
            >
              {priorities.map((p) => (
                <option key={p} value={p}>{priorityLabels[p]}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="lf-label">Due Date *</label>
          <input
            type="date"
            className="lf-input"
            value={form.dueDate}
            onChange={(e) => update("dueDate", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="lf-label">Description</label>
          <textarea
            className="lf-input"
            rows={3}
            placeholder="Additional details about this deadline..."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/deadlines" className="lf-btn lf-btn-outline">
            Cancel
          </Link>
          <button type="submit" className="lf-btn lf-btn-gold" disabled={saving}>
            <Save style={{ width: 16, height: 16 }} />
            {saving ? "Saving..." : "Create Deadline"}
          </button>
        </div>
      </form>
    </div>
  );
}
