/**
 * Lightweight, privacy-safe client analytics.
 *
 * Never pass client names, case/matter names, document contents, emails, or any
 * other privileged information — only counts, enums, booleans, and durations.
 * There's no analytics backend wired up yet; events fan out to any of
 * window.dataLayer / window.analytics.track if present, and to the console in
 * development. Swap the sink here to plug in a provider later.
 */

export type AnalyticsEvent =
  | "cases_empty_state_viewed"
  | "case_create_started"
  | "case_create_completed"
  | "case_create_failed"
  | "case_import_started"
  | "case_import_validated"
  | "case_import_completed"
  | "case_import_failed"
  | "cases_search_used"
  | "cases_filter_applied"
  | "sidebar_collapsed"
  | "ai_assistant_opened";

type Primitive = string | number | boolean | null | undefined;

interface WindowWithAnalytics extends Window {
  dataLayer?: unknown[];
  analytics?: { track?: (event: string, props?: Record<string, Primitive>) => void };
}

export function track(event: AnalyticsEvent, props: Record<string, Primitive> = {}): void {
  if (typeof window === "undefined") return;
  const payload = { event, ...props, ts: Date.now() };
  try {
    const w = window as WindowWithAnalytics;
    if (Array.isArray(w.dataLayer)) w.dataLayer.push(payload);
    if (w.analytics?.track) w.analytics.track(event, props);
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", event, props);
    }
  } catch {
    /* analytics must never break the UI */
  }
}
