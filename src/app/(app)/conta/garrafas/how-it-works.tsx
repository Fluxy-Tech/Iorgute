"use client";

import { BadgePercent, Droplets, Recycle, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function HowItWorks({ credit }: { credit: string }) {
  const steps = [
    { icon: Droplets, title: "Lave a garrafa", text: "Depois de saborear, enxágue a garrafa e a tampa." },
    { icon: Truck, title: "Devolva na entrega", text: "Entregue as garrafas ao nosso entregador ou na loja." },
    { icon: Recycle, title: "Registramos a coleta", text: "Cada garrafa recebida é registrada na sua conta." },
    { icon: BadgePercent, title: "Ganhe desconto", text: `Cada garrafa vale ${credit}, usado automaticamente no carrinho.` },
  ];
  return (
    <Dialog>
      <DialogTrigger className="mt-5 h-11 w-full max-w-64 rounded-full bg-wine text-sm font-bold text-primary-foreground shadow-[0_6px_14px_-6px_rgba(116,33,58,0.6)] transition hover:bg-wine-dark">
        Como funciona
      </DialogTrigger>
      <DialogContent className="bg-background">
        <DialogHeader>
          <DialogTitle className="font-script text-2xl text-wine">Como funciona</DialogTitle>
        </DialogHeader>
        <ol className="space-y-4">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-peach text-wine">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-cocoa">
                  {i + 1}. {title}
                </p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
