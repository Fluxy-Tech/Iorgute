import type { Metadata } from "next";
import { Blobs } from "@/components/brand/decor";
import { BackHeader } from "@/components/app/back-header";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function ForgotPage() {
  return (
    <>
      <Blobs variant="bottom" />
      <div className="relative z-10 flex-1 px-6 pt-8 lg:px-10 lg:pt-0">
        <BackHeader title="Esqueci minha senha" href="/login" size="lg" />
        <p className="mt-3 text-[15px] text-cocoa">
          Informe o e-mail da sua conta para receber o link de redefinição de senha.
        </p>
        <ForgotForm />
      </div>
    </>
  );
}
