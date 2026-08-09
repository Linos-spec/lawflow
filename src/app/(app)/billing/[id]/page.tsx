"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Check, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useFirm } from "@/components/providers/firm-provider";
import { formatCurrency, formatDate } from "@/lib/utils";

interface LineItem { id: string; description: string; quantity: number; rate: number; amount: number; }
interface Invoice {
  id: string; invoiceNumber: string; totalAmount: number; paidAmount: number; paymentStatus: string;
  issueDate: string | null; dueDate: string; notes: string | null;
  client: { name: string; email: string | null; address: string | null; company: string | null } | null;
  case: { title: string; caseNumber: string } | null;
  lineItems: LineItem[];
}

const statusStyle: Record<string, { bg: string; text: string }> = {
  PAID: { bg: "#dcfce7", text: "#15803d" }, UNPAID: { bg: "#fee2e2", text: "#b91c1c" },
  PARTIAL: { bg: "#fef3c7", text: "#b45309" }, OUTSTANDING: { bg: "#fee2e2", text: "#b91c1c" },
  OVERDUE: { bg: "#fee2e2", text: "#b91c1c" }, VOID: { bg: "#f1f5f9", text: "#64748b" },
};
function label(s: string) { return s.charAt(0) + s.slice(1).toLowerCase(); }

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { firm } = useFirm();
  const [inv, setInv] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/billing/${id}`);
      if (res.status === 404) { setInv(null); return; }
      const j = await res.json();
      if (j.success) setInv(j.data);
    } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (paymentStatus: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/billing/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentStatus }) });
      if (res.ok) { toast.success("Invoice updated"); load(); } else toast.error("Could not update invoice");
    } finally { setBusy(false); }
  };

  if (loading) return <div className="lf-card"><div className="lf-empty"><Loader2 className="lf-empty-icon" style={{ animation: "spin 1s linear infinite" }} /><p className="lf-empty-title">Loading invoice…</p></div></div>;
  if (!inv) return (
    <div className="space-y-6">
      <Link href="/billing" className="lf-btn lf-btn-ghost"><ArrowLeft style={{ width: 18, height: 18 }} /> Back to Billing</Link>
      <div className="lf-card"><div className="lf-empty"><FileText className="lf-empty-icon" /><p className="lf-empty-title">Invoice not found</p></div></div>
    </div>
  );

  const balance = Math.max(0, Number(inv.totalAmount) - Number(inv.paidAmount));
  const ss = statusStyle[inv.paymentStatus] || statusStyle.UNPAID;

  return (
    <div>
      {/* Print isolation: only #invoice prints */}
      <style>{`@media print { body * { visibility: hidden !important; } #invoice, #invoice * { visibility: visible !important; } #invoice { position: absolute; inset: 0; margin: 0; box-shadow: none !important; border: none !important; } .no-print { display: none !important; } }`}</style>

      {/* Toolbar (not printed) */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <Link href="/billing" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem" }}><ArrowLeft style={{ width: 18, height: 18 }} /> Back to Billing</Link>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {inv.paymentStatus !== "PAID" && <button onClick={() => setStatus("PAID")} disabled={busy} className="lf-btn lf-btn-outline" style={{ padding: "0.5rem 0.9rem" }}><Check style={{ width: 15, height: 15 }} /> Mark paid</button>}
          <button onClick={() => window.print()} className="lf-btn lf-btn-gold" style={{ padding: "0.5rem 0.9rem" }}><Printer style={{ width: 15, height: 15 }} /> Print / Save PDF</button>
        </div>
      </div>

      {/* Invoice document */}
      <div id="invoice" className="lf-card" style={{ maxWidth: 800, margin: "0 auto", padding: "2.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)" }}>{firm?.name || "Your Firm"}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 2 }}>Invoice</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 800, color: "var(--navy)" }}>{inv.invoiceNumber}</div>
            <span style={{ display: "inline-block", marginTop: 4, fontSize: "0.72rem", fontWeight: 700, background: ss.bg, color: ss.text, padding: "0.15rem 0.6rem", borderRadius: 999 }}>{label(inv.paymentStatus)}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.75rem" }}>
          <div>
            <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)", fontWeight: 700, marginBottom: 4 }}>Bill to</p>
            <p style={{ fontWeight: 600, color: "var(--navy)" }}>{inv.client?.name || "—"}</p>
            {inv.client?.company && <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{inv.client.company}</p>}
            {inv.client?.email && <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{inv.client.email}</p>}
            {inv.client?.address && <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{inv.client.address}</p>}
          </div>
          <div style={{ textAlign: "right" }}>
            {inv.case && <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Matter: <span style={{ color: "var(--navy)", fontWeight: 600 }}>{inv.case.title}</span> · {inv.case.caseNumber}</p>}
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 6 }}>Issued: {inv.issueDate ? formatDate(inv.issueDate) : "—"}</p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Due: {formatDate(inv.dueDate)}</p>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1.75rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border-default)", fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-secondary)", textAlign: "left" }}>
              <th style={{ padding: "0.5rem 0.4rem", fontWeight: 700 }}>Description</th>
              <th style={{ padding: "0.5rem 0.4rem", fontWeight: 700, textAlign: "right", width: 70 }}>Qty</th>
              <th style={{ padding: "0.5rem 0.4rem", fontWeight: 700, textAlign: "right", width: 110 }}>Rate</th>
              <th style={{ padding: "0.5rem 0.4rem", fontWeight: 700, textAlign: "right", width: 120 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.lineItems.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: "0.8rem 0.4rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>No line items.</td></tr>
            ) : inv.lineItems.map((li) => (
              <tr key={li.id} style={{ borderBottom: "1px solid var(--border-light)", fontSize: "0.88rem", color: "var(--navy)" }}>
                <td style={{ padding: "0.6rem 0.4rem" }}>{li.description}</td>
                <td style={{ padding: "0.6rem 0.4rem", textAlign: "right" }}>{li.quantity}</td>
                <td style={{ padding: "0.6rem 0.4rem", textAlign: "right" }}>{formatCurrency(Number(li.rate))}</td>
                <td style={{ padding: "0.6rem 0.4rem", textAlign: "right", fontWeight: 600 }}>{formatCurrency(Number(li.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
          <div style={{ width: 260 }}>
            <Line l="Total" v={formatCurrency(Number(inv.totalAmount))} />
            <Line l="Paid" v={formatCurrency(Number(inv.paidAmount))} />
            <div style={{ borderTop: "2px solid var(--border-default)", marginTop: 6, paddingTop: 6 }}>
              <Line l="Balance due" v={formatCurrency(balance)} bold />
            </div>
          </div>
        </div>

        {inv.notes && <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "1.5rem", borderTop: "1px solid var(--border-light)", paddingTop: "0.75rem" }}>{inv.notes}</p>}
      </div>

      <p className="no-print" style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "1rem" }}>
        Emailing invoices to clients requires a connected mail provider — for now, use Print / Save PDF to send it yourself.
      </p>
    </div>
  );
}

function Line({ l, v, bold }: { l: string; v: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0", fontSize: bold ? "1rem" : "0.9rem" }}>
      <span style={{ color: bold ? "var(--navy)" : "var(--text-secondary)", fontWeight: bold ? 700 : 400 }}>{l}</span>
      <span style={{ color: "var(--navy)", fontWeight: bold ? 800 : 600 }}>{v}</span>
    </div>
  );
}
