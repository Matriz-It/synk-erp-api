import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBilling1791000000000 implements MigrationInterface {
  name = 'AddBilling1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trial_ends_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `UPDATE "tenants" SET "trial_ends_at" = "created_at" + interval '14 days' WHERE "trial_ends_at" IS NULL`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."faturas_status_enum" AS ENUM('pendente', 'pago', 'cancelado')`,
    );
    await queryRunner.query(`
      CREATE TABLE "faturas" (
        "id"           uuid                            NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"   TIMESTAMP WITH TIME ZONE        NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP WITH TIME ZONE        NOT NULL DEFAULT now(),
        "numero"       integer                         NOT NULL,
        "ciclo_inicio" character varying(10)           NOT NULL,
        "ciclo_fim"    character varying(10)           NOT NULL,
        "vencimento"   character varying(10)           NOT NULL,
        "valor"        numeric(12,2)                   NOT NULL,
        "status"       "public"."faturas_status_enum"  NOT NULL DEFAULT 'pendente',
        "pago_em"      character varying(10),
        "valor_pago"   numeric(12,2)                   DEFAULT NULL,
        "tenant_id"    uuid                            NOT NULL,
        CONSTRAINT "PK_faturas" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "FK_faturas_tenant"
       FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "faturas" DROP CONSTRAINT "FK_faturas_tenant"`);
    await queryRunner.query(`DROP TABLE "faturas"`);
    await queryRunner.query(`DROP TYPE "public"."faturas_status_enum"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "trial_ends_at"`);
  }
}
