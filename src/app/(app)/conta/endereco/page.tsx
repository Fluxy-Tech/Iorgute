import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, Pencil, Truck } from "lucide-react";
import { BackHeader } from "@/components/app/back-header";
import { Blobs } from "@/components/brand/decor";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { deliveryCities, deliversTo, getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Meu endereço" };

export default async function AddressPage() {
  const user = await requireUser();
  const [address, settings] = await Promise.all([
    prisma.address.findUnique({ where: { userId: user.id } }),
    getSettings(),
  ]);
  const ok = deliversTo(settings, address?.city);

  return (
    <div className="relative flex flex-1 flex-col">
      <Blobs variant="bottom" />
      <div className="relative z-10 flex flex-1 flex-col px-4 pb-6 pt-6 lg:max-w-2xl lg:p-0">
        <BackHeader title="Meu endereço" href="/conta" />
        <h2 className="mt-6 font-script text-xl font-bold text-cocoa">Seu endereço de entrega</h2>

        <div className="surface mt-3 overflow-hidden">
          <div className="flex gap-4 px-4 py-4">
            <MapPin className="mt-0.5 size-6 shrink-0 text-wine" />
            {address ? (
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-cocoa">{address.street}</p>
                <p className="text-muted-foreground">Bairro {address.neighborhood}</p>
                <p className="text-muted-foreground">
                  {address.city} - {address.state}
                </p>
                <p className="text-muted-foreground">CEP {address.zipCode}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Você ainda não cadastrou um endereço.</p>
            )}
          </div>
        </div>
        <Link href="/conta/endereco/editar" className="surface mt-2 flex items-center gap-3 px-4 py-4 transition hover:border-rose/40">
          <Pencil className="size-5 text-wine" />
          <span className="flex-1 text-sm font-semibold text-cocoa">{address ? "Editar endereço" : "Cadastrar endereço"}</span>
          <ChevronRight className="size-5 text-cocoa/70" />
        </Link>

        <div className="mt-6 flex gap-4 rounded-2xl bg-peach/50 px-4 py-4">
          <Truck className="size-8 shrink-0 text-wine" strokeWidth={1.5} />
          <div className="text-sm">
            <p className="font-semibold text-wine">
              {ok ? "Entregamos na sua região!" : "Ainda não entregamos na sua região"}
            </p>
            <p className="text-xs text-rose">
              {ok
                ? "Consulte a disponibilidade da sua área."
                : `Atendemos atualmente: ${deliveryCities(settings).join(", ")}.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
