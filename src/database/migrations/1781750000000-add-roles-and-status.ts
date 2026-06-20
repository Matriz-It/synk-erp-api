import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRolesAndStatus1781750000000 implements MigrationInterface {
  name = 'AddRolesAndStatus1781750000000';

  // ALTER TYPE ... ADD VALUE cannot run inside a transaction in PostgreSQL < 12
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'proprietario'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'financeiro'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'vendedor'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" character varying(20) NOT NULL DEFAULT 'active'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "status"`,
    );
    // PostgreSQL does not support removing enum values directly.
    // To fully rollback, recreate the enum without the new values.
  }
}
