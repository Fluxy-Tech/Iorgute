import { AdminMobileNav, AdminSidebar } from "@/components/admin/sidebar";
import { requireRole } from "@/lib/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  const u = { name: user.name, email: user.email, role: user.role };
  return (
    <div className="flex min-h-svh bg-background">
      <AdminSidebar user={u} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav user={u} />
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
