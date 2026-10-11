import { AccountShell } from "@/components/app/account-shell";

export default function OrdersLayout({ children }: LayoutProps<"/pedidos">) {
  return <AccountShell>{children}</AccountShell>;
}
