import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { Blobs, Leaf } from "@/components/brand/decor";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <>
      <Blobs variant="auth" />
      <div className="relative z-10 flex flex-1 flex-col px-7 pb-10 pt-14 lg:px-10 lg:pt-0">
        <div className="flex flex-col items-center text-center">
          <Logo size="xl" priority className="lg:hidden" />
          <p className="mt-3 text-[15px] leading-tight text-cocoa lg:hidden">
            iogurte artesanal
            <br />
            100% natural
          </p>
          <h1 className="mt-8 font-script text-4xl font-bold text-wine lg:mt-0 lg:text-5xl">Bem-vindo!</h1>
          <p className="mt-2 max-w-64 text-[15px] text-cocoa">
            Acesse sua conta e acompanhe seus pedidos e descontos.
          </p>
        </div>
        <LoginForm next={typeof next === "string" ? next : ""} />
        <Leaf className="absolute bottom-4 right-4 lg:hidden" />
      </div>
    </>
  );
}
