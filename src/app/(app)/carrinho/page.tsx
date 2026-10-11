import type { Metadata } from "next";
import { BackHeader } from "@/components/app/back-header";
import { getBottleSummary } from "@/lib/discounts";
import { toNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { deliversTo, getSettings } from "@/lib/settings";
import { Checkout } from "./checkout";

export const metadata: Metadata = { title: "Carrinho" };

export default async function CartPage() {
  const user = await requireUser();
  const [address, bottles, settings] = await Promise.all([
    prisma.address.findUnique({ where: { userId: user.id } }),
    getBottleSummary(user.id),
    getSettings(),
  ]);
  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-6 lg:p-0">
      <BackHeader title="Meu carrinho" href="/inicio" />
      <Checkout
        address={
          address
            ? { line1: address.street, line2: `${address.neighborhood} — ${address.city} - ${address.state}`, zip: address.zipCode }
            : null
        }
        delivers={deliversTo(settings, address?.city)}
        bottleBalance={bottles.balance}
        deliveryFee={toNumber(settings.deliveryFee)}
        deliveryDays={Number(settings.deliveryDays)}
      />
    </div>
  );
}
