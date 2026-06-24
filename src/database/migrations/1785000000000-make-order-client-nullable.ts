import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeOrderClientNullable1785000000000 implements MigrationInterface {
  name = 'MakeOrderClientNullable1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Permite venda rápida sem vínculo de cliente (Consumidor Final)
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "client_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "client_id" SET NOT NULL`,
    );
  }
}
