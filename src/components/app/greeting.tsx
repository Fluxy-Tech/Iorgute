import { User } from "lucide-react";
import { firstName } from "@/lib/format";

export function Greeting({ name, subtitle = "Seja bem-vinda de volta!" }: { name: string; subtitle?: string }) {
  return (
    <div className="surface relative flex items-center gap-4 px-5 py-5 lg:h-full lg:gap-5 lg:px-8 lg:py-7">
      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-wine text-primary-foreground lg:size-16">
        <User className="size-8" fill="currentColor" strokeWidth={1.4} />
      </span>
      <div>
        <p className="font-script text-2xl font-bold leading-tight text-wine lg:text-3xl">
          Olá, {firstName(name)}! <span className="not-italic">👋</span>
        </p>
        <p className="text-sm text-cocoa">{subtitle}</p>
      </div>
    </div>
  );
}
