import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixQuotesStatusEnum1783000000000 implements MigrationInterface {
  name = 'FixQuotesStatusEnum1783000000000';

  // ALTER TYPE ... ADD VALUE cannot run inside a transaction in PostgreSQL < 12
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."quotes_status_enum" ADD VALUE IF NOT EXISTS 'concluido'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL não suporta remoção de valores de enum diretamente.
    // Para reverter: recriar o tipo sem o valor 'concluido'.
  }
}
