import { MigrationInterface, QueryRunner } from "typeorm";

export class Nfe1778783518829 implements MigrationInterface {
    name = 'Nfe1778783518829'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tenants_plan_enum" AS ENUM('free', 'pro', 'enterprise')`);
        await queryRunner.query(`CREATE TYPE "public"."tenants_status_enum" AS ENUM('active', 'inactive', 'suspended')`);
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "document" character varying(18), "plan" "public"."tenants_plan_enum" NOT NULL DEFAULT 'free', "status" "public"."tenants_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "UQ_7af15a17ea82d41910b3aef3637" UNIQUE ("document"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "email" character varying(150) NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'admin', "document" character varying(14), "refresh_token" text, "tenant_id" uuid NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."clients_tipo_enum" AS ENUM('PJ', 'PF')`);
        await queryRunner.query(`CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tipo" "public"."clients_tipo_enum" NOT NULL, "razaoSocial" character varying(150) NOT NULL, "nomeFantasia" character varying(150), "documento" character varying(14) NOT NULL, "email" character varying(100), "telefone" character varying(20), "ativo" boolean NOT NULL DEFAULT true, "cep" character varying(9) NOT NULL, "logradouro" character varying(150) NOT NULL, "numero" character varying(20) NOT NULL, "complemento" character varying(100), "bairro" character varying(100) NOT NULL, "cidade" character varying(100) NOT NULL, "uf" character varying(2) NOT NULL, "total_pedidos" integer NOT NULL DEFAULT '0', "total_gasto" numeric(12,2) NOT NULL DEFAULT '0', "tenant_id" uuid NOT NULL, CONSTRAINT "UQ_2b893d8fb253ee70d40050a3896" UNIQUE ("documento", "tenant_id"), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "quote_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "quote_id" uuid NOT NULL, "product_id" character varying NOT NULL, "nome" character varying(150) NOT NULL, "sku" character varying(50) NOT NULL, "preco" numeric(10,2) NOT NULL, "qtd" integer NOT NULL, "desconto" numeric(10,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_135ad3f02b5abcf65fb5cb20ad2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."quotes_status_enum" AS ENUM('rascunho', 'pendente', 'aprovado', 'cancelado')`);
        await queryRunner.query(`CREATE TABLE "quotes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "numero" integer NOT NULL, "client_id" uuid NOT NULL, "status" "public"."quotes_status_enum" NOT NULL DEFAULT 'rascunho', "obs" text, "desconto_global" numeric(12,2) NOT NULL DEFAULT '0', "forma_pagamento" character varying(50), "data_pagamento" character varying(10), "tenant_id" uuid NOT NULL, CONSTRAINT "PK_99a0e8bcbcd8719d3a41f23c263" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."product_movements_tipo_enum" AS ENUM('entrada', 'saida')`);
        await queryRunner.query(`CREATE TABLE "product_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tipo" "public"."product_movements_tipo_enum" NOT NULL, "qtd" integer NOT NULL, "motivo" character varying(200) NOT NULL, "saldo_apos" integer NOT NULL, "operador" character varying(100) NOT NULL, "product_id" uuid NOT NULL, "user_id" character varying NOT NULL, CONSTRAINT "PK_5af5f0400894bb598b74eeeb4d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."products_categoria_enum" AS ENUM('alimentos', 'bebidas', 'limpeza', 'eletronicos', 'papelaria')`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "sku" character varying(50) NOT NULL, "nome" character varying(150) NOT NULL, "categoria" "public"."products_categoria_enum" NOT NULL, "preco" numeric(10,2) NOT NULL, "qtd" integer NOT NULL DEFAULT '0', "qtd_min" integer NOT NULL DEFAULT '10', "foto" text, "ativo" boolean NOT NULL DEFAULT true, "tenant_id" uuid NOT NULL, CONSTRAINT "UQ_a4c7f7b62f3a50d5b71720ef03f" UNIQUE ("sku", "tenant_id"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "order_id" uuid NOT NULL, "product_id" character varying NOT NULL, "nome" character varying(150) NOT NULL, "sku" character varying(50) NOT NULL, "preco" numeric(10,2) NOT NULL, "qtd" integer NOT NULL, "desconto" numeric(10,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pendente', 'em_andamento', 'entregue', 'concluido')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "numero" integer NOT NULL, "client_id" uuid NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pendente', "obs" text, "desconto_global" numeric(12,2) NOT NULL DEFAULT '0', "forma_pagamento" character varying(50), "data_pagamento" character varying(10), "tenant_id" uuid NOT NULL, CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "nfe_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "nfe_id" uuid NOT NULL, "produto_id" character varying, "sku" character varying(60) NOT NULL, "nome" character varying(120) NOT NULL, "qtd" numeric(10,3) NOT NULL, "preco" numeric(12,2) NOT NULL, "desconto" numeric(12,2) NOT NULL DEFAULT '0', "cfop" character varying(5) NOT NULL, "cst" character varying(3) NOT NULL, "bc_icms" numeric(12,2) NOT NULL DEFAULT '0', "aliq_icms" numeric(5,2) NOT NULL DEFAULT '0', "valor_icms" numeric(12,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_94fcc4e0bf1be747a60dbecdb37" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "nfe_vencimentos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "nfe_id" uuid NOT NULL, "data" character varying(10) NOT NULL, "valor" numeric(12,2) NOT NULL, "obs" text, CONSTRAINT "PK_71e19ac41747e5eebeabad25a00" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."nfes_status_enum" AS ENUM('rascunho', 'autorizada', 'rejeitada', 'cancelada')`);
        await queryRunner.query(`CREATE TYPE "public"."nfes_modalidade_frete_enum" AS ENUM('0', '1', '2', '3', '4', '9')`);
        await queryRunner.query(`CREATE TABLE "nfes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "numero" integer NOT NULL, "serie" character varying(3) NOT NULL DEFAULT '1', "data_emissao" character varying(10) NOT NULL, "data_saida" character varying(10), "natureza_operacao" character varying(120) NOT NULL, "finalidade" character varying(20) NOT NULL, "client_id" uuid NOT NULL, "status" "public"."nfes_status_enum" NOT NULL DEFAULT 'rascunho', "chave_acesso" character varying(44), "protocolo" character varying(60), "base_icms" numeric(14,2) NOT NULL DEFAULT '0', "valor_icms" numeric(14,2) NOT NULL DEFAULT '0', "base_ibs" numeric(14,2) NOT NULL DEFAULT '0', "valor_ibs" numeric(14,2) NOT NULL DEFAULT '0', "valor_cbs" numeric(14,2) NOT NULL DEFAULT '0', "valor_frete" numeric(14,2) NOT NULL DEFAULT '0', "valor_seguro" numeric(14,2) NOT NULL DEFAULT '0', "valor_desconto" numeric(14,2) NOT NULL DEFAULT '0', "valor_outro" numeric(14,2) NOT NULL DEFAULT '0', "valor_total" numeric(14,2) NOT NULL DEFAULT '0', "modalidade_frete" "public"."nfes_modalidade_frete_enum" NOT NULL DEFAULT '9', "transportadora" character varying(120), "placa_veiculo" character varying(8), "peso_liquido" numeric(10,3), "peso_bruto" numeric(10,3), "qtd_volumes" integer, "especie_volumes" character varying(60), "obs_contribuinte" text, "obs_fisco" text, "numero_pedido" character varying(60), "numero_contrato" character varying(60), "tenant_id" uuid NOT NULL, CONSTRAINT "PK_53bbff685ba6a25f073de669806" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_109638590074998bb72a2f2cf08" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_e7d8b637725986e7b5fa774a3fd" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quote_items" ADD CONSTRAINT "FK_c11d594b8cf436caaee20122fd8" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quotes" ADD CONSTRAINT "FK_c7436620804208a7496ad03aff9" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quotes" ADD CONSTRAINT "FK_16d5c8bda5e277897836d1344e5" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_movements" ADD CONSTRAINT "FK_82da5f32c8156e2a1e066d35e48" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_9c365ebf78f0e8a6d9e4827ea70" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_505ba3689ef2763acd6c4fc93a4" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_527dd6efd5f3402f729c6b3e826" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "nfe_items" ADD CONSTRAINT "FK_a7fadaf9190446e18742f7edf3a" FOREIGN KEY ("nfe_id") REFERENCES "nfes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "nfe_vencimentos" ADD CONSTRAINT "FK_9ad8e56cb6951b4d6f1acca1e5a" FOREIGN KEY ("nfe_id") REFERENCES "nfes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "nfes" ADD CONSTRAINT "FK_aec1e566ae2d10b90c0521c4a5c" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "nfes" ADD CONSTRAINT "FK_98706c7637ad7d64c18d8e15171" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nfes" DROP CONSTRAINT "FK_98706c7637ad7d64c18d8e15171"`);
        await queryRunner.query(`ALTER TABLE "nfes" DROP CONSTRAINT "FK_aec1e566ae2d10b90c0521c4a5c"`);
        await queryRunner.query(`ALTER TABLE "nfe_vencimentos" DROP CONSTRAINT "FK_9ad8e56cb6951b4d6f1acca1e5a"`);
        await queryRunner.query(`ALTER TABLE "nfe_items" DROP CONSTRAINT "FK_a7fadaf9190446e18742f7edf3a"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_527dd6efd5f3402f729c6b3e826"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_505ba3689ef2763acd6c4fc93a4"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_9c365ebf78f0e8a6d9e4827ea70"`);
        await queryRunner.query(`ALTER TABLE "product_movements" DROP CONSTRAINT "FK_82da5f32c8156e2a1e066d35e48"`);
        await queryRunner.query(`ALTER TABLE "quotes" DROP CONSTRAINT "FK_16d5c8bda5e277897836d1344e5"`);
        await queryRunner.query(`ALTER TABLE "quotes" DROP CONSTRAINT "FK_c7436620804208a7496ad03aff9"`);
        await queryRunner.query(`ALTER TABLE "quote_items" DROP CONSTRAINT "FK_c11d594b8cf436caaee20122fd8"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_e7d8b637725986e7b5fa774a3fd"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_109638590074998bb72a2f2cf08"`);
        await queryRunner.query(`DROP TABLE "nfes"`);
        await queryRunner.query(`DROP TYPE "public"."nfes_modalidade_frete_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nfes_status_enum"`);
        await queryRunner.query(`DROP TABLE "nfe_vencimentos"`);
        await queryRunner.query(`DROP TABLE "nfe_items"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TYPE "public"."products_categoria_enum"`);
        await queryRunner.query(`DROP TABLE "product_movements"`);
        await queryRunner.query(`DROP TYPE "public"."product_movements_tipo_enum"`);
        await queryRunner.query(`DROP TABLE "quotes"`);
        await queryRunner.query(`DROP TYPE "public"."quotes_status_enum"`);
        await queryRunner.query(`DROP TABLE "quote_items"`);
        await queryRunner.query(`DROP TABLE "clients"`);
        await queryRunner.query(`DROP TYPE "public"."clients_tipo_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
        await queryRunner.query(`DROP TYPE "public"."tenants_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tenants_plan_enum"`);
    }

}
