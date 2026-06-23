import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrecoCustoToProducts1784000000000 implements MigrationInterface {
  name = 'AddPrecoCustoToProducts1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "preco_custo" numeric(10,2) DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "preco_custo"`);
  }
}
