# Synk ERP API — Contexto Técnico

## Produto

Synk ERP é uma plataforma SaaS multi-tenant voltada para pequenas e médias empresas brasileiras. Cada cliente contrata um **tenant** (identificado por CNPJ) e recebe acesso ao sistema com um usuário admin inicial. O admin pode convidar funcionários e configurar filiais, produtos, parceiros, etc.

### Contexto fiscal brasileiro

- Documentos: CPF (pessoa física) e CNPJ (pessoa jurídica), ambos com validação de dígitos verificadores
- Regimes tributários: Simples Nacional, Simples com excesso de receita, Regime Normal
- Notas fiscais com NCM, CEST, CST, PIS/COFINS/IPI/IBS/CBS
- IVA por estado (tabela `ProductIvaItem`)
- Boletos bancários com layouts CNAB 240 e CNAB 400

### Arquitetura multi-tenant

- Cada tenant representa uma empresa (CNPJ único)
- Usuários pertencem a um tenant (`tenant_id` nas queries)
- Planos: `free`, `pro`, `enterprise`
- Status de tenant: `active`, `inactive`, `suspended`

### Roles de usuário

| Role    | Descrição                                                |
| ------- | -------------------------------------------------------- |
| `admin` | Dono/gestor do tenant — acesso total                     |
| `user`  | Funcionário — acesso restrito por módulo (a implementar) |

---

## Stack

| Tecnologia                          | Versão          | Uso                               |
| ----------------------------------- | --------------- | --------------------------------- |
| NestJS                              | ^11             | Framework principal               |
| TypeORM                             | 0.3.27          | ORM                               |
| PostgreSQL                          | —               | Banco de dados                    |
| JWT                                 | via @nestjs/jwt | Autenticação                      |
| bcryptjs                            | ^2.4.3          | Hash de senha                     |
| class-validator + class-transformer | ^0.14 / ^0.5    | Validação e transformação de DTOs |
| nodemailer                          | ^8              | Envio de e-mail                   |
| axios                               | ^1.6            | Requisições HTTP externas         |

---

## Estrutura de Diretórios

```
src/
├── config/
│   └── db/
│       ├── database.config.ts     # TypeORM config
│       ├── base.entity.ts         # Entidade base (id, createdAt, updatedAt)
│       ├── base-list.dto.ts       # DTO base para paginação (limit, offset)
│       └── accounts-entity.ts     # Base para entidades contábeis
│   └── validate-and-transform.ts  # Helper de validação manual
├── core/
│   └── enum/
│       └── enums.ts               # Todos os enums do sistema
├── modules/                        # 28+ módulos de feature
│   ├── auth/
│   ├── user/
│   ├── entrepreneur/
│   ├── employee/
│   ├── enterprise/
│   ├── branch/
│   ├── address/
│   ├── product/
│   ├── partner/
│   └── ... (demais módulos)
├── app.module.ts
└── main.ts
```

---

## Bootstrap (main.ts)

```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.enableCors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization',
});
app.use(json({ limit: '10mb' }));
await app.listen(process.env.PORT ?? 3000);
```

- CORS aberto para todas as origens
- ValidationPipe global com `whitelist: true` e `transform: true`
- Limite de payload JSON: 10MB

---

## Banco de Dados

### Configuração TypeORM

```typescript
// database.config.ts
{
  type: 'postgres',
  namingStrategy: new SnakeNamingStrategy(), // camelCase → snake_case automaticamente
  synchronize: process.env.ENV === 'development', // true apenas em dev
  ssl: process.env.ENV !== 'development',         // SSL apenas em prod
  // connection via env vars: DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT
}
```

### Base Entity (herdada por todas as entidades)

