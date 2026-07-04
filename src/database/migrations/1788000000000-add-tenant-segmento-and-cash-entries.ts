import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantSegmentoAndCashEntries1788000000000 implements MigrationInterface {
  name = 'AddTenantSegmentoAndCashEntries1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // tenants.segmento
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."tenants_segmento_enum" AS ENUM('comercio', 'industria', 'servicos', 'outros');
       EXCEPTION WHEN duplicate_object THEN NULL;
       END $$`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "segmento" "public"."tenants_segmento_enum"`,
    );

    // cash_entries
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."cash_entries_tipo_enum" AS ENUM('entrada', 'saida');
       EXCEPTION WHEN duplicate_object THEN NULL;
       END $$`,
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cash_entries" (
        "id"         uuid                     NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "descricao"  character varying(200)   NOT NULL,
        "tipo"       "public"."cash_entries_tipo_enum" NOT NULL,
        "valor"      numeric(12,2)            NOT NULL,
        "data"       character varying(10)    NOT NULL,
        "tenant_id"  uuid                     NOT NULL,
        CONSTRAINT "PK_cash_entries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cash_entries_tenant"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cash_entries"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."cash_entries_tipo_enum"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "segmento"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."tenants_segmento_enum"`);
  }
}
