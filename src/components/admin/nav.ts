import type { RoleName } from "@/lib/constants";

export type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "kanban" | "bottle" | "product" | "coupon" | "users" | "audit" | "logs" | "settings";
  roles: RoleName[];
};

/** Matriz de acesso do painel: o que cada role enxerga */
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Painel", icon: "dashboard", roles: ["ADMIN", "STAFF"] },
  { href: "/admin/pedidos", label: "Esteira de pedidos", icon: "kanban", roles: ["ADMIN", "STAFF"] },
  { href: "/admin/garrafas", label: "Coleta de vasilhames", icon: "bottle", roles: ["ADMIN", "STAFF"] },
  { href: "/admin/produtos", label: "Produtos", icon: "product", roles: ["ADMIN"] },
  { href: "/admin/cupons", label: "Cupons", icon: "coupon", roles: ["ADMIN"] },
  { href: "/admin/usuarios", label: "Usuários e acessos", icon: "users", roles: ["ADMIN"] },
  { href: "/admin/auditoria", label: "Auditoria", icon: "audit", roles: ["ADMIN"] },
  { href: "/admin/logs", label: "Log de requisições", icon: "logs", roles: ["ADMIN"] },
  { href: "/admin/configuracoes", label: "Configurações", icon: "settings", roles: ["ADMIN"] },
];
