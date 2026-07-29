export enum PurchaseOrderStatus {
  RASCUNHO  = 'rascunho',
  PENDENTE  = 'pendente',
  APROVADO  = 'aprovado',
  RECEBIDO  = 'recebido',
  CANCELADO = 'cancelado',
}

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
  PROPRIETARIO = 'proprietario',
  ADMIN = 'admin',
  FINANCEIRO = 'financeiro',
  VENDEDOR = 'vendedor',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum TenantSegment {
  COMERCIO  = 'comercio',
  INDUSTRIA = 'industria',
  SERVICOS  = 'servicos',
  OUTROS    = 'outros',
}

export enum TenantPlan {
  PRO           = 'pro',
  BUSINESS      = 'business',
  PERSONALIZADO = 'personalizado',
}

export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum FaturaStatus {
  PENDENTE  = 'pendente',
  PAGO      = 'pago',
  CANCELADO = 'cancelado',
}

export enum NFeStatus {
  RASCUNHO   = 'rascunho',
  AUTORIZADA = 'autorizada',
  REJEITADA  = 'rejeitada',
  CANCELADA  = 'cancelada',
}

export enum NFeModalidadeFrete {
  EMITENTE               = '0',
  DESTINATARIO           = '1',
  TERCEIROS              = '2',
  PROPRIO_REMETENTE      = '3',
  PROPRIO_DESTINATARIO   = '4',
  SEM_FRETE              = '9',
}
