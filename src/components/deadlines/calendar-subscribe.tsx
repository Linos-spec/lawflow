"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Loader2, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function CalendarSubscribe() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/v1/firm/calendar-feed")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setUrl(j.data.url);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function generate(rotate = false) {
    setWorking(true);
    try {
      const res = await fetch(`/api/v1/firm/calendar-feed${rotate ? "?rotate=1" : ""}`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setUrl(json.data.url);
        toast.success(rotate ? "New calendar link generated" : "Calendar link ready");
      } else {
        toast.error(json.error || "Could not generate the calendar link.");
      }
    } catch {
      toast.error("Could not generate the calendar link.");
    } finally {
      setWorking(false);
    }
  }

  function copy() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="lf-card">
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays style={{ width: 18, height: 18, color: "var(--navy)" }} />
        <h2
          className="text-lg font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--navy)" }}
        >
          Sync to your calendar
        </h2>
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        Subscribe in Google Calendar, Outlook, or Apple Calendar to see every pending
        deadline — each with a day-before reminder. Read-only and always up to date.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
          Loading…
        </div>
      ) : url ? (
        <>
          <div
            className="flex items-center gap-2 rounded-lg p-3"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}
          >
            <p
              className="flex-1 min-w-0 text-sm"
              style={{
                fontFamily: "monospace",
                color: "var(--navy)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {url}
            </p>
            <button className="lf-btn lf-btn-outline" onClick={copy}>
              {copied ? (
                <Check style={{ width: 15, height: 15 }} />
              ) : (
                <Copy style={{ width: 15, height: 15 }} />
              )}
              Copy
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            In Google Calendar: <em>Other calendars → + → From URL</em>. In Outlook:{" "}
            <em>Add calendar → Subscribe from web</em>. In Apple Calendar:{" "}
            <em>File → New Calendar Subscription</em>.
          </p>
          <button
            className="mt-3 inline-flex items-center gap-1.5 text-xs"
            style={{ color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => generate(true)}
            disabled={working}
          >
            <RefreshCw style={{ width: 13, height: 13 }} />
            Generate a new link (revokes the old one)
          </button>
        </>
      ) : (
        <button className="lf-btn lf-btn-gold" onClick={() => generate(false)} disabled={working}>
          {working ? (
            <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
          ) : (
            <CalendarDays style={{ width: 16, height: 16 }} />
          )}
          Create calendar link
        </button>
      )}
    </div>
  );
}
