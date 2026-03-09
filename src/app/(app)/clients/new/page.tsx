"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    clientType: "INDIVIDUAL",
    notes: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Client name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          clientType: form.clientType,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create client");
      toast.success("Client added successfully");
      router.push("/clients");
    } catch {
      toast.error("Failed to add client. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
        <div className="flex items-center gap-3">
          <Link href="/clients" className="lf-btn lf-btn-ghost" style={{ padding: "0.375rem" }}>
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>
              Add Client
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Add a new client to your firm
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="lf-card max-w-2xl space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="lf-label">Full Name *</label>
            <input
              type="text"
              className="lf-input"
              placeholder="e.g. John Smith"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="lf-label">Email Address</label>
            <input
              type="email"
              className="lf-input"
              placeholder="client@email.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div>
            <label className="lf-label">Phone Number</label>
            <input
              type="tel"
              className="lf-input"
              placeholder="(555) 123-4567"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="lf-label">Client Type</label>
          <select
            className="lf-input"
            value={form.clientType}
            onChange={(e) => update("clientType", e.target.value)}
          >
            <option value="INDIVIDUAL">Individual</option>
            <option value="BUSINESS_ENTITY">Business Entity</option>
            <option value="GOVERNMENT">Government</option>
          </select>
        </div>

        <div>
          <label className="lf-label">Address</label>
          <input
            type="text"
            className="lf-input"
            placeholder="123 Main St, City, State, ZIP"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
          />
        </div>

        <div>
          <label className="lf-label">Notes</label>
          <textarea
            className="lf-input"
            rows={3}
            placeholder="Any additional notes about the client..."
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/clients" className="lf-btn lf-btn-outline">
            Cancel
          </Link>
          <button type="submit" className="lf-btn lf-btn-gold" disabled={saving}>
            <Save style={{ width: 16, height: 16 }} />
            {saving ? "Saving..." : "Add Client"}
          </button>
        </div>
      </form>
    </div>
  );
}
