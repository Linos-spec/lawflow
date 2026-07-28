import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Canonical page header — the sticky, blurred bar every page uses. Matches the
 * pattern the core pages already use (`lf-page-header` with a negative-margin
 * breakout of the app layout's `p-6` container), so every screen shares one shell.
 */
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  backHref,
  backLabel,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ElementType;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="lf-page-header -mx-6 -mt-6 mb-6 px-6">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm mb-2"
          style={{ color: "var(--text-secondary)", textDecoration: "none" }}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} /> {backLabel || "Back"}
        </Link>
      )}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--navy)", display: "flex", alignItems: "center", gap: "0.6rem" }}
          >
            {Icon && <Icon style={{ width: 24, height: 24, color: "var(--gold)" }} />}
            {title}
          </h1>
          {subtitle && <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
