import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type Numeric = number | string | { toString(): string } | null | undefined;

export function toNumber(value: Numeric): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value.toString());
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function currency(value: Numeric) {
  return brl.format(toNumber(value));
}

export function formatDate(date: Date | string, pattern = "dd/MM/yyyy") {
  return format(new Date(date), pattern, { locale: ptBR });
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), { locale: ptBR, addSuffix: true });
}

export function orderCode(id: number) {
  return `#${1000 + id}`;
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase();
}
