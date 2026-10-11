import type { Metadata } from "next";
import { Blobs } from "@/components/brand/decor";
import { BackHeader } from "@/components/app/back-header";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Redefinir senha" };

export default async function ResetPage({ searchParams }: PageProps<"/redefinir-senha">) {
  const { token, error } = await searchParams;
  return (
    <>
      <Blobs variant="bottom" />
      <div className="relative z-10 flex-1 px-6 pt-8 lg:px-10 lg:pt-0">
        <BackHeader title="Redefinir senha" href="/login" size="lg" />
        {error || typeof token !== "string" ? (
          <p className="mt-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Link inválido ou expirado. Solicite um novo link.
          </p>
        ) : (
          <ResetForm token={token} />
        )}
      </div>
    </>
  );
}
