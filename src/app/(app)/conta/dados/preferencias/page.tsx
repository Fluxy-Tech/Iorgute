import type { Metadata } from "next";
import { BackHeader } from "@/components/app/back-header";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PreferencesForm } from "./preferences-form";

export const metadata: Metadata = { title: "Preferências" };

export default async function PreferencesPage() {
  const user = await requireUser();
  const [prefs, flavors] = await Promise.all([
    prisma.userPreference.findUnique({ where: { userId: user.id } }),
    prisma.product.findMany({ where: { active: true }, distinct: ["flavor"], select: { flavor: true }, orderBy: { flavor: "asc" } }),
  ]);
  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-6 lg:max-w-2xl lg:p-0">
      <BackHeader title="Preferências" href="/conta/dados" />
      <PreferencesForm
        flavors={flavors.map((f) => f.flavor)}
        initial={{
          notifyOrders: prefs?.notifyOrders ?? true,
          notifyPromotions: prefs?.notifyPromotions ?? true,
          favoriteFlavor: prefs?.favoriteFlavor ?? null,
        }}
      />
    </div>
  );
}
