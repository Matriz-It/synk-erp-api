import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Alinha os planos do tenant com os nomes/preços da landing page:
 * free (R$0) → pro (R$80), pro (antigo) → business (R$189), enterprise → personalizado (349+).
 * Não havia preço diferenciado por plano até aqui (fatura sempre saía fixa em
 * R$80), então remapear dados existentes é seguro — não muda nada que já foi cobrado.
 */
export class RenameTenantPlans1792000000000 implements MigrationInterface {
  name = 'RenameTenantPlans1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."tenants_plan_enum" RENAME TO "tenants_plan_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."tenants_plan_enum" AS ENUM('pro', 'business', 'personalizado')`);
    await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "plan" DROP DEFAULT`);
    await queryRunner.query(`
      ALTER TABLE "tenants" ALTER COLUMN "plan" TYPE "public"."tenants_plan_enum" USING (
        CASE "plan"::text
          WHEN 'free' THEN 'pro'
          WHEN 'pro' THEN 'business'
          WHEN 'enterprise' THEN 'personalizado'
          ELSE 'pro'
        END
      )::"public"."tenants_plan_enum"
    `);
    await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "plan" SET DEFAULT 'pro'`);
    await queryRunner.query(`DROP TYPE "public"."tenants_plan_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."tenants_plan_enum" RENAME TO "tenants_plan_enum_new"`);
    await queryRunner.query(`CREATE TYPE "public"."tenants_plan_enum" AS ENUM('free', 'pro', 'enterprise')`);
    await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "plan" DROP DEFAULT`);
    await queryRunner.query(`
      ALTER TABLE "tenants" ALTER COLUMN "plan" TYPE "public"."tenants_plan_enum" USING (
        CASE "plan"::text
          WHEN 'pro' THEN 'free'
          WHEN 'business' THEN 'pro'
          WHEN 'personalizado' THEN 'enterprise'
          ELSE 'free'
        END
      )::"public"."tenants_plan_enum"
    `);
    await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "plan" SET DEFAULT 'free'`);
    await queryRunner.query(`DROP TYPE "public"."tenants_plan_enum_new"`);
  }
}
