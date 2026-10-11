import "server-only";
import { prisma } from "@/lib/prisma";
import { SETTING_DEFAULTS, type SettingKey } from "@/lib/constants";

export type Settings = Record<SettingKey, string>;

export async function getSettings(): Promise<Settings> {
  const rows = await prisma.setting.findMany();
  const result: Settings = { ...SETTING_DEFAULTS };
  for (const row of rows) {
    if (row.key in result) result[row.key as SettingKey] = row.value;
  }
  return result;
}

export function deliveryCities(settings: Settings) {
  return settings.deliveryCities
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

export function deliversTo(settings: Settings, city: string | null | undefined) {
  if (!city) return false;
  return deliveryCities(settings).some((c) => normalize(c) === normalize(city));
}
