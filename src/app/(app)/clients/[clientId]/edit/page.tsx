"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditClientPage() {
  const router = useRouter();
  const { clientId } = useParams<{ clientId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    clientType: "INDIVIDUAL",
    status: "ACTIVE",
    notes: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/v1/clients/${clientId}`);
        const json = await res.json().catch(() => null);
        if (!active) return;
        if (!res.ok || !json?.success || !json.data) { setNotFound(true); return; }
        const c = json.data;
        setForm({
          name: c.name || "",
          email: c.email || "",
          phone: c.phone || "",
          company: c.company || "",
          clientType: c.clientType || "INDIVIDUAL",
          status: c.status || "ACTIVE",
          notes: c.notes || "",
        });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [clientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Client name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          company: form.company || undefined,
          clientType: form.clientType,
          status: form.status,
          notes: form.notes || undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to save changes");
      toast.success("Client updated");
      router.push(`/clients/${clientId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center" }}><Loader2 style={{ width: 24, height: 24, animation: "spin 1s linear infinite", color: "var(--gold)" }} /></div>;
  }
  if (notFound) {
    return <div style={{ padding: "2rem" }}>Client not found. <Link href="/clients" style={{ color: "var(--brand)" }}>Back to clients</Link></div>;
  }

  return (
    <div className="space-y-6">
      <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
        <div className="flex items-center gap-3">
          <Link href={`/clients/${clientId}`} className="lf-btn lf-btn-ghost" style={{ padding: "0.375rem" }} aria-label="Back to client">
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>Edit client</h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>Update this client&apos;s details</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="lf-card max-w-2xl space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="lf-label">Full Name *</label>
            <input type="text" className="lf-input" placeholder="e.g. John Smith" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div>
            <label className="lf-label">Email Address</label>
            <input type="email" className="lf-input" placeholder="client@email.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <label className="lf-label">Phone Number</label>
            <input type="tel" className="lf-input" placeholder="(555) 123-4567" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="lf-label">Client Type</label>
            <select className="lf-input" value={form.clientType} onChange={(e) => update("clientType", e.target.value)}>
              <option value="INDIVIDUAL">Individual</option>
              <option value="BUSINESS_ENTITY">Business Entity</option>
              <option value="GOVERNMENT">Government</option>
              <option value="NONPROFIT">Nonprofit</option>
              <option value="TRUST">Trust</option>
              <option value="ESTATE">Estate</option>
            </select>
          </div>
          <div>
            <label className="lf-label">Status</label>
            <select className="lf-input" value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="PROSPECT">Prospect</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="FORMER">Former</option>
              <option value="DECLINED">Declined</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="lf-label">Company</label>
            <input type="text" className="lf-input" placeholder="Company name (if applicable)" value={form.company} onChange={(e) => update("company", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="lf-label">Notes</label>
          <textarea className="lf-input" rows={3} placeholder="Any additional notes about the client..." value={form.notes} onChange={(e) => update("notes", e.target.value)} style={{ resize: "vertical" }} />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href={`/clients/${clientId}`} className="lf-btn lf-btn-outline">Cancel</Link>
          <button type="submit" className="lf-btn lf-btn-gold" disabled={saving}>
            {saving ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <Save style={{ width: 16, height: 16 }} />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
