# Synk ERP API — Contexto Técnico

## Produto

SaaS multi-tenant para PMEs brasileiras. Cada cliente é um **tenant** (identificado por CNPJ), com um usuário admin inicial que pode cadastrar produtos, clientes, etc.

---

## Stack

| Tecnologia              | Versão   | Uso                                  |
| ----------------------- | -------- | ------------------------------------ |
| NestJS                  | ^11      | Framework principal                  |
| TypeORM                 | ^0.3.28  | ORM                                  |
| PostgreSQL               | —        | Banco de dados                       |
| @nestjs/jwt             | ^11      | JWT access + refresh tokens          |
| @nestjs/passport        | ^11      | Passport strategies                  |
| passport-jwt            | ^4       | JWT strategy                         |
| bcrypt                  | ^6       | Hash de senhas (custo 12)            |
| class-validator         | ^0.15    | Validação de DTOs                    |
| class-transformer       | ^0.5     | Transformação (enableImplicitConversion) |
| cookie-parser           | ^1.4     | Leitura de cookies                   |
| nodemailer              | ^8       | E-mail (reset de senha)              |

---

## Bootstrap (`main.ts`)

```typescript
app.setGlobalPrefix('api/v1')
app.use(cookieParser())
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
}))
app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001', credentials: true })
await app.listen(process.env.APP_PORT ?? 3000)
```

---

## Banco de Dados

- **`synchronize: true`** em `NODE_ENV !== 'production'` — sem migrations em dev
- **Sem `SnakeCaseNamingStrategy`** — nomes de coluna definidos manualmente com `name:`
- Colunas nullable com union `string | null` **devem** ter `type:` explícito no `@Column` para evitar `DataTypeNotSupportedError: "Object"`

### BaseEntity (`src/common/entities/base.entity.ts`)

```typescript
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid') id: string
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt: Date
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt: Date
}
```

---

## Autenticação

### Guards

| Guard            | Arquivo                         | Comportamento                                 |
| ---------------- | ------------------------------- | --------------------------------------------- |
| `JwtAuthGuard`   | `auth/guards/jwt-auth.guard.ts` | Valida access token (`JWT_ACCESS_SECRET`)     |
| `JwtRefreshGuard`| `auth/guards/jwt-refresh.guard.ts` | Valida refresh token + compara hash no banco |

### JWT Payload

```typescript
interface JwtPayload { sub: string; email: string; role: UserRole; tenantId: string }
interface AuthUser   { id: string;  email: string; role: UserRole; tenantId: string }
```

`@CurrentUser()` decorator extrai `request.user` (populado pelo Passport).

### Tokens

- Access: 15 min, secret `JWT_ACCESS_SECRET`
- Refresh: 7 dias, secret `JWT_REFRESH_SECRET`, hash bcrypt armazenado em `users.refresh_token`

---

## Módulos implementados

```
src/modules/
├── auth/           POST /register, /login, /refresh, /logout, GET /me
├── tenants/        (interno) create, findById
├── users/          (interno) create, findBy*, updateRefreshToken
├── products/       GET|POST /products, GET|PATCH /products/:id,
│                   POST|GET /products/:id/movements
└── clients/        GET|POST /clients, GET|PATCH|DELETE /clients/:id
```

---

## Enums (`src/core/enums/enums.ts`)

```typescript
enum ClienteTipo   { PJ = 'PJ', PF = 'PF' }
enum ProductCategory { ALIMENTOS, BEBIDAS, LIMPEZA, ELETRONICOS, PAPELARIA }
enum MovementType  { ENTRADA = 'entrada', SAIDA = 'saida' }
enum UserRole      { ADMIN = 'admin', USER = 'user' }
enum TenantPlan    { FREE, PRO, ENTERPRISE }
enum TenantStatus  { ACTIVE, INACTIVE, SUSPENDED }
```

---

## Entidades e suas tabelas

| Entidade          | Tabela              | Unique constraint           |
| ----------------- | ------------------- | --------------------------- |
| `Tenant`          | `tenants`           | `document` (CNPJ, nullable) |
| `User`            | `users`             | `email`                     |
| `Product`         | `products`          | `(sku, tenant_id)`          |
| `ProductMovement` | `product_movements` | —                           |
| `Client`          | `clients`           | `(documento, tenant_id)`    |

---

## Padrão de módulo

Cada módulo segue:
```
modules/nome/
├── dto/
│   ├── create-nome.dto.ts
│   ├── update-nome.dto.ts
│   └── list-nome.dto.ts
├── entities/
│   └── nome.entity.ts
├── nome.module.ts
├── nome.controller.ts
└── nome.service.ts
```

- Controller: `@Controller('rota')` + `@UseGuards(JwtAuthGuard)` + extrai `tenantId` via `@CurrentUser()`
- Service: queries sempre filtradas por `tenantId`; mapper privado converte entidade → DTO de resposta
- `mapXyz()` no service: timestamps formatados como `YYYY-MM-DD`, decimais como `number`

---

## Documentos — regra de armazenamento

- **Sempre normalizar para dígitos puros** antes de salvar (`replace(/\D/g, '')`)
- Buscas: `REGEXP_REPLACE(coluna, '[^0-9]', '', 'g') = :valor` para tolerar dados antigos com máscara
- Frontend envia com ou sem máscara — backend normaliza ao criar/atualizar

---

## Variáveis de Ambiente

| Variável                | Padrão         | Descrição                         |
| ----------------------- | -------------- | --------------------------------- |
| `NODE_ENV`              | `development`  | `production` desativa synchronize |
| `APP_PORT`              | `3000`         | Porta HTTP                        |
| `DB_HOST`               | `localhost`    |                                   |
| `DB_PORT`               | `5432`         |                                   |
| `DB_USER`               | `postgres`     |                                   |
| `DB_PASSWORD`           | `postgres`     |                                   |
| `DB_NAME`               | `synk_erp`     |                                   |
| `JWT_ACCESS_SECRET`     | —              | Obrigatório                       |
| `JWT_ACCESS_EXPIRES_IN` | `15m`          |                                   |
| `JWT_REFRESH_SECRET`    | —              | Obrigatório                       |
| `JWT_REFRESH_EXPIRES_IN`| `7d`           |                                   |
| `CORS_ORIGIN`           | `http://localhost:3001` |                          |
