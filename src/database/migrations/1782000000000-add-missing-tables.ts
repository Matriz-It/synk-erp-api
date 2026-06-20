import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingTables1782000000000 implements MigrationInterface {
  name = 'AddMissingTables1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Suppliers ────────────────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE TYPE "public"."suppliers_tipo_enum" AS ENUM('PJ', 'PF')`,
    );
    await queryRunner.query(`
      CREATE TABLE "suppliers" (
        "id"           uuid                        NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"   TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT now(),
        "tipo"         "public"."suppliers_tipo_enum" NOT NULL,
        "razaoSocial"  character varying(150)       NOT NULL,
        "nomeFantasia" character varying(150),
        "documento"    character varying(14)        NOT NULL,
        "email"        character varying(100),
        "telefone"     character varying(20),
        "ativo"        boolean                     NOT NULL DEFAULT true,
        "cep"          character varying(9)         NOT NULL,
        "logradouro"   character varying(150)       NOT NULL,
        "numero"       character varying(20)        NOT NULL,
        "complemento"  character varying(100),
        "bairro"       character varying(100)       NOT NULL,
        "cidade"       character varying(100)       NOT NULL,
        "uf"           character varying(2)         NOT NULL,
        "tenant_id"    uuid                        NOT NULL,
        CONSTRAINT "UQ_suppliers_documento_tenant" UNIQUE ("documento", "tenant_id"),
        CONSTRAINT "PK_suppliers" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD CONSTRAINT "FK_suppliers_tenant"
       FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
       ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // ── Bills (contas a pagar) ────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE TYPE "public"."bills_status_enum" AS ENUM('aberto', 'pago', 'cancelado')`,
    );
    await queryRunner.query(`
      CREATE TABLE "bills" (
        "id"          uuid                        NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"  TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT now(),
        "numero"      integer                     NOT NULL,
        "parceiro"    character varying(150)       NOT NULL,
        "descricao"   character varying(200)       NOT NULL,
        "valor"       numeric(12,2)               NOT NULL,
        "vencimento"  character varying(10)        NOT NULL,
        "status"      "public"."bills_status_enum" NOT NULL DEFAULT 'aberto',
        "categoria"   character varying(50),
        "obs"         text,
        "pago_em"     character varying(10),
        "valor_pago"  numeric(12,2)               DEFAULT NULL,
        "tenant_id"   uuid                        NOT NULL,
        CONSTRAINT "PK_bills" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "bills" ADD CONSTRAINT "FK_bills_tenant"
       FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
       ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // ── Receivables (contas a receber) ───────────────────────────────────────
    await queryRunner.query(
      `CREATE TYPE "public"."receivables_status_enum" AS ENUM('aberto', 'pago', 'cancelado')`,
    );
    await queryRunner.query(`
      CREATE TABLE "receivables" (
        "id"             uuid                            NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"     TIMESTAMP WITH TIME ZONE        NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMP WITH TIME ZONE        NOT NULL DEFAULT now(),
        "numero"         integer                         NOT NULL,
        "parceiro"       character varying(150)           NOT NULL,
        "descricao"      character varying(200)           NOT NULL,
        "valor"          numeric(12,2)                   NOT NULL,
        "vencimento"     character varying(10)            NOT NULL,
        "status"         "public"."receivables_status_enum" NOT NULL DEFAULT 'aberto',
        "categoria"      character varying(50),
        "obs"            text,
        "recebido_em"    character varying(10),
        "valor_recebido" numeric(12,2)                   DEFAULT NULL,
        "tenant_id"      uuid                            NOT NULL,
        CONSTRAINT "PK_receivables" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "receivables" ADD CONSTRAINT "FK_receivables_tenant"
       FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
       ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // ── Purchase Orders ───────────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE TYPE "public"."purchase_orders_status_enum"
       AS ENUM('rascunho', 'pendente', 'aprovado', 'recebido', 'cancelado')`,
    );
    await queryRunner.query(`
      CREATE TABLE "purchase_orders" (
        "id"              uuid                                    NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"      TIMESTAMP WITH TIME ZONE                NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP WITH TIME ZONE                NOT NULL DEFAULT now(),
        "numero"          integer                                 NOT NULL,
        "supplier_id"     uuid                                    NOT NULL,
        "status"          "public"."purchase_orders_status_enum"  NOT NULL DEFAULT 'rascunho',
        "obs"             text,
        "desconto_global" numeric(12,2)                           NOT NULL DEFAULT '0',
        "forma_pagamento" character varying(50),
        "data_pagamento"  character varying(10),
        "tenant_id"       uuid                                    NOT NULL,
        CONSTRAINT "PK_purchase_orders" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD CONSTRAINT "FK_purchase_orders_supplier"
       FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id")
       ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD CONSTRAINT "FK_purchase_orders_tenant"
       FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
       ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // ── Purchase Order Items ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "purchase_order_items" (
        "id"         uuid                     NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "order_id"   uuid                     NOT NULL,
        "product_id" character varying        NOT NULL,
        "nome"       character varying(150)   NOT NULL,
        "sku"        character varying(50)    NOT NULL,
        "preco"      numeric(10,2)            NOT NULL,
        "qtd"        integer                  NOT NULL,
        "desconto"   numeric(10,2)            NOT NULL DEFAULT '0',
        CONSTRAINT "PK_purchase_order_items" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" ADD CONSTRAINT "FK_purchase_order_items_order"
       FOREIGN KEY ("order_id") REFERENCES "purchase_orders"("id")
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // ── orders.concluido_em (coluna adicionada após a migration inicial) ──────
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "concluido_em" character varying(10)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "concluido_em"`);
    await queryRunner.query(`ALTER TABLE "purchase_order_items" DROP CONSTRAINT "FK_purchase_order_items_order"`);
    await queryRunner.query(`DROP TABLE "purchase_order_items"`);
    await queryRunner.query(`ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_purchase_orders_tenant"`);
    await queryRunner.query(`ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_purchase_orders_supplier"`);
    await queryRunner.query(`DROP TABLE "purchase_orders"`);
    await queryRunner.query(`DROP TYPE "public"."purchase_orders_status_enum"`);
    await queryRunner.query(`ALTER TABLE "receivables" DROP CONSTRAINT "FK_receivables_tenant"`);
    await queryRunner.query(`DROP TABLE "receivables"`);
    await queryRunner.query(`DROP TYPE "public"."receivables_status_enum"`);
    await queryRunner.query(`ALTER TABLE "bills" DROP CONSTRAINT "FK_bills_tenant"`);
    await queryRunner.query(`DROP TABLE "bills"`);
    await queryRunner.query(`DROP TYPE "public"."bills_status_enum"`);
    await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "FK_suppliers_tenant"`);
    await queryRunner.query(`DROP TABLE "suppliers"`);
    await queryRunner.query(`DROP TYPE "public"."suppliers_tipo_enum"`);
  }
}
