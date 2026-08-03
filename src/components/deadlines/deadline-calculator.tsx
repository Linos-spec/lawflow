"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Loader2, ShieldCheck, CornerDownRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Rule = {
  key: string;
  label: string;
  days: number;
  basis: "calendar" | "business";
  jurisdiction: string;
  note?: string;
};

type Result = {
  dueDate: string;
  landedOnClosure: boolean;
  rule?: Rule;
  disclaimer: string;
};

export function DeadlineCalculator() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [triggerDate, setTriggerDate] = useState("");
  const [ruleKey, setRuleKey] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/deadlines/calculate")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setRules(j.data.rules);
      })
      .catch(() => {});
  }, []);

  // Group rules by jurisdiction for a tidy <optgroup> picker.
  const grouped = useMemo(() => {
    const by: Record<string, Rule[]> = {};
    for (const r of rules) (by[r.jurisdiction] ??= []).push(r);
    return Object.entries(by);
  }, [rules]);

  const selectedRule = rules.find((r) => r.key === ruleKey);

  async function compute() {
    setError(null);
    setResult(null);
    if (!triggerDate || !ruleKey) {
      setError("Pick a trigger date and a rule.");
      return;
    }
    setComputing(true);
    try {
      const res = await fetch("/api/v1/deadlines/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggerDate, ruleKey }),
      });
      const json = await res.json();
      if (json.success) setResult(json.data);
      else setError(json.error || "Could not compute the deadline.");
    } catch {
      setError("Could not compute the deadline.");
    } finally {
      setComputing(false);
    }
  }

  return (
    <div className="lf-card">
      <div className="flex items-center gap-2 mb-1">
        <Calculator style={{ width: 18, height: 18, color: "var(--navy)" }} />
        <h2
          className="text-lg font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
        >
          Deadline calculator
        </h2>
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        Compute a filing deadline from a trigger date. Weekends and U.S. federal court
        holidays are skipped automatically.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="lf-label">Trigger date</label>
          <input
            type="date"
            className="lf-input"
            value={triggerDate}
            onChange={(e) => setTriggerDate(e.target.value)}
          />
        </div>
        <div>
          <label className="lf-label">Rule</label>
          <select
            className="lf-input"
            value={ruleKey}
            onChange={(e) => setRuleKey(e.target.value)}
          >
            <option value="">Select a rule…</option>
            {grouped.map(([jur, rs]) => (
              <optgroup key={jur} label={jur}>
                {rs.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label} · {r.days} {r.basis === "business" ? "business" : "calendar"} days
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {selectedRule?.note && (
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          {selectedRule.note}
        </p>
      )}

      <div className="mt-4">
        <button
          className="lf-btn lf-btn-gold"
          onClick={compute}
          disabled={computing}
        >
          {computing ? (
            <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
          ) : (
            <Calculator style={{ width: 16, height: 16 }} />
          )}
          Calculate deadline
        </button>
      </div>

      {error && (
        <p className="text-sm mt-3" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      {result && (
        <div
          className="mt-4 rounded-lg p-4"
          style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {result.rule?.label || "Computed deadline"}
          </p>
          <p
            className="text-2xl font-bold mt-1"
            style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
          >
            {formatDate(result.dueDate)}
          </p>
          {result.landedOnClosure && (
            <p
              className="flex items-center gap-1.5 text-xs mt-1.5"
              style={{ color: "var(--warning)" }}
            >
              <CornerDownRight style={{ width: 14, height: 14 }} />
              Rolled forward — the raw date fell on a weekend or court holiday.
            </p>
          )}
          <p
            className="flex items-start gap-1.5 text-xs mt-3"
            style={{ color: "var(--text-muted)" }}
          >
            <ShieldCheck style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
            {result.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
