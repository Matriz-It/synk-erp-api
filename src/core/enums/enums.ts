export enum FinanceStatus {
  ABERTO    = 'aberto',
  PAGO      = 'pago',
  CANCELADO = 'cancelado',
}

export enum OrderStatus {
  PENDENTE     = 'pendente',
  EM_ANDAMENTO = 'em_andamento',
  ENTREGUE     = 'entregue',
  CONCLUIDO    = 'concluido',
}

export enum QuoteStatus {
  RASCUNHO  = 'rascunho',
  PENDENTE  = 'pendente',
  APROVADO  = 'aprovado',
  CANCELADO = 'cancelado',
  CONCLUIDO = 'concluido',
}

export enum ClienteTipo {
  PJ = 'PJ',
  PF = 'PF',
}

export enum ProductCategory {
  ALIMENTOS = 'alimentos',
  BEBIDAS = 'bebidas',
  LIMPEZA = 'limpeza',
  ELETRONICOS = 'eletronicos',
  PAPELARIA = 'papelaria',
}

export enum MovementType {
  ENTRADA = 'entrada',
  SAIDA = 'saida',
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum TenantPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}
