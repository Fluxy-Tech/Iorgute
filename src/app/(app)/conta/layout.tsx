import { AccountShell } from "@/components/app/account-shell";

export default function AccountLayout({ children }: LayoutProps<"/conta">) {
  return <AccountShell>{children}</AccountShell>;
}
