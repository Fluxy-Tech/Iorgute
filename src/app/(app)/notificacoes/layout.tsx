import { AccountShell } from "@/components/app/account-shell";

export default function NotificationsLayout({ children }: LayoutProps<"/notificacoes">) {
  return <AccountShell>{children}</AccountShell>;
}
