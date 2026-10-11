import type { Metadata } from "next";
import { Clock, Heart, Leaf as LeafIcon, MessageCircle, Recycle } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Blobs, Leaf } from "@/components/brand/decor";
import { Bottle } from "@/components/brand/bottle";
import { getSettings, deliveryCities } from "@/lib/settings";

export const metadata: Metadata = { title: "Sobre" };

export default async function AboutPage() {
  const settings = await getSettings();
  const values = [
    { icon: LeafIcon, title: "100% natural", text: "Leite fresco, fermentação lenta e frutas de verdade. Sem conservantes." },
    { icon: Heart, title: "Feito à mão", text: "Pequenos lotes produzidos com carinho, todos os dias." },
    { icon: Recycle, title: "Garrafas retornáveis", text: "Devolva suas garrafas e ganhe desconto na próxima compra." },
  ];
  return (
    <div className="relative flex flex-1 flex-col">
      <Blobs variant="auth" />
      <div className="relative z-10 flex flex-1 flex-col items-center px-6 pb-8 pt-12 text-center lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-0 lg:py-10 lg:text-left">
        <div className="flex flex-col items-center lg:items-start">
          <Logo size="lg" />
          <p className="mt-2 text-cocoa">iogurte artesanal · 100% natural</p>
          <div className="mt-6 flex items-end gap-2 lg:hidden">
            <Bottle color="#E58C98" className="h-24 w-12" />
            <Bottle color="#F2B544" className="h-28 w-14" />
            <Bottle color="#F3EEE6" className="h-24 w-12" />
          </div>
          <h1 className="mt-6 font-script text-3xl font-bold text-wine lg:mt-10 lg:text-5xl">Nossa história</h1>
          <p className="mt-2 text-sm leading-relaxed text-cocoa/90 lg:mt-4 lg:max-w-lg lg:text-base">
            A Iorgutê nasceu na cozinha de casa, com a receita de família e a vontade de levar um iogurte
            de verdade para a sua mesa. Hoje seguimos do mesmo jeito: ingredientes simples, processos
            artesanais e muito cuidado em cada garrafa.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2 text-left text-sm lg:max-w-lg">
            <p className="flex items-center gap-2 text-cocoa">
              <Clock className="size-4 text-wine" /> Entregas em {deliveryCities(settings).join(", ")}
            </p>
            <p className="flex items-center gap-2 text-cocoa">
              <MessageCircle className="size-4 text-wine" /> WhatsApp {settings.storeWhatsapp}
            </p>
          </div>
        </div>

        <div className="mt-6 flex w-full flex-col gap-3 text-left lg:mt-0">
          <div className="relative hidden h-64 items-end justify-center gap-4 overflow-hidden rounded-3xl bg-peach/50 pb-6 lg:flex">
            <svg className="absolute -right-10 -top-10 h-48 w-48" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="50" fill="var(--peach-strong)" opacity="0.6" />
            </svg>
            <Bottle color="#E58C98" className="relative h-40 w-20" />
            <Bottle color="#F2B544" className="relative h-48 w-24" />
            <Bottle color="#F3EEE6" className="relative h-40 w-20" />
            <Leaf className="absolute bottom-2 right-4" />
          </div>
          {values.map(({ icon: Icon, title, text }) => (
            <div key={title} className="surface flex gap-4 px-4 py-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-peach text-wine">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-cocoa">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <Leaf className="mt-6 self-end lg:hidden" />
      </div>
    </div>
  );
}
