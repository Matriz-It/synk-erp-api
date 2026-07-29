import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reverte a Fase 2 (assinaturas recorrentes via Mercado Pago) — PIX e boleto
 * não têm como ser cobrados automaticamente, então o modelo virou fatura
 * avulsa paga manualmente a cada ciclo (ver Fase 3 do plano). `mp_preapproval_id`
 * e `mp_invoice_id` viram uma única coluna `mp_payment_id`.
 */
export class RemoveMercadopagoAssinaturas1794000000000 implements MigrationInterface {
  name = 'RemoveMercadopagoAssinaturas1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "faturas" DROP CONSTRAINT IF EXISTS "UQ_faturas_mp_invoice_id"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN IF EXISTS "mp_invoice_id"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN IF EXISTS "mp_preapproval_id"`);

    await queryRunner.query(`ALTER TABLE "assinaturas" DROP CONSTRAINT IF EXISTS "FK_assinaturas_tenant"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "assinaturas"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."assinaturas_status_enum"`);

    await queryRunner.query(
      `ALTER TABLE "faturas" ADD COLUMN IF NOT EXISTS "mp_payment_id" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "UQ_faturas_mp_payment_id" UNIQUE ("mp_payment_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "faturas" DROP CONSTRAINT "UQ_faturas_mp_payment_id"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN IF EXISTS "mp_payment_id"`);

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
}
