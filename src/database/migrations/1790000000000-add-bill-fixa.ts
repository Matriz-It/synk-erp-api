import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBillFixa1790000000000 implements MigrationInterface {
  name = 'AddBillFixa1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "fixa" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN IF EXISTS "fixa"`);
  }
}
