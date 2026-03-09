"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface ClientOption {
  id: string;
  name: string;
}

interface CaseOption {
  id: string;
  title: string;
  caseNumber: string;
}

interface LineItem {
  description: string;
  quantity: string;
  rate: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [form, setForm] = useState({
    clientId: "",
    caseId: "",
    billingType: "HOURLY",
    dueDate: "",
    notes: "",
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: "1", rate: "" },
  ]);

  useEffect(() => {
    fetch("/api/v1/clients?limit=200")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setClients(json.data.map((c: ClientOption) => ({ id: c.id, name: c.name })));
        }
      })
      .catch(() => toast.error("Failed to load clients"))
      .finally(() => setLoadingClients(false));

    fetch("/api/v1/cases?limit=200")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setCases(
            json.data.map((c: CaseOption) => ({
              id: c.id,
              title: c.title,
              caseNumber: c.caseNumber,
            }))
          );
        }
      })
      .catch(() => toast.error("Failed to load cases"))
      .finally(() => setLoadingCases(false));
  }, []);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateLine = (idx: number, field: keyof LineItem, value: string) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const addLine = () =>
    setLineItems((prev) => [...prev, { description: "", quantity: "1", rate: "" }]);

  const removeLine = (idx: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== idx));

  const total = lineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId) {
      toast.error("Please select a client");
      return;
    }
    if (!form.caseId) {
      toast.error("Please select a related case");
      return;
    }
    if (!form.dueDate) {
      toast.error("Due date is required");
      return;
    }
    const validLines = lineItems.filter((l) => l.description && l.rate);
    if (validLines.length === 0) {
      toast.error("Add at least one line item with description and rate");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          caseId: form.caseId,
          billingType: form.billingType,
          dueDate: new Date(form.dueDate).toISOString(),
          notes: form.notes || undefined,
          lineItems: validLines.map((l) => ({
            description: l.description,
            quantity: parseFloat(l.quantity) || 1,
            rate: parseFloat(l.rate) || 0,
            amount: (parseFloat(l.quantity) || 1) * (parseFloat(l.rate) || 0),
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to create invoice");
      }
      toast.success("Invoice created successfully");
      router.push("/billing");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create invoice.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
        <div className="flex items-center gap-3">
          <Link href="/billing" className="lf-btn lf-btn-ghost" style={{ padding: "0.375rem" }}>
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>
              New Invoice
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Create a new billing record
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="lf-card max-w-3xl space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="lf-label">Client *</label>
            <select
              className="lf-input"
              value={form.clientId}
              onChange={(e) => update("clientId", e.target.value)}
              required
            >
              <option value="">
                {loadingClients ? "Loading clients..." : "Select a client"}
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {!loadingClients && clients.length === 0 && (
              <p className="text-xs mt-1" style={{ color: "var(--warning)" }}>
                No clients found.{" "}
                <Link href="/clients/new" className="underline" style={{ color: "var(--gold)" }}>
                  Add a client first
                </Link>
              </p>
            )}
          </div>
          <div>
            <label className="lf-label">Related Case *</label>
            <select
              className="lf-input"
              value={form.caseId}
              onChange={(e) => update("caseId", e.target.value)}
              required
            >
              <option value="">
                {loadingCases ? "Loading cases..." : "Select a case"}
              </option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber ? `${c.caseNumber} — ${c.title}` : c.title}
                </option>
              ))}
            </select>
            {!loadingCases && cases.length === 0 && (
              <p className="text-xs mt-1" style={{ color: "var(--warning)" }}>
                No cases found.{" "}
                <Link href="/cases/new" className="underline" style={{ color: "var(--gold)" }}>
                  Create a case first
                </Link>
              </p>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="lf-label">Billing Type</label>
            <select
              className="lf-input"
              value={form.billingType}
              onChange={(e) => update("billingType", e.target.value)}
            >
              <option value="HOURLY">Hourly</option>
              <option value="FLAT_FEE">Flat Fee</option>
              <option value="CONTINGENCY">Contingency</option>
            </select>
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
        </div>

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="lf-label" style={{ marginBottom: 0 }}>Line Items</label>
            <button type="button" onClick={addLine} className="lf-btn lf-btn-outline" style={{ padding: "0.25rem 0.75rem", fontSize: "0.8125rem" }}>
              <Plus style={{ width: 14, height: 14 }} />
              Add Line
            </button>
          </div>
          <div className="space-y-2">
            {lineItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    className="lf-input"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLine(idx, "description", e.target.value)}
                  />
                </div>
                <div style={{ width: 80 }}>
                  <input
                    type="number"
                    className="lf-input"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                    min="0"
                    step="0.5"
                  />
                </div>
                <div style={{ width: 120 }}>
                  <input
                    type="number"
                    className="lf-input"
                    placeholder="Rate ($)"
                    value={item.rate}
                    onChange={(e) => updateLine(idx, "rate", e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={{ width: 90, paddingTop: 8 }} className="text-sm font-semibold text-right">
                  ${((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}
                </div>
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="lf-btn lf-btn-ghost"
                    style={{ padding: "0.5rem", color: "var(--danger)" }}
                  >
                    <X style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-3 pt-3" style={{ borderTop: "1px solid var(--border-light)" }}>
            <p className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}>
              Total: ${total.toFixed(2)}
            </p>
          </div>
        </div>

        <div>
          <label className="lf-label">Notes</label>
          <textarea
            className="lf-input"
            rows={3}
            placeholder="Additional invoice notes..."
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/billing" className="lf-btn lf-btn-outline">
            Cancel
          </Link>
          <button type="submit" className="lf-btn lf-btn-gold" disabled={saving}>
            <Save style={{ width: 16, height: 16 }} />
            {saving ? "Saving..." : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
