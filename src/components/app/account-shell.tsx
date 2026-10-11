import type { ReactNode } from "react";
import { requireUser } from "@/lib/session";
import { AccountNav } from "./account-nav";

/** No desktop, envolve as páginas da conta com o menu lateral; no mobile, só repassa o conteúdo. */
export async function AccountShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-8">
      <AccountNav name={user.name} email={user.email} phone={user.phone} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
