// Constantes compartilhadas entre servidor e cliente (sem dependências de servidor)

export const ROLES = ["ADMIN", "STAFF", "CUSTOMER"] as const;
export type RoleName = (typeof ROLES)[number];

export const ROLE_LABEL: Record<RoleName, string> = {
  ADMIN: "Administrador",
  STAFF: "Operador",
  CUSTOMER: "Cliente",
};

export const ROLE_DESCRIPTION: Record<RoleName, string> = {
  ADMIN: "Acesso total: usuários, produtos, cupons, configurações, auditoria e logs",
  STAFF: "Painel, esteira de pedidos e coleta de vasilhames",
  CUSTOMER: "Apenas a área do cliente",
};

/** Ordem da esteira (colunas do kanban) */
export const ORDER_FLOW = [
  "RECEBIDO",
  "EM_PRODUCAO",
  "EM_SEPARACAO",
  "SAIU_PARA_ENTREGA",
  "ENTREGUE",
  "CANCELADO",
] as const;
export type OrderStatusName = (typeof ORDER_FLOW)[number];

export const ACTIVE_STATUSES: OrderStatusName[] = [
  "RECEBIDO",
  "EM_PRODUCAO",
  "EM_SEPARACAO",
  "SAIU_PARA_ENTREGA",
];

export const STATUS_LABEL: Record<OrderStatusName, string> = {
  RECEBIDO: "Recebido",
  EM_PRODUCAO: "Em produção",
  EM_SEPARACAO: "Em separação",
  SAIU_PARA_ENTREGA: "Saiu para entrega",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const STATUS_DESCRIPTION: Record<OrderStatusName, string> = {
  RECEBIDO: "Recebemos seu pedido",
  EM_PRODUCAO: "Seu iogurte está sendo preparado",
  EM_SEPARACAO: "Separando e embalando seus produtos",
  SAIU_PARA_ENTREGA: "Seu pedido está a caminho",
  ENTREGUE: "Pedido entregue. Aproveite!",
  CANCELADO: "Pedido cancelado",
};

/** Classes de badge (paleta do layout) */
export const STATUS_BADGE: Record<OrderStatusName, string> = {
  RECEBIDO: "bg-[#F3E1D6] text-[#7A2E3B] border-[#E8C9B8]",
  EM_PRODUCAO: "bg-[#F9E0C9] text-[#9A4F14] border-[#F0C9A2]",
  EM_SEPARACAO: "bg-[#FBE7B5] text-[#8A5A00] border-[#F2D58A]",
  SAIU_PARA_ENTREGA: "bg-[#E4E3F5] text-[#4B4790] border-[#CFCDEB]",
  ENTREGUE: "bg-[#DFF0DA] text-[#3E7B3A] border-[#BFDDB6]",
  CANCELADO: "bg-[#F6D9D9] text-[#A3302F] border-[#EBBDBD]",
};

/** Cor de destaque de cada coluna do kanban */
export const STATUS_ACCENT: Record<OrderStatusName, string> = {
  RECEBIDO: "#B5546A",
  EM_PRODUCAO: "#D9853B",
  EM_SEPARACAO: "#E3A857",
  SAIU_PARA_ENTREGA: "#6B66B8",
  ENTREGUE: "#5E9E57",
  CANCELADO: "#A3302F",
};

export const PAYMENT_LABEL = {
  PIX: "Pix",
  CARTAO: "Cartão na entrega",
  DINHEIRO: "Dinheiro",
} as const;

export const SETTING_DEFAULTS = {
  bottleCredit: "2.00",
  deliveryFee: "0.00",
  deliveryDays: "2",
  deliveryCities: "Uberlândia",
  storeName: "Iorgutê",
  storeWhatsapp: "(34) 99999-9999",
} as const;
export type SettingKey = keyof typeof SETTING_DEFAULTS;
