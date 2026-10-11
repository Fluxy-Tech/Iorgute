import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  await requireRole(["ADMIN"]);
  const settings = await getSettings();
  return (
    <>
      <PageHeader title="Configurações" description="Regras de desconto por garrafa, entrega e dados da loja." />
      <SettingsForm settings={settings} />
    </>
  );
}
