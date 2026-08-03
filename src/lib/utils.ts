import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  // A date-only ISO string (YYYY-MM-DD) parses as UTC midnight; render it in UTC
  // so it doesn't display as the previous day in negative-offset timezones.
  const dateOnly = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  }).format(d);
}
