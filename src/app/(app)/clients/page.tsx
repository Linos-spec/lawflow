"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  Users,
  MoreHorizontal,
  Eye,
  Edit3,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { CLIENT_TYPE_LABELS } from "@/lib/constants";

interface ClientRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  clientType: string;
  company: string | null;
  _count: { cases: number; billingRecords: number };
}

const clientTypeBadgeStyles: Record<string, { bg: string; text: string }> = {
  INDIVIDUAL: { bg: "var(--info-bg)", text: "var(--info)" },
  BUSINESS_ENTITY: { bg: "var(--warning-bg)", text: "var(--warning)" },
  GOVERNMENT: { bg: "rgba(15,27,51,0.06)", text: "var(--navy)" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/clients?limit=50");
        if (!res.ok) throw new Error("Failed to fetch clients");
        const json = await res.json();
        if (json.success) {
          setClients(json.data);
        } else {
          throw new Error(json.error || "Failed to fetch clients");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load clients");
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q))
    );
  }, [clients, search]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
        <div className="flex items-end justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
            >
              Clients
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Manage your client directory
            </p>
          </div>
          <Link href="/clients/new" className="lf-btn lf-btn-primary">
            <Plus style={{ width: 16, height: 16 }} />
            New Client
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="lf-search" style={{ maxWidth: 400 }}>
        <Search style={{ width: 16, height: 16, color: "var(--text-muted)", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Summary bar */}
      <div
        className="flex items-center gap-4 text-sm px-1"
        style={{ color: "var(--text-secondary)" }}
      >
        <span>
          <strong style={{ color: "var(--navy)" }}>{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "client" : "clients"}
        </span>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="lf-card">
          <div className="lf-empty">
            <Loader2
              className="lf-empty-icon animate-spin"
              style={{ width: 36, height: 36, color: "var(--navy)" }}
            />
            <p className="lf-empty-title">Loading clients...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="lf-card">
          <div className="lf-empty">
            <Users className="lf-empty-icon" />
            <p className="lf-empty-title">No clients found</p>
            <p className="lf-empty-desc">
              {search
                ? "Try adjusting your search."
                : "Get started by adding your first client."}
            </p>
            {!search && (
              <Link href="/clients/new" className="lf-btn lf-btn-gold">
                <Plus style={{ width: 16, height: 16 }} />
                Add First Client
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="lf-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="lf-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Cases</th>
                <th style={{ width: 48 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const ts = clientTypeBadgeStyles[c.clientType] || clientTypeBadgeStyles.INDIVIDUAL;
                return (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/clients/${c.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white flex-shrink-0"
                          style={{ background: "var(--navy)" }}
                        >
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "var(--navy)" }}>
                            {c.name}
                          </p>
                          {c.company && (
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {c.company}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {c.email || "\u2014"}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {c.phone || "\u2014"}
                      </span>
                    </td>
                    <td>
                      <span
                        className="lf-badge"
                        style={{ background: ts.bg, color: ts.text }}
                      >
                        {CLIENT_TYPE_LABELS[c.clientType] || c.clientType}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {c._count.cases}
                      </span>
                    </td>
                    <td>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === c.id ? null : c.id);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                          style={{ color: "var(--text-muted)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--bg-base)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <MoreHorizontal style={{ width: 16, height: 16 }} />
                        </button>
                        {openMenuId === c.id && (
                          <div
                            className="absolute right-0 top-full mt-1 w-36 rounded-lg p-1 shadow-xl z-50 animate-fade-in"
                            style={{
                              background: "var(--bg-card)",
                              border: "1px solid var(--border-default)",
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/clients/${c.id}`);
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-[var(--bg-base)] transition-colors"
                              style={{ color: "var(--text-primary)" }}
                            >
                              <Eye style={{ width: 14, height: 14 }} /> View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/clients/${c.id}/edit`);
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-[var(--bg-base)] transition-colors"
                              style={{ color: "var(--text-primary)" }}
                            >
                              <Edit3 style={{ width: 14, height: 14 }} /> Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.error("Delete not yet implemented");
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-[var(--bg-base)] transition-colors"
                              style={{ color: "var(--danger)" }}
                            >
                              <Trash2 style={{ width: 14, height: 14 }} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
