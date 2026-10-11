import type { Metadata } from "next";
import { Blobs } from "@/components/brand/decor";
import { BackHeader } from "@/components/app/back-header";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <>
      <Blobs variant="bottom" />
      <div className="relative z-10 flex-1 px-6 pb-12 pt-8 lg:px-10 lg:py-0">
        <BackHeader title="Criar conta" href="/login" size="lg" />
        <p className="mt-3 text-[15px] text-cocoa">
          Preencha os dados para criar sua conta e aproveitar todos os benefícios.
        </p>
        <RegisterForm />
      </div>
    </>
  );
}
