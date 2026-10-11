import type { Metadata } from "next";
import { BackHeader } from "@/components/app/back-header";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { AddressForm } from "./address-form";

export const metadata: Metadata = { title: "Editar endereço" };

export default async function EditAddressPage() {
  const user = await requireUser();
  const address = await prisma.address.findUnique({ where: { userId: user.id } });
  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-6 lg:max-w-2xl lg:p-0">
      <BackHeader title="Editar endereço" href="/conta/endereco" />
      <AddressForm
        initial={{
          street: address?.street ?? "",
          neighborhood: address?.neighborhood ?? "",
          city: address?.city ?? "",
          state: address?.state ?? "MG",
          zipCode: address?.zipCode ?? "",
        }}
      />
    </div>
  );
}