```typescript
@Entity()
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### Variáveis de Ambiente

| Variável         | Padrão    | Descrição                                           |
| ---------------- | --------- | --------------------------------------------------- |
| `PORT`           | 3000      | Porta HTTP                                          |
| `DB_HOST`        | localhost | Host PostgreSQL                                     |
| `DB_USERNAME`    | postgres  | Usuário do banco                                    |
| `DB_PASSWORD`    | postgres  | Senha do banco                                      |
| `DB_NAME`        | yachid    | Nome do banco                                       |
| `DB_PORT`        | 5432      | Porta PostgreSQL                                    |
| `ENV`            | —         | `development` habilita bypass de auth e synchronize |
| `JWT_SECRET`     | —         | Segredo JWT (AuthGuard)                             |
| `APP_JWT_SECRET` | —         | Segredo JWT (AppGuard, sem bypass dev)              |

---

## Arquitetura de Módulos

Cada módulo segue a estrutura:

```
modules/nome/
├── dto/
│   ├── create-nome.dto.ts
│   └── update-nome.dto.ts
├── entities/
│   └── nome.entity.ts
├── nome.module.ts
├── nome.controller.ts
└── nome.service.ts
```

O `app.module.ts` importa todos os módulos. Dependências circulares são resolvidas com `forwardRef()` (ex.: `BranchModule` ↔ `EmployeeModule`).

---

## Autenticação

### Dois Guards

**`AuthGuard`** (`auth/guard/auth.guard.ts`)

- Extrai `Bearer` token do header `Authorization`
- Verifica com `JWT_SECRET`
- **Em `ENV=development`: retorna `true` sem verificar** (bypass total)
- Payload do token: `{ name, email, id, sessionId, levelAccess, role, branchId }`

**`AppGuard`** (`auth/guard/app.guard.ts`)

- Usa `APP_JWT_SECRET`
- **Sem bypass de desenvolvimento**
- Lança `UnauthorizedException` se token ausente ou inválido

### Payload JWT

```typescript
{
  name: string;
  email: string;
  id: string; // userId
  sessionId: string;
  levelAccess: string;
  role: UserRole; // 'entrepreneur' | 'employee'
  branchId: string;
}
```

Token expira em **24 horas**.

### Rotas de Auth

| Método | Rota                    | Descrição                                    |
| ------ | ----------------------- | -------------------------------------------- |
| POST   | `/auth/register`        | Cria tenant + usuário admin (retorna tokens) |
| POST   | `/auth/login`           | Login com email + senha (retorna tokens)     |
| POST   | `/auth/refresh`         | Renova access + refresh token (Bearer refresh token) |
| POST   | `/auth/logout`          | Invalida refresh token (Bearer access token) |
| POST   | `/auth/forgot-password` | Envia código de reset por e-mail             |
| POST   | `/auth/reset-password`  | Redefine senha com código de 6 dígitos       |

### Fluxo de tokens

- **Access token**: JWT 15 min, assinar com `JWT_ACCESS_SECRET`, payload: `{sub, email, role, tenantId}`
- **Refresh token**: JWT 7 dias, assinar com `JWT_REFRESH_SECRET`, mesmo payload
- Hash bcrypt do refresh token armazenado na coluna `users.refresh_token`
- Logout limpa a coluna (seta `null`) — invalidando o refresh sem lista negra

### Redefinição de Senha

- Código de 6 caracteres gerado e armazenado na tabela `PasswordReset`
- Enviado via e-mail com nodemailer
- Tem expiração (`expires_at`)
- Invalidado após uso

---

## Roles e Usuários

```typescript
enum UserRole {
  ENTREPRENEUR = 'entrepreneur',
  EMPLOYEE = 'employee',
}
```

**`User`** — entidade compartilhada: `id (UUID)`, `email (unique)`, `password (hash bcrypt)`, `role`

**`Entrepreneur`** — dono de empresas: `name`, `phone`, `document`, `status`, `enterprises (OneToMany)`, `photo (OneToOne)`, `user (OneToOne)`

**`Employee`** — funcionário de filial: `name`, `phone`, `document`, `role (ADMIN|USER)`, `status`, `is_representative`, `commission`, `branch (ManyToOne)`, `entrepreneur (ManyToOne)`, `photo (OneToOne)`, `user (OneToOne)`

---

## Módulos e Entidades

### Enterprise (empresa)

Criação em cascata: `Enterprise → Group → GroupEnterprise → Address → Branch (SEDE) → TaxRegime → RevenueTaxDetails`

Campos: `document`, `social_reason`, `fantasy_name`, `status`, `phone`, `email`, `website`, `accounting_email`, `entrepreneur (ManyToOne)`, `branches (OneToMany)`

### Branch (filial)

Campos: `name`, `enterprise (ManyToOne)`, `address (OneToOne eager)`, `employees (OneToMany)`, `revenueTaxDetails (OneToOne)`, `taxRegime (OneToOne)`

A filial principal é criada automaticamente com nome `"SEDE"` na criação da empresa.

### Address

Campos: `cep`, `street`, `number`, `complement`, `neighborhood`, `city`, `city_ibge_code`, `country`, `region`, `uf`  
Relações: `branch (OneToOne)`, `partner (OneToOne)`

### Product (produto — mais complexo)

Subentidades próprias:

- `ProductStock` — saldos e empenhos por estoque
- `ProductStockAddress` — localização física no estoque (rua, prateleira)
- `ProductComponent` — componentes/ingredientes do produto
- `ProductNotaFiscal` — dados fiscais (NCM, CEST, CST, alíquotas PIS/COFINS/IPI/IBS/CBS)
- `ProductIvaItem` — tabela IVA por estado

Campos principais: `codigo (int auto-increment)`, `produto`, `type`, `familia`, `unidade`, `fabricante`, `status`, `tipo_custo (CALCULADO|DIGITADO)`, `custo_calculado`, `custo_digitado`, `custo_medio`, `ultimo_custo`, `preco_tabela`, `preco_min_7/12/18`, `enterprise (ManyToOne)`

### Partner (parceiro / cliente / fornecedor)

Campos: `codigo (int)`, `document`, `ie_rg`, `name`, `fantasy_name`, `main_phone`, `secondary_phone`, `cellphone`, `person_type (FISICA|JURIDICA)`, `partner_type (FORNECEDOR|CLIENTE)`, `suframa`, `business_sector`, `email_nfe`, `email`, `site`, `status`, `accounting_account`, `type (NORMAL|VIP|REVENDA|ATACADO|CONSUMIDOR)`, `provision`, `fixed_expenses`

Subentidades: `DeliveryAddress (OneToMany)`, `PaymentAddress (OneToOne)`, `PartnerCreditConfig (OneToOne)`, `AccountsPayable (OneToOne)`, `AccountsReceivable (OneToOne)`, `Carrier (via CarrierPartner)`

### Bank (banco)

Campos: `codigo (int)`, `numero_banco`, `nome`, `agencia_numero`, `agencia_dv`, `conta_numero`, `conta_dv`, `codigo_cedente`, `codigo_convenio`, `codigo_empresa`, `ultimo_boleto_emitido`, `codigo_transmissao`, `mora_diaria_percent`, `carteira`, `variacao_carteira`, `multa_percent`, `dias_protesto`, `layout_remessa (CNAB_240|CNAB_400)`, `instrucoes_boleto`

### TaxRegime (regime tributário)

Campos: `tax_regime (SIMPLES_NACIONAL|SIMPLES_EXCESSO_RECEITA|NORMAL)`, `regime_tributario_issqn`, `ind_rat_issqn`, `branch (OneToOne)`

### RevenueTaxDetails (detalhes tributários)

Campos: `bc_irpj`, `bc_csll`, `aliquota_irpj`, `aliquota_csll`, `ibs_uf`, `ibs_mun`, `cbs`, `over`, `value_over`, `aliquota`, `cofins`, `pis`, `icms`, `branch (OneToOne)`

### InventoryMovement (movimentação de estoque)

Campos: `movement_type (ENTRADA|SAIDA|ACERTO_POSITIVO|ACERTO_NEGATIVO)`, `quantity`, `history`, `user (ManyToOne)`, `product (ManyToOne)`, `enterprise (ManyToOne)`

### Representative (representante)

Campos: `codigo (int)`, `nome`, `telefone`, `comissao (decimal)`, `status`, `documento`, `ie_rg`, `celular`, `contato`, `email`, `tipo_comissao (PEDIDO|CONTAS_A_RECEBER_BAIXADO|NOTA_FISCAL|SEM_COMISSAO)`, `pre_pedido`, `aplicativo`, `address (OneToOne eager)`

### AccountsEntity (base contábil — herdada por AccountsPayable e AccountsReceivable)

Campos: `saldo_devedor`, `maior_atraso`, `maior_fat`, `valor_maior_atraso`, `primeira_compra`, `valor_primeira_compra`, `ultima_compra`, `valor_ultima_compra`, `atrasadas`, `cartorio`, `protesto`, `normal`, `observation`

---

## Enums Centralizados (`src/core/enum/enums.ts`)

```typescript
enum PartnerPersonType {
  FISICA,
  JURIDICA,
}
enum PartnerType {
  FORNECEDOR,
  CLIENTE,
}
enum PartnerStatus {
  ATIVO,
  INATIVO,
}
enum Type {
  NORMAL,
  VIP,
  REVENDA,
  ATACADO,
  CONSUMIDOR,
}
enum TipoCusto {
  CALCULADO,
  DIGITADO,
}
enum TipoComissao {
  PEDIDO,
  CONTAS_A_RECEBER_BAIXADO,
  NOTA_FISCAL,
  SEM_COMISSAO,
}
enum LayoutRemessa {
  CNAB_240,
  CNAB_400,
}
enum InventoryMovementType {
  ENTRADA,
  SAIDA,
  ACERTO_POSITIVO,
  ACERTO_NEGATIVO,
}
```

---

## Validação e Transformação

### ValidationPipe Global

- `whitelist: true` — remove propriedades não declaradas no DTO
- `transform: true` — converte automaticamente tipos (string → number, etc.)
- Retorna erro 400 com `message` como **array de strings**

### validateAndToPlain() — validação manual

```typescript
// src/config/validate-and-transform.ts
validateAndToPlain(DtoClass, plainObject, { excludeExtraneousValues?: boolean })
// Lança BadRequestException se inválido
// Retorna Record<string, unknown> se válido
```

### BaseListDto — paginação padrão

```typescript
class BaseListDto {
  limit?: number;
  offset?: number;
}
```

---

## Upload de Arquivos

Fotos são armazenadas como **base64 diretamente no banco** (tabela `photos`). Não há bucket/storage externo.  
Nos endpoints de criação de funcionário e empreendedor, o campo `base64` é opcional no DTO.

---

## CEP (Consulta de Endereço)

Módulo `cep` faz lookup de CEP via API externa (axios) e retorna endereço formatado.  
DTO de resposta: `CepLookupResponseDto` com campos de endereço padrão.

---

## E-mail

Módulo `mail` usa nodemailer. Atualmente só envia código de reset de senha:

```typescript
mailService.sendPasswordResetCode(email: string, code: string): Promise<void>
```

---

## Padrões de Código

- Todos os módulos usam `@UseGuards(AuthGuard)` para proteção
- Entidades com código numérico sequencial usam `@PrimaryGeneratedColumn('increment')` para o campo `codigo` e ainda herdam o UUID da `BaseEntity`
- Relacionamentos com `eager: true` apenas onde necessário (ex.: `branch.address`, `representative.address`)
- `CASCADE` configurado explicitamente onde necessário (ex.: `ProductIvaItem` → `ProductNotaFiscal`)
- Sem migrations — usa `synchronize: true` em desenvolvimento

---

## Rotas por Módulo (resumo)

| Módulo                | Base                     | Principais rotas                                                                                                 |
| --------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| auth                  | `/auth`                  | POST /login, POST /forgot-password, POST /reset-password                                                         |
| user                  | `/user`                  | POST /, GET /:id, PATCH /:id                                                                                     |
| entrepreneur          | `/entrepreneur`          | POST /, GET /:id                                                                                                 |
| employee              | `/employees`             | POST /:branchId/create, GET /, GET /:id, PATCH /:id                                                              |
| enterprise            | `/enterprise`            | POST /:entrepreneurId, GET /:entrepreneurId, GET /:enterpriseId/details                                          |
| branch                | `/branch`                | POST, GET, PATCH                                                                                                 |
| product               | `/product`               | POST /:enterpriseId, GET /, GET /:id, PATCH /:id, POST /:id/stocks, POST /:id/components, PATCH /:id/nota-fiscal |
| partner               | `/partner`               | POST /:enterpriseId/create/:partnerType, GET /, GET /:id, PATCH /:id                                             |
| bank                  | `/bank`                  | POST, GET, PATCH                                                                                                 |
| carrier               | `/carrier`               | POST, GET, PATCH                                                                                                 |
| representative        | `/representative`        | POST, GET, PATCH                                                                                                 |
| inventory-movement    | `/inventory-movement`    | POST, GET                                                                                                        |
| accounts-payable      | `/accounts-payable`      | POST, GET /:partnerId, PATCH /:id                                                                                |
| accounts-receivable   | `/accounts-receivable`   | POST, GET /:partnerId, PATCH /:id                                                                                |
| delivery-address      | `/delivery-address`      | POST, GET, PATCH, DELETE                                                                                         |
| payment-address       | `/payment-address`       | POST, GET, PATCH                                                                                                 |
| partner-credit-config | `/partner-credit-config` | POST, GET, PATCH                                                                                                 |
| tax-regime            | `/tax-regime`            | POST, GET, PATCH                                                                                                 |
| cep                   | `/cep`                   | GET /:cep                                                                                                        |
| group                 | `/group`                 | POST, GET, PATCH, DELETE                                                                                         |
