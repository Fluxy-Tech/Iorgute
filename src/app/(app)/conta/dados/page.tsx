import type { Metadata } from "next";
import { Heart, Lock, LogOut, MapPin, User, UserRound } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { BackHeader } from "@/components/app/back-header";
import { MenuItem } from "@/components/app/menu-item";
import { Blobs } from "@/components/brand/decor";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Meus dados" };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div className="relative flex flex-1 flex-col">
      <Blobs variant="bottom" />
      <div className="relative z-10 flex flex-1 flex-col gap-3 px-4 pb-6 pt-6 lg:max-w-2xl lg:p-0">
        <BackHeader title="Meus dados" href="/conta" />
        <div className="surface mt-2 flex items-center gap-4 px-4 py-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-wine text-primary-foreground">
            <User className="size-9" fill="currentColor" strokeWidth={1.4} />
          </span>
          <div className="min-w-0 text-sm">
            <p className="text-base font-bold text-cocoa">{user.name}</p>
            <p className="truncate text-cocoa/80">{user.email}</p>
            <p className="text-cocoa/80">{user.phone ?? "Sem telefone"}</p>
          </div>
        </div>
        <MenuItem compact href="/conta/dados/senha" icon={<Lock />} title="Alterar senha" />
        <MenuItem compact href="/conta/dados/editar" icon={<UserRound />} title="Editar dados" />
        <MenuItem compact href="/conta/endereco" icon={<MapPin />} title="Endereço de entrega" />
        <MenuItem compact href="/conta/dados/preferencias" icon={<Heart className="fill-rose text-rose" />} title="Preferências" />
        <form action={logoutAction} className="mt-2">
          <button className="flex h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-rose/50 text-sm font-semibold text-rose hover:bg-rose/5">
            <LogOut className="size-4" /> Sair
          </button>
        </form>
      </div>
    </div>
  );
}
