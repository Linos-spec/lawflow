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
  // Civil dates (deadlines, due dates, filing/opened dates) carry no meaningful
  // time — they're stored at UTC midnight. Rendering them in the browser's local
  // zone rolls them back a day in negative-offset timezones (the classic
  // off-by-one). Detect a date-only string OR a UTC-midnight timestamp and render
  // it in UTC so the calendar date is exactly what was entered.
  const s = typeof date === "string" ? date : "";
  const civil = /^\d{4}-\d{2}-\d{2}$/.test(s) || /T00:00(:00)?(\.0+)?Z$/.test(s);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(civil ? { timeZone: "UTC" } : {}),
  }).format(d);
}
