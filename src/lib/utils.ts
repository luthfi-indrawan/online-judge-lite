import type { GroupStatus, Verdict } from "../types";
export function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d);
}
export function formatRelative(value?: string) {
  if (!value) return "—";
  const diff = new Date(value).getTime() - Date.now();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 60)
    return mins >= 0 ? `${mins} menit lagi` : `${Math.abs(mins)} menit lalu`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24)
    return hours >= 0 ? `${hours} jam lagi` : `${Math.abs(hours)} jam lalu`;
  const days = Math.round(hours / 24);
  return days >= 0 ? `${days} hari lagi` : `${Math.abs(days)} hari lalu`;
}
export function groupStatusLabel(status: GroupStatus) {
  return { UPCOMING: "Belum dibuka", ONGOING: "Berlangsung", ENDED: "Selesai" }[
    status
  ];
}
export function verdictLabel(verdict: Verdict | "NOT_ATTEMPTED") {
  return {
    PENDING: "Pending",
    RUNNING: "Running",
    AC: "Accepted",
    WA: "Wrong Answer",
    CE: "Compile Error",
    TLE: "Time Limit Exceeded",
    RTE: "Runtime Error",
    NOT_ATTEMPTED: "Belum dicoba",
  }[verdict];
}
export function initials(name?: string) {
  return (name || "OJ")
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}
export function toLocalInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}
export function localInputToISO(value: string) {
  return new Date(value).toISOString();
}
