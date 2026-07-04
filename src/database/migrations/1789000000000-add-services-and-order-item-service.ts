import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServicesAndOrderItemService1789000000000 implements MigrationInterface {
  name = 'AddServicesAndOrderItemService1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // services
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "services" (
        "id"          uuid                     NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "codigo"      character varying(50)    NOT NULL,
        "nome"        character varying(150)   NOT NULL,
        "descricao"   text,
        "preco"       numeric(10,2)            NOT NULL,
        "preco_custo" numeric(10,2),
        "ativo"       boolean                  NOT NULL DEFAULT true,
        "tenant_id"   uuid                     NOT NULL,
        CONSTRAINT "PK_services" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_services_codigo_tenant" UNIQUE ("codigo", "tenant_id"),
        CONSTRAINT "FK_services_tenant"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // order_items: item pode ser de produto OU de serviço
    await queryRunner.query(
      `ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ALTER COLUMN "product_id" TYPE uuid USING "product_id"::uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "service_id" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "service_id"`);
    await queryRunner.query(
      `ALTER TABLE "order_items" ALTER COLUMN "product_id" TYPE character varying USING "product_id"::text`,
    );
    await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "product_id" SET NOT NULL`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
  }
}
