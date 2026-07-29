import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMercadopagoAssinaturas1793000000000 implements MigrationInterface {
  name = 'AddMercadopagoAssinaturas1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."assinaturas_status_enum" AS ENUM('pending', 'authorized', 'paused', 'cancelled')`,
    );
    await queryRunner.query(`
      CREATE TABLE "assinaturas" (
        "id"                 uuid                                NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"         TIMESTAMP WITH TIME ZONE           NOT NULL DEFAULT now(),
        "updated_at"         TIMESTAMP WITH TIME ZONE           NOT NULL DEFAULT now(),
        "plan"               "public"."tenants_plan_enum"        NOT NULL,
        "status"             "public"."assinaturas_status_enum"  NOT NULL DEFAULT 'pending',
        "mp_preapproval_id"  character varying(64)               NOT NULL,
        "mp_plan_id"         character varying(64)               NOT NULL,
        "payer_email"        character varying(255)              NOT NULL,
        "next_payment_date"  TIMESTAMP WITH TIME ZONE,
        "tenant_id"          uuid                                NOT NULL,
        CONSTRAINT "UQ_assinaturas_mp_preapproval_id" UNIQUE ("mp_preapproval_id"),
        CONSTRAINT "PK_assinaturas" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "assinaturas" ADD CONSTRAINT "FK_assinaturas_tenant"
       FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "faturas" ADD COLUMN IF NOT EXISTS "mp_preapproval_id" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD COLUMN IF NOT EXISTS "mp_invoice_id" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "UQ_faturas_mp_invoice_id" UNIQUE ("mp_invoice_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "faturas" DROP CONSTRAINT "UQ_faturas_mp_invoice_id"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN IF EXISTS "mp_invoice_id"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN IF EXISTS "mp_preapproval_id"`);

    await queryRunner.query(`ALTER TABLE "assinaturas" DROP CONSTRAINT "FK_assinaturas_tenant"`);
    await queryRunner.query(`DROP TABLE "assinaturas"`);
    await queryRunner.query(`DROP TYPE "public"."assinaturas_status_enum"`);
  }
}
